const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const collections = {
  User: "users",
  PendingRegistration: "pending_registrations",
  Quiz: "quizzes",
  Attempt: "attempts",
  StudentProfile: "student_profiles",
};

const dateFields = new Set([
  "createdAt",
  "updatedAt",
  "expiresAt",
  "resetPasswordExpires",
  "startDateTime",
  "endDateTime",
  "startedAt",
  "submittedAt",
]);

let database;
let databasePath;

const initializeDatabase = () => {
  if (database) return database;

  const configuredPath = process.env.SQLITE_PATH;
  databasePath = configuredPath
    ? configuredPath === ":memory:"
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath)
    : path.join(__dirname, "..", "data", "quiz.sqlite");

  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS users (
      _id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_registrations (
      _id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      verification_token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      _id TEXT PRIMARY KEY,
      created_by TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attempts (
      _id TEXT PRIMARY KEY,
      student TEXT NOT NULL,
      quiz TEXT NOT NULL,
      started_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      _id TEXT PRIMARY KEY,
      student TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      data TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS quizzes_created_by_idx ON quizzes(created_by);
    CREATE INDEX IF NOT EXISTS quizzes_status_created_at_idx ON quizzes(status, created_at);
    CREATE INDEX IF NOT EXISTS attempts_student_quiz_idx ON attempts(student, quiz);
    CREATE INDEX IF NOT EXISTS attempts_quiz_created_at_idx ON attempts(quiz, created_at);
  `);

  return database;
};

const getDatabase = () => {
  if (!database) {
    throw new Error("SQLite has not been initialized. Start the backend first.");
  }

  return database;
};

const getDatabasePath = () => databasePath;

const closeDatabase = () => {
  if (!database) return;
  database.close();
  database = null;
};

const parseDocument = (serialized) =>
  JSON.parse(serialized, (key, value) => {
    if (dateFields.has(key) && typeof value === "string") {
      const parsedDate = new Date(value);
      return Number.isNaN(parsedDate.getTime()) ? value : parsedDate;
    }

    return value;
  });

const getCollection = (modelName) => {
  const collection = collections[modelName];
  if (!collection) throw new Error(`Unknown SQLite model: ${modelName}`);
  return collection;
};

const readDocuments = (modelName) => {
  const collection = getCollection(modelName);
  return getDatabase()
    .prepare(`SELECT data FROM ${collection}`)
    .all()
    .map((row) => parseDocument(row.data));
};

const readDocumentById = (modelName, id) => {
  const collection = getCollection(modelName);
  const row = getDatabase()
    .prepare(`SELECT data FROM ${collection} WHERE _id = ?`)
    .get(String(id));

  return row ? parseDocument(row.data) : null;
};

const saveDocument = (modelName, document) => {
  const collection = getCollection(modelName);
  const serialized = JSON.stringify(document);
  const id = String(document._id);

  if (modelName === "User") {
    getDatabase().prepare(`
      INSERT INTO users (_id, email, data) VALUES (?, ?, ?)
      ON CONFLICT(_id) DO UPDATE SET email = excluded.email, data = excluded.data
    `).run(id, document.email, serialized);
  } else if (modelName === "PendingRegistration") {
    getDatabase().prepare(`
      INSERT INTO pending_registrations (_id, email, verification_token_hash, expires_at, data)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(_id) DO UPDATE SET
        email = excluded.email,
        verification_token_hash = excluded.verification_token_hash,
        expires_at = excluded.expires_at,
        data = excluded.data
    `).run(
      id,
      document.email,
      document.verificationTokenHash,
      new Date(document.expiresAt).toISOString(),
      serialized
    );
  } else if (modelName === "Quiz") {
    getDatabase().prepare(`
      INSERT INTO quizzes (_id, created_by, status, created_at, data) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(_id) DO UPDATE SET
        created_by = excluded.created_by,
        status = excluded.status,
        created_at = excluded.created_at,
        data = excluded.data
    `).run(
      id,
      document.createdBy,
      document.status,
      new Date(document.createdAt).toISOString(),
      serialized
    );
  } else if (modelName === "Attempt") {
    getDatabase().prepare(`
      INSERT INTO attempts (_id, student, quiz, started_at, created_at, data)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(_id) DO UPDATE SET
        student = excluded.student,
        quiz = excluded.quiz,
        started_at = excluded.started_at,
        created_at = excluded.created_at,
        data = excluded.data
    `).run(
      id,
      document.student,
      document.quiz,
      new Date(document.startedAt).toISOString(),
      new Date(document.createdAt).toISOString(),
      serialized
    );
  } else {
    getDatabase().prepare(`
      INSERT INTO student_profiles (_id, student, created_at, data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(_id) DO UPDATE SET
        student = excluded.student,
        created_at = excluded.created_at,
        data = excluded.data
    `).run(
      id,
      document.student,
      new Date(document.createdAt).toISOString(),
      serialized
    );
  }

  return document;
};

const deleteDocument = (modelName, id) => {
  const collection = getCollection(modelName);
  const existing = readDocumentById(modelName, id);
  if (!existing) return null;

  getDatabase().prepare(`DELETE FROM ${collection} WHERE _id = ?`).run(String(id));
  return existing;
};

module.exports = {
  collections,
  closeDatabase,
  deleteDocument,
  getDatabase,
  getDatabasePath,
  initializeDatabase,
  parseDocument,
  readDocumentById,
  readDocuments,
  saveDocument,
};