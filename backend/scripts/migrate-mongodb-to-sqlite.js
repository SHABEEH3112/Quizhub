require("dotenv").config();

const mongoose = require("mongoose");
const {
  getDatabase,
  initializeDatabase,
  saveDocument,
} = require("../config/sqlite");

const sourceCollections = [
  ["users", "User"],
  ["pendingregistrations", "PendingRegistration"],
  ["studentprofiles", "StudentProfile"],
  ["quizzes", "Quiz"],
  ["attempts", "Attempt"],
];

const normalizeMongoValue = (value) => {
  if (value instanceof Date) return value;
  if (value && typeof value.toHexString === "function") {
    return value.toHexString();
  }
  if (Array.isArray(value)) return value.map(normalizeMongoValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeMongoValue(entry)])
    );
  }
  return value;
};

const migrate = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required in backend/.env to import existing MongoDB data.");
  }

  initializeDatabase();
  const database = getDatabase();
  const totalRows = [
    "users",
    "pending_registrations",
    "student_profiles",
    "quizzes",
    "attempts",
  ].reduce((total, table) => total + database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count, 0);

  if (totalRows > 0) {
    throw new Error("SQLite database already contains data; migration stopped without changing either database.");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || "test",
  });

  const mongoDatabase = mongoose.connection.db;
  const existingCollections = new Set(
    (await mongoDatabase.listCollections().toArray()).map(({ name }) => name)
  );
  const counts = {};

  database.exec("BEGIN IMMEDIATE");
  try {
    for (const [collectionName, modelName] of sourceCollections) {
      if (!existingCollections.has(collectionName)) {
        counts[modelName] = 0;
        continue;
      }

      const documents = await mongoDatabase
        .collection(collectionName)
        .find({})
        .toArray();

      for (const [index, document] of documents.entries()) {
        try {
          const normalizedDocument = normalizeMongoValue(document);
          if (modelName === "Quiz") {
            normalizedDocument.createdBy ??= "";
            normalizedDocument.status ??= "draft";
          }
          if (modelName === "Attempt") {
            normalizedDocument.startedAt ??= normalizedDocument.createdAt || new Date();
            normalizedDocument.submittedAt ??= normalizedDocument.createdAt || normalizedDocument.startedAt;
            normalizedDocument.answers ??= [];
            normalizedDocument.totalMarks ??= 0;
            normalizedDocument.passingMarks ??= 0;
            normalizedDocument.percentage ??= 0;
            normalizedDocument.passed ??= false;
            normalizedDocument.attemptNumber ??= 1;
            normalizedDocument.autoSubmitted ??= false;
          }
          saveDocument(modelName, normalizedDocument);
        } catch (error) {
          throw new Error(
            `Failed importing ${collectionName} record ${index + 1} (${Object.keys(document).join(", ")}): ${error.message}`
          );
        }
      }

      counts[modelName] = documents.length;
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    await mongoose.disconnect();
  }

  console.log("MongoDB data copied to SQLite:");
  for (const [modelName, count] of Object.entries(counts)) {
    console.log(`  ${modelName}: ${count}`);
  }
  console.log("MongoDB source data was left unchanged.");
};

migrate().catch(async (error) => {
  console.error("SQLite migration failed:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});