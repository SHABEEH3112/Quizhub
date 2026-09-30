const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Attempt = require("../models/Attempt");
const Quiz = require("../models/Quiz");
const User = require("../models/User");

const router = express.Router();

// =====================================================
// GET TOKEN
// =====================================================

function getToken(req) {
  const authHeader = req.headers.authorization;

  if (
    authHeader &&
    authHeader.startsWith("Bearer ")
  ) {
    return authHeader.substring(7);
  }

  return req.body?.token || req.query?.token || null;
}

// =====================================================
// VERIFY STUDENT
// =====================================================

function verifyStudent(req, res) {
  const token = getToken(req);

  if (!token) {
    res.status(401).json({
      message: "Authentication token is required",
    });

    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "student") {
      res.status(403).json({
        message:
          "Only students can perform this action",
      });

      return null;
    }

    return decoded;
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired token",
    });

    return null;
  }
}

// =====================================================
// TEACHER AUTH
// =====================================================

const verifyTeacher = (req, res, next) => {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        message:
          "Authentication token is required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "teacher") {
      return res.status(403).json({
        message:
          "Only teachers can view results",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.log(
      "TEACHER AUTH ERROR:",
      error.message
    );

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// =====================================================
// QUIZ SCHEDULE CHECK
// =====================================================

function checkQuizSchedule(quiz) {
  const now = new Date();

  if (
    quiz.startDateTime &&
    now < new Date(quiz.startDateTime)
  ) {
    return {
      allowed: false,
      message:
        "This quiz has not started yet.",
    };
  }

  if (
    quiz.endDateTime &&
    now > new Date(quiz.endDateTime)
  ) {
    return {
      allowed: false,
      message:
        "This quiz has already ended.",
    };
  }

  return {
    allowed: true,
  };
}

// =====================================================
// SHUFFLE ARRAY
// =====================================================

function shuffle(array) {
  const result = [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

// =====================================================
// BUILD STUDENT QUESTIONS
// =====================================================

function buildStudentQuestions(quiz) {
  let questions = quiz.questions.map(
    (question) => {
      let options = [...question.options];

      if (quiz.randomizeOptions) {
        options = shuffle(options);
      }

      return {
        questionId: question._id.toString(),
        question: question.question,
        options,
        marks: Number(question.marks || 1),
      };
    }
  );

  if (quiz.randomizeQuestions) {
    questions = shuffle(questions);
  }

  return questions;
}

// =====================================================
// ASSIGNMENT CHECK
// =====================================================

function checkAssignment(quiz, student) {
  const assignedDepartment =
    String(
      quiz.assignedDepartment || ""
    )
      .trim()
      .toLowerCase();

  const assignedClass =
    String(
      quiz.assignedClassSemester || ""
    )
      .trim()
      .toLowerCase();

  const assignedGroup =
    String(
      quiz.studentGroup ||
        "All Students"
    )
      .trim()
      .toLowerCase();

  const studentDepartment =
    String(
      student.department ||
        ""
    )
      .trim()
      .toLowerCase();

  const studentClass =
    String(
      student.classSemester ||
        student.className ||
        ""
    )
      .trim()
      .toLowerCase();

  const studentGroup =
    String(
      student.studentGroup ||
        ""
    )
      .trim()
      .toLowerCase();

  // If quiz has department assignment
  // and student's department is available,
  // verify it.
  if (
    assignedDepartment &&
    studentDepartment &&
    assignedDepartment !==
      studentDepartment
  ) {
    return false;
  }

  // If quiz has class assignment
  // and student's class is available,
  // verify it.
  if (
    assignedClass &&
    studentClass &&
    assignedClass !==
      studentClass
  ) {
    return false;
  }

  // If specific student group is assigned
  if (
    assignedGroup &&
    assignedGroup !== "all students" &&
    studentGroup &&
    assignedGroup !== studentGroup
  ) {
    return false;
  }

  return true;
}

// =====================================================
// FIND ORIGINAL QUESTION
// =====================================================

function findQuestion(
  quiz,
  questionId,
  fallbackIndex,
  sessionQuestionIds
) {
  // First priority: question ID
  if (questionId) {
    const question =
      quiz.questions.find(
        (q) =>
          String(q._id) ===
          String(questionId)
      );

    if (question) {
      return question;
    }
  }

  // If randomized questions were used,
  // use the exact session question order.
  if (
    Array.isArray(sessionQuestionIds) &&
    sessionQuestionIds[fallbackIndex]
  ) {
    const question =
      quiz.questions.find(
        (q) =>
          String(q._id) ===
          String(
            sessionQuestionIds[
              fallbackIndex
            ]
          )
      );

    if (question) {
      return question;
    }
  }

  // Normal quiz order
  return (
    quiz.questions[fallbackIndex] ||
    null
  );
}

// =====================================================
// GET ANSWER VALUE
// =====================================================

function getAnswerValue(answerItem) {
  if (
    answerItem &&
    typeof answerItem === "object"
  ) {
    return answerItem.answer;
  }

  return answerItem;
}

// =====================================================
// START QUIZ
// =====================================================

router.post(
  "/start",
  async (req, res) => {
    try {
      const decoded =
        verifyStudent(req, res);

      if (!decoded) return;

      const quizId =
        req.body.quizId;

      if (!quizId) {
        return res.status(400).json({
          message:
            "Quiz ID is required",
        });
      }

      // -------------------------------------------------
      // GET QUIZ
      // -------------------------------------------------

      const quiz =
        await Quiz.findOne({
          _id: quizId,
          status: "published",
        });

      if (!quiz) {
        return res.status(404).json({
          message:
            "Quiz not found",
        });
      }

      // -------------------------------------------------
      // GET STUDENT
      // -------------------------------------------------

      const student =
        await User.findById(
          decoded.userId
        );

      if (!student) {
        return res.status(404).json({
          message:
            "Student not found",
        });
      }

      // -------------------------------------------------
      // SCHEDULE
      // -------------------------------------------------

      const schedule =
        checkQuizSchedule(quiz);

      if (!schedule.allowed) {
        return res.status(403).json({
          message:
            schedule.message,
        });
      }

      // -------------------------------------------------
      // ASSIGNMENT
      // -------------------------------------------------

      if (
        !checkAssignment(
          quiz,
          student
        )
      ) {
        return res.status(403).json({
          message:
            "This quiz is not assigned to you.",
        });
      }

      // -------------------------------------------------
      // ATTEMPT LIMIT
      // -------------------------------------------------

      const maximumAttempts =
        Math.max(
          1,
          Number(
            quiz.numberOfAttempts || 1
          )
        );

      const attemptsMade =
        await Attempt.countDocuments({
          student:
            decoded.userId,

          quiz:
            quiz._id,
        });

      if (
        attemptsMade >=
        maximumAttempts
      ) {
        return res.status(403).json({
          message:
            maximumAttempts === 1
              ? "You have already attempted this quiz."
              : `You have used all ${maximumAttempts} attempts for this quiz.`,

          attemptsMade,

          maximumAttempts,

          attemptsRemaining: 0,
        });
      }

      // -------------------------------------------------
      // START TIME
      // -------------------------------------------------

      const startedAt =
        new Date();

      // -------------------------------------------------
      // RANDOMIZED QUESTIONS
      // -------------------------------------------------

      const studentQuestions =
        buildStudentQuestions(
          quiz
        );

      const sessionQuestionIds =
        studentQuestions.map(
          (question) =>
            question.questionId
        );

      // -------------------------------------------------
      // QUIZ SESSION TOKEN
      // -------------------------------------------------

      const sessionId =
        crypto.randomUUID();

      const quizSessionToken =
        jwt.sign(
          {
            sessionId,

            userId:
              decoded.userId,

            quizId:
              quiz._id.toString(),

            startedAt:
              startedAt.getTime(),

            questionIds:
              sessionQuestionIds,
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "24h",
          }
        );

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      res.json({
        message:
          "Quiz started successfully",

        quizSessionToken,

        quizId:
          quiz._id,

        startedAt,

        questions:
          studentQuestions,

        timeLimit:
          Number(
            quiz.timeLimit || 30
          ),

        timeLimitSeconds:
          Number(
            quiz.timeLimit || 30
          ) * 60,

        totalMarks:
          Number(
            quiz.totalMarks || 0
          ),

        passingMarks:
          Number(
            quiz.passingMarks || 0
          ),

        showResultImmediately:
          quiz.showResultImmediately,

        attemptNumber:
          attemptsMade + 1,

        attemptsMade,

        maximumAttempts,

        attemptsRemaining:
          Math.max(
            0,
            maximumAttempts -
              (attemptsMade + 1)
          ),
      });
    } catch (error) {
      console.log(
        "START QUIZ ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to start quiz",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// SUBMIT QUIZ ATTEMPT
// =====================================================

router.post(
  "/",
  async (req, res) => {
    try {
      const decoded =
        verifyStudent(req, res);

      if (!decoded) return;

      const {
        quizId,
        answers,
        quizSessionToken,
      } = req.body;

      // -------------------------------------------------
      // BASIC VALIDATION
      // -------------------------------------------------

      if (
        !quizId ||
        !Array.isArray(answers)
      ) {
        return res.status(400).json({
          message:
            "Quiz ID and answers are required",
        });
      }

      if (!quizSessionToken) {
        return res.status(400).json({
          message:
            "Quiz session token is required. Please start the quiz again.",
        });
      }

      // -------------------------------------------------
      // VERIFY SESSION
      // -------------------------------------------------

      let session;

      try {
        session =
          jwt.verify(
            quizSessionToken,
            process.env.JWT_SECRET
          );
      } catch (error) {
        return res.status(400).json({
          message:
            "Quiz session expired or invalid. Please start the quiz again.",
        });
      }

      // -------------------------------------------------
      // SESSION STUDENT
      // -------------------------------------------------

      if (
        String(session.userId) !==
        String(decoded.userId)
      ) {
        return res.status(403).json({
          message:
            "Quiz session does not belong to this student",
        });
      }

      // -------------------------------------------------
      // SESSION QUIZ
      // -------------------------------------------------

      if (
        String(session.quizId) !==
        String(quizId)
      ) {
        return res.status(403).json({
          message:
            "Quiz session does not match this quiz",
        });
      }

      // -------------------------------------------------
      // GET QUIZ
      // -------------------------------------------------

      const quiz =
        await Quiz.findById(
          quizId
        );

      if (!quiz) {
        return res.status(404).json({
          message:
            "Quiz not found",
        });
      }

      // -------------------------------------------------
      // GET STUDENT
      // -------------------------------------------------

      const student =
        await User.findById(
          decoded.userId
        );

      if (!student) {
        return res.status(404).json({
          message:
            "Student not found",
        });
      }

      // -------------------------------------------------
      // ASSIGNMENT CHECK
      // -------------------------------------------------

      if (
        !checkAssignment(
          quiz,
          student
        )
      ) {
        return res.status(403).json({
          message:
            "This quiz is not assigned to you.",
        });
      }

      // -------------------------------------------------
      // SUBMISSION TIME
      // -------------------------------------------------

      const submittedAt =
        new Date();

      // -------------------------------------------------
      // END DATE CHECK
      // -------------------------------------------------

      if (
        quiz.endDateTime &&
        submittedAt >
          new Date(
            quiz.endDateTime
          )
      ) {
        return res.status(403).json({
          message:
            "The quiz deadline has passed. Your submission cannot be accepted.",

          endDateTime:
            quiz.endDateTime,
        });
      }

      // -------------------------------------------------
      // ATTEMPT LIMIT
      // -------------------------------------------------

      const maximumAttempts =
        Math.max(
          1,
          Number(
            quiz.numberOfAttempts || 1
          )
        );

      const attemptsMade =
        await Attempt.countDocuments({
          student:
            decoded.userId,

          quiz:
            quiz._id,
        });

      if (
        attemptsMade >=
        maximumAttempts
      ) {
        return res.status(403).json({
          message:
            maximumAttempts === 1
              ? "You have already used your attempt for this quiz."
              : `You have already used all ${maximumAttempts} attempts for this quiz.`,

          attemptsMade,

          maximumAttempts,

          attemptsRemaining: 0,
        });
      }

      // -------------------------------------------------
      // START TIME
      // -------------------------------------------------

      const startedAt =
        new Date(
          Number(
            session.startedAt
          )
        );

      if (
        Number.isNaN(
          startedAt.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid quiz session start time",
        });
      }

      // -------------------------------------------------
      // DUPLICATE SESSION CHECK
      // -------------------------------------------------

      const duplicateSession =
        await Attempt.findOne({
          student:
            decoded.userId,

          quiz:
            quiz._id,

          startedAt,
        });

      if (duplicateSession) {
        return res.status(409).json({
          message:
            "This quiz session has already been submitted.",

          attemptId:
            duplicateSession._id,
        });
      }

      // -------------------------------------------------
      // ELAPSED TIME
      // -------------------------------------------------

      const elapsedMilliseconds =
        submittedAt.getTime() -
        startedAt.getTime();

      const elapsedSeconds =
        Math.max(
          0,
          Math.floor(
            elapsedMilliseconds /
              1000
          )
        );

      // -------------------------------------------------
      // TIME LIMIT
      // -------------------------------------------------

      const timeLimitMinutes =
        Number(
          quiz.timeLimit || 30
        );

      const timeLimitSeconds =
        timeLimitMinutes * 60;

      const timeExpired =
        elapsedSeconds >=
        timeLimitSeconds;

      if (elapsedSeconds > timeLimitSeconds + 5) {
        return res.status(408).json({
          message: "Quiz submission time has expired.",
        });
      }

      const sessionQuestionIds = Array.isArray(session.questionIds)
        ? session.questionIds.map(String)
        : [];

      if (
        sessionQuestionIds.length !== quiz.questions.length ||
        sessionQuestionIds.some((questionId) =>
          !quiz.questions.some((question) => String(question._id) === questionId)
        )
      ) {
        return res.status(400).json({
          message: "Quiz questions changed after this session started. Please restart the quiz.",
        });
      }

      if (answers.length > sessionQuestionIds.length) {
        return res.status(400).json({
          message: "Too many answers were submitted for this quiz.",
        });
      }

      console.log(
        "QUIZ TIME CHECK:",
        {
          quizId:
            String(quiz._id),

          studentId:
            decoded.userId,

          startedAt,

          submittedAt,

          elapsedSeconds,

          timeLimitSeconds,

          timeExpired,
        }
      );

      // =================================================
      // SCORING
      // =================================================

      let score = 0;
      const answeredQuestionIds = new Set();

      for (const [index, answerItem] of answers.entries()) {
        let questionId = null;

        // Frontend can send: { questionId, answer }
        if (answerItem && typeof answerItem === "object") {
          questionId = answerItem.questionId;
        }

        if (questionId && !sessionQuestionIds.includes(String(questionId))) {
          return res.status(400).json({
            message: "An answer references a question outside this quiz session.",
          });
        }

        const question = findQuestion(
          quiz,
          questionId,
          index,
          sessionQuestionIds
        );

        if (!question) {
          return res.status(400).json({
            message: "An answer could not be matched to a question in this quiz session.",
          });
        }

        const canonicalQuestionId = String(question._id);
        if (answeredQuestionIds.has(canonicalQuestionId)) {
          return res.status(400).json({
            message: "Only one answer per question can be submitted.",
          });
        }
        answeredQuestionIds.add(canonicalQuestionId);

        const submittedAnswer = getAnswerValue(answerItem);
        if (submittedAnswer === undefined || submittedAnswer === null) {
          continue;
        }

        if (String(submittedAnswer) === String(question.correctAnswer)) {
          score += Number(question.marks || 1);
        }
      }

      // -------------------------------------------------
      // TOTAL MARKS
      // -------------------------------------------------

      const calculatedTotalMarks =
        quiz.questions.reduce(
          (
            total,
            question
          ) =>
            total +
            Number(
              question.marks || 1
            ),
          0
        );

      const totalMarks =
        calculatedTotalMarks;

      // -------------------------------------------------
      // PASSING MARKS
      // -------------------------------------------------

      const passingMarks =
        Number(
          quiz.passingMarks || 0
        );

      // -------------------------------------------------
      // PERCENTAGE
      // -------------------------------------------------

      const percentage =
        totalMarks > 0
          ? Number(
              (
                (score /
                  totalMarks) *
                100
              ).toFixed(2)
            )
          : 0;

      // -------------------------------------------------
      // PASS / FAIL
      // -------------------------------------------------

      const passed =
        score >= passingMarks;

      // -------------------------------------------------
      // ATTEMPT NUMBER
      // -------------------------------------------------

      const attemptNumber =
        attemptsMade + 1;

      // -------------------------------------------------
      // SAVE ATTEMPT
      // -------------------------------------------------

      const attempt =
        new Attempt({
          student:
            decoded.userId,

          quiz:
            quiz._id,

          answers,

          score,

          totalQuestions:
            quiz.questions.length,

          totalMarks,

          passingMarks,

          percentage,

          passed,

          attemptNumber,

          startedAt,

          submittedAt,

          autoSubmitted:
            timeExpired,
        });

      await attempt.save();

      // -------------------------------------------------
      // ATTEMPTS REMAINING
      // -------------------------------------------------

      const attemptsUsed =
        attemptNumber;

      const attemptsRemaining =
        Math.max(
          0,
          maximumAttempts -
            attemptsUsed
        );

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      res.status(201).json({
        message: timeExpired
          ? "Quiz time expired and attempt was submitted"
          : "Quiz attempt saved successfully",

        attemptId:
          attempt._id,

        score,

        totalMarks,

        passingMarks,

        percentage,

        passed,

        totalQuestions:
          quiz.questions.length,

        attemptNumber,

        startedAt,

        submittedAt,

        elapsedSeconds,

        timeLimitSeconds,

        autoSubmitted:
          timeExpired,

        attemptsUsed,

        maximumAttempts,

        attemptsRemaining,

        showResultImmediately:
          quiz.showResultImmediately,
      });
    } catch (error) {
      console.log(
        "SAVE ATTEMPT ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to save quiz attempt",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// GET STUDENT QUIZ HISTORY
// =====================================================

router.get(
  "/",
  async (req, res) => {
    try {
      const token =
        getToken(req);

      if (!token) {
        return res.status(401).json({
          message:
            "Token is required",
        });
      }

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      if (
        decoded.role !== "student"
      ) {
        return res.status(403).json({
          message:
            "Only students can view quiz history",
        });
      }

      const attempts =
        await Attempt.find({
          student:
            decoded.userId,
        })
          .populate(
            "quiz",
            "title description timeLimit numberOfAttempts totalMarks passingMarks"
          )
          .sort({
            createdAt: -1,
          });

      res.json({
        message:
          "Quiz history fetched successfully",

        attempts,
      });
    } catch (error) {
      console.log(
        "GET HISTORY ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch quiz history",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// GET TEACHER STUDENT RESULTS
// =====================================================

router.get(
  "/teacher/results",
  verifyTeacher,
  async (req, res) => {
    try {
      // -------------------------------------------------
      // GET TEACHER'S QUIZZES
      // -------------------------------------------------

      const teacherQuizzes =
        await Quiz.find({
          createdBy:
            req.user.userId,
        }).select(
          "_id title"
        );

      const quizIds =
        teacherQuizzes.map(
          (quiz) =>
            quiz._id
        );

      // -------------------------------------------------
      // GET ATTEMPTS
      // -------------------------------------------------

      const attempts =
        await Attempt.find({
          quiz: {
            $in: quizIds,
          },
        })
          .populate(
            "student",
            "name email rollNumber"
          )
          .populate(
            "quiz",
            "title description timeLimit totalMarks passingMarks numberOfAttempts"
          )
          .sort({
            createdAt: -1,
          });

      // -------------------------------------------------
      // FORMAT RESULTS
      // -------------------------------------------------

      const results =
        attempts.map(
          (attempt) => ({
            _id:
              attempt._id,

            student:
              attempt.student,

            quiz:
              attempt.quiz,

            score:
              attempt.score,

            totalMarks:
              attempt.totalMarks,

            passingMarks:
              attempt.passingMarks,

            percentage:
              attempt.percentage,

            passed:
              attempt.passed,

            attemptNumber:
              attempt.attemptNumber,

            totalQuestions:
              attempt.totalQuestions,

            startedAt:
              attempt.startedAt,

            submittedAt:
              attempt.submittedAt,

            autoSubmitted:
              attempt.autoSubmitted,

            createdAt:
              attempt.createdAt,
          })
        );

      // -------------------------------------------------
      // SEND RESULTS
      // -------------------------------------------------

      res.json({
        message:
          "Teacher results fetched successfully",

        attempts:
          results,
      });
    } catch (error) {
      console.log(
        "TEACHER RESULTS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch teacher results",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;