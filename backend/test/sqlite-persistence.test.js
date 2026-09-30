const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-sqlite-test-"));
process.env.SQLITE_PATH = path.join(temporaryDirectory, "quiz.sqlite");

const store = require("../config/sqlite");
const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");

after(() => {
  store.closeDatabase();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("SQLite data survives reopening and supports app query patterns", async () => {
  store.initializeDatabase();

  const teacher = await new User({
    name: "Teacher",
    email: "teacher@example.com",
    password: "hashed-password",
    role: "teacher",
    teacherId: "T-001",
  }).save();
  const student = await new User({
    name: "Student",
    email: "student@example.com",
    password: "hashed-password",
    role: "student",
  }).save();
  const pending = await new PendingRegistration({
    name: "Pending",
    email: "pending@example.com",
    password: "hashed-password",
    role: "student",
    verificationTokenHash: "token-hash",
    expiresAt: new Date(Date.now() + 60_000),
  }).save();
  const quiz = await new Quiz({
    title: "Local quiz",
    createdBy: teacher._id,
    status: "published",
    questions: [{
      question: "Question",
      options: ["A", "B", "C", "D"],
      correctAnswer: "A",
      marks: 1,
    }],
  }).save();
  const attempt = await new Attempt({
    student: student._id,
    quiz: quiz._id,
    answers: [{ answer: "A" }],
    score: 1,
    totalQuestions: 1,
    totalMarks: 1,
    passingMarks: 1,
    percentage: 100,
    passed: true,
    attemptNumber: 1,
    startedAt: new Date(),
    submittedAt: new Date(),
  }).save();

  store.closeDatabase();
  store.initializeDatabase();

  const restoredUser = await User.findById(student._id);
  assert.equal(restoredUser.email, "student@example.com");
  const restoredTeacher = await User.findById(teacher._id);
  assert.equal(restoredTeacher.teacherId, "T-001");
  assert.equal(fs.existsSync(process.env.SQLITE_PATH), true);

  const restoredPending = await PendingRegistration.findOne({
    verificationTokenHash: "token-hash",
    expiresAt: { $gt: new Date() },
  });
  assert.equal(restoredPending.email, "pending@example.com");

  const publicQuiz = await Quiz.findOne({ _id: quiz._id }).select(
    "-questions.correctAnswer"
  );
  assert.equal(publicQuiz.questions[0].correctAnswer, undefined);

  const attempts = await Attempt.find({ quiz: { $in: [quiz._id] } })
    .populate("student", "name email")
    .populate("quiz", "title");
  assert.equal(attempts[0]._id, attempt._id);
  assert.equal(attempts[0].student.name, "Student");
  assert.equal(attempts[0].quiz.title, "Local quiz");
});