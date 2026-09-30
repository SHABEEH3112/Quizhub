const { getDatabasePath, initializeDatabase } = require("./sqlite");

const connectDB = async () => {
  initializeDatabase();
  console.log(`SQLite database connected: ${getDatabasePath()}`);
};

module.exports = connectDB;
