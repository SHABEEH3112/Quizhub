const { SQLiteModel } = require("./sqliteModel");

class Attempt extends SQLiteModel {
  static modelName = "Attempt";
  static populateRefs = {
    quiz: () => require("./Quiz"),
    student: () => require("./User"),
  };

  constructor(data = {}) {
    super({
      answers: [],
      totalMarks: 0,
      passingMarks: 0,
      percentage: 0,
      passed: false,
      attemptNumber: 1,
      autoSubmitted: false,
      ...data,
    });
  }
}

module.exports = Attempt;