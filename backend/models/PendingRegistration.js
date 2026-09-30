const { SQLiteModel } = require("./sqliteModel");

class PendingRegistration extends SQLiteModel {
  static modelName = "PendingRegistration";

  constructor(data = {}) {
    super({ rollNumber: "", ...data });
  }
}

module.exports = PendingRegistration;