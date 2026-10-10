const mongoose = require("mongoose");
const { getDatabasePath, initializeDatabase } = require("./sqlite");

const connectDB = async () => {
  const mongoUri = (process.env.MONGO_URI || "").trim();

  if (mongoUri) {
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGO_DB_NAME || undefined,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return;
  }

  if (process.env.VERCEL) {
    throw new Error("MONGO_URI must be configured on Vercel; local SQLite is not persistent there.");
  }

  initializeDatabase();
  console.log(`SQLite database connected: ${getDatabasePath()}`);
};

module.exports = connectDB;
