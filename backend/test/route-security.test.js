const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const express = require("express");
const fs = require("node:fs");
const jwt = require("jsonwebtoken");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const nodemailer = require("nodemailer");

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-routes-test-"));
process.env.SQLITE_PATH = path.join(temporaryDirectory, "quiz.sqlite");
process.env.JWT_SECRET = "route-test-secret";
process.env.SMTP_HOST = "smtp.example.test";
process.env.SMTP_USER = "quiz@example.test";
process.env.SMTP_PASS = "test-password";
process.env.CLIENT_URL = "http://127.0.0.1:4173";

const sentEmails = [];
const originalCreateTransport = nodemailer.createTransport;
nodemailer.createTransport = () => ({
  sendMail: async (message) => sentEmails.push(message),
});

const store = require("../config/sqlite");
const User = require("../models/User");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");
const app = express();
app.use(express.json());
app.use("/api/auth", require("../routes/auth"));
app.use("/api/quizzes", require("../routes/quiz"));
app.use("/api/attempts", require("../routes/attempt"));

let server;
let baseUrl;

before(async () => {
  store.initializeDatabase();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  store.closeDatabase();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  nodemailer.createTransport = originalCreateTransport;
});

const postJson = (url, body) => fetch(`${baseUrl}${url}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

test("password reset token is emailed, hashed in SQLite, and not returned by the API", async () => {
  const user = await new User({
    name: "Reset User",
    email: "reset@example.test",
    password: await bcrypt.hash("old-password", 10),
    role: "student",
  }).save();

  const response = await postJson("/api/auth/forgot-password", {
    email: user.email,
  });
  const responseData = await response.json();

  assert.equal(response.status, 202);
  assert.equal(responseData.resetToken, undefined);
  assert.equal(sentEmails.length, 1);

  const unknownEmailResponse = await postJson("/api/auth/forgot-password", {
    email: "unknown@example.test",
  });
  const unknownEmailData = await unknownEmailResponse.json();
  assert.equal(unknownEmailResponse.status, response.status);
  assert.equal(unknownEmailData.message, responseData.message);
  assert.equal(sentEmails.length, 1);

  const emailLink = sentEmails[0].text.match(/https?:\/\/\S+/)?.[0];
  assert.ok(emailLink);
  const resetToken = new URL(emailLink).searchParams.get("reset");
  assert.ok(resetToken);

  const storedUser = await User.findById(user._id);
  assert.notEqual(storedUser.resetPasswordTokenHash, resetToken);
  assert.equal(storedUser.resetPasswordToken, undefined);

  const resetResponse = await postJson("/api/auth/reset-password", {
    token: resetToken,
    newPassword: "new-password",
  });

  assert.equal(resetResponse.status, 200);
  const updatedUser = await User.findById(user._id);
  assert.equal(await bcrypt.compare("new-password", updatedUser.password), true);
  assert.equal(updatedUser.resetPasswordTokenHash, "");
});

test("quiz creation respects manual total marks when validating passing marks", async () => {
  const teacherToken = jwt.sign(
    { userId: "teacher-id", role: "teacher" },
    process.env.JWT_SECRET
  );
  const response = await postJson("/api/quizzes", {
    token: teacherToken,
    title: "Manual total marks test",
    timeLimit: 10,
    totalMarks: 10,
    passingMarks: 9,
    questions: [{
      question: "A test question?",
      options: ["A", "B", "C", "D"],
      correctAnswer: "A",
      marks: 1,
    }],
  });
  const responseData = await response.json();

  assert.equal(response.status, 201);
  assert.equal(responseData.quiz.totalMarks, 10);
  assert.equal(responseData.quiz.passingMarks, 9);
});

test("attempt submission rejects repeated answers for the same question", async () => {
  const student = await new User({
    name: "Quiz Student",
    email: "student@example.test",
    password: "hashed-password",
    role: "student",
  }).save();
  const quiz = await new Quiz({
    title: "Duplicate-answer test",
    createdBy: "teacher-id",
    status: "published",
    timeLimit: 30,
    questions: [{
      question: "One plus one?",
      options: ["2", "3", "4", "5"],
      correctAnswer: "2",
      marks: 1,
    }],
  }).save();
  const startedAt = Date.now();
  const sessionQuestionId = quiz.questions[0]._id;
  const studentToken = jwt.sign({ userId: student._id, role: "student" }, process.env.JWT_SECRET);
  const quizSessionToken = jwt.sign({
    userId: student._id,
    quizId: quiz._id,
    startedAt,
    questionIds: [sessionQuestionId],
  }, process.env.JWT_SECRET);

  const response = await postJson("/api/attempts", {
    token: studentToken,
    quizId: quiz._id,
    quizSessionToken,
    answers: [
      { questionId: sessionQuestionId, answer: "2" },
      { questionId: sessionQuestionId, answer: "2" },
    ],
  });

  assert.equal(response.status, 400);
  assert.equal(await Attempt.countDocuments({ student: student._id, quiz: quiz._id }), 0);
});

test("attempt submission still scores and persists a valid answer set", async () => {
  const student = await new User({
    name: "Scoring Student",
    email: "scoring@example.test",
    password: "hashed-password",
    role: "student",
  }).save();
  const quiz = await new Quiz({
    title: "Valid scoring test",
    createdBy: "teacher-id",
    status: "published",
    timeLimit: 30,
    passingMarks: 3,
    questions: [
      {
        question: "One plus one?",
        options: ["2", "3", "4", "5"],
        correctAnswer: "2",
        marks: 2,
      },
      {
        question: "Two plus two?",
        options: ["2", "3", "4", "5"],
        correctAnswer: "4",
        marks: 3,
      },
    ],
  }).save();
  const startedAt = Date.now();
  const studentToken = jwt.sign({ userId: student._id, role: "student" }, process.env.JWT_SECRET);
  const quizSessionToken = jwt.sign({
    userId: student._id,
    quizId: quiz._id,
    startedAt,
    questionIds: quiz.questions.map((question) => question._id),
  }, process.env.JWT_SECRET);

  const response = await postJson("/api/attempts", {
    token: studentToken,
    quizId: quiz._id,
    quizSessionToken,
    answers: quiz.questions.map((question) => ({
      questionId: question._id,
      answer: question.correctAnswer,
    })),
  });
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.score, 5);
  assert.equal(result.totalMarks, 5);
  assert.equal(result.percentage, 100);
  assert.equal(result.passed, true);
  assert.equal(await Attempt.countDocuments({ student: student._id, quiz: quiz._id }), 1);
});

test("attempt submission rejects a session after its deadline grace period", async () => {
  const student = await new User({
    name: "Late Student",
    email: "late@example.test",
    password: "hashed-password",
    role: "student",
  }).save();
  const quiz = await new Quiz({
    title: "Timeout test",
    createdBy: "teacher-id",
    status: "published",
    timeLimit: 1,
    questions: [{
      question: "One plus one?",
      options: ["2", "3", "4", "5"],
      correctAnswer: "2",
      marks: 1,
    }],
  }).save();
  const startedAt = Date.now() - 70_000;
  const studentToken = jwt.sign({ userId: student._id, role: "student" }, process.env.JWT_SECRET);
  const quizSessionToken = jwt.sign({
    userId: student._id,
    quizId: quiz._id,
    startedAt,
    questionIds: [quiz.questions[0]._id],
  }, process.env.JWT_SECRET);

  const response = await postJson("/api/attempts", {
    token: studentToken,
    quizId: quiz._id,
    quizSessionToken,
    answers: [{ questionId: quiz.questions[0]._id, answer: "2" }],
  });

  assert.equal(response.status, 408);
  assert.equal(await Attempt.countDocuments({ student: student._id, quiz: quiz._id }), 0);
});