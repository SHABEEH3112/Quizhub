const { SQLiteModel } = require("./sqliteModel");

class User extends SQLiteModel {
  static modelName = "User";

  constructor(data = {}) {
    super({
      role: "student",
      rollNumber: "",
      className: "",
      section: "",
      subject: "",
      profilePicture: "",
      teacherId: "",
      department: "",
      classSemester: "",
      studentGroup: "",
      resetPasswordTokenHash: "",
      resetPasswordExpires: null,
      ...data,
    });
  }
}

module.exports = User;