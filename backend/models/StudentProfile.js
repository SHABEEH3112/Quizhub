const { SQLiteModel } = require("./sqliteModel");

class StudentProfile extends SQLiteModel {
  static modelName = "StudentProfile";

  constructor(data = {}) {
    super(data);
  }
}

module.exports = StudentProfile;