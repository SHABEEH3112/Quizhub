const mongoose = require("mongoose");
const { getDatabasePath, initializeDatabase } = require("./sqlite");

const connectDB = async () => {
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || undefined,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return;
  }

  initializeDatabase();
  console.log(`SQLite database connected: ${getDatabasePath()}`);
};

module.exports = connectDB;
