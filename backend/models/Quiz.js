const { SQLiteModel, createId } = require("./sqliteModel");

class Quiz extends SQLiteModel {
  static modelName = "Quiz";

  constructor(data = {}) {
    super({
      subject: "",
      department: "",
      classSemester: "",
      description: "",
      timeLimit: 0,
      totalMarks: 0,
      passingMarks: 0,
      questions: [],
      numberOfAttempts: 1,
      randomizeQuestions: false,
      randomizeOptions: false,
      showResultImmediately: true,
      startDateTime: null,
      endDateTime: null,
      assignedDepartment: "",
      assignedClassSemester: "",
      studentGroup: "All Students",
      status: "draft",
      ...data,
    });

    this.questions = this.questions.map((question) => ({
      ...question,
      _id: String(question._id || createId()),
    }));
  }
}

module.exports = Quiz;