const express = require("express");
const jwt = require("jsonwebtoken");
const Quiz = require("../models/Quiz");

const router = express.Router();

// =====================================================
// TEACHER AUTHENTICATION
// =====================================================

const verifyTeacher = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = req.body?.token || req.query?.token;
    }

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server authentication configuration error",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "teacher") {
      return res.status(403).json({
        message: "Only teachers can perform this action",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.log(
      "JWT VERIFY ERROR:",
      error.name,
      error.message
    );

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// =====================================================
// QUESTION VALIDATION
// =====================================================

function validateQuestions(questions) {
  if (!Array.isArray(questions)) {
    return "Questions are required";
  }

  if (questions.length === 0) {
    return "At least one question is required";
  }

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    if (!question.question?.trim()) {
      return `Question ${i + 1} is empty`;
    }

    if (
      !Array.isArray(question.options) ||
      question.options.length !== 4
    ) {
      return `Question ${i + 1} must have exactly 4 options`;
    }

    if (
      question.options.some(
        (option) => !String(option).trim()
      )
    ) {
      return `All options of Question ${i + 1} are required`;
    }

    const correctAnswer = String(question.correctAnswer || "").trim();

    if (!correctAnswer) {
      return `Correct answer of Question ${i + 1} is required`;
    }

    if (
      !question.options.some(
        (option) => String(option).trim() === correctAnswer
      )
    ) {
      return `Correct answer of Question ${i + 1} must match one of its options`;
    }

    const marks =
      question.marks === undefined
        ? 1
        : Number(question.marks);

    if (!Number.isFinite(marks) || marks < 1) {
      return `Marks of Question ${i + 1} must be at least 1`;
    }
  }

  return null;
}

// =====================================================
// PREPARE QUESTIONS
// =====================================================

function prepareQuestions(questions) {
  return questions.map((question) => ({
    question: question.question.trim(),

    options: question.options.map((option) =>
      String(option).trim()
    ),

    correctAnswer: String(question.correctAnswer || "").trim(),

    marks:
      Number(question.marks) >= 1
        ? Number(question.marks)
        : 1,
  }));
}

// =====================================================
// CALCULATE TOTAL MARKS
// =====================================================

function calculateTotalMarks(questions) {
  return questions.reduce(
    (total, question) =>
      total + Number(question.marks || 1),
    0
  );
}

// =====================================================
// VALIDATE SCHEDULE
// =====================================================

function validateSchedule(startDateTime, endDateTime) {
  const start = startDateTime
    ? new Date(startDateTime)
    : null;

  const end = endDateTime
    ? new Date(endDateTime)
    : null;

  if (start && Number.isNaN(start.getTime())) {
    return {
      valid: false,
      message: "Invalid start date/time",
    };
  }

  if (end && Number.isNaN(end.getTime())) {
    return {
      valid: false,
      message: "Invalid end date/time",
    };
  }

  if (start && end && end <= start) {
    return {
      valid: false,
      message:
        "End date/time must be after start date/time",
    };
  }

  return {
    valid: true,
    start,
    end,
  };
}

// =====================================================
// GET ALL PUBLISHED QUIZZES
// STUDENTS USE THIS
// CORRECT ANSWERS HIDDEN
// =====================================================

router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      status: "published",
    })
      .select("-questions.correctAnswer")
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.log("GET QUIZZES ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch quizzes",
      error: error.message,
    });
  }
});

// =====================================================
// GET TEACHER'S OWN QUIZZES
// DRAFT + PUBLISHED
// =====================================================

router.get(
  "/teacher/my-quizzes",
  verifyTeacher,
  async (req, res) => {
    try {
      const quizzes = await Quiz.find({
        createdBy: req.user.userId,
      }).sort({ createdAt: -1 });

      res.json(quizzes);
    } catch (error) {
      console.log(
        "TEACHER QUIZZES ERROR:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch teacher quizzes",
        error: error.message,
      });
    }
  }
);

// =====================================================
// GET ONE PUBLISHED QUIZ
// STUDENTS USE THIS
// CORRECT ANSWERS HIDDEN
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      status: "published",
    }).select("-questions.correctAnswer");

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.json(quiz);
  } catch (error) {
    console.log(
      "GET ONE QUIZ ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch quiz",
      error: error.message,
    });
  }
});

// =====================================================
// CREATE QUIZ
// ONLY TEACHER
// =====================================================

router.post("/", verifyTeacher, async (req, res) => {
  try {
    const {
      title,
      subject,
      department,
      classSemester,
      description,

      timeLimit,
      passingMarks,

      questions,

      numberOfAttempts,
      randomizeQuestions,
      randomizeOptions,
      showResultImmediately,

      startDateTime,
      endDateTime,

      assignedDepartment,
      assignedClassSemester,
      studentGroup,

      status,
    } = req.body;

    // ---------------------------------------------
    // TITLE
    // ---------------------------------------------

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Quiz title is required",
      });
    }

    // ---------------------------------------------
    // QUESTIONS
    // ---------------------------------------------

    const questionError =
      validateQuestions(questions);

    if (questionError) {
      return res.status(400).json({
        message: questionError,
      });
    }

    const preparedQuestions =
      prepareQuestions(questions);

    // ---------------------------------------------
    // TIME LIMIT
    // ---------------------------------------------

    const finalTimeLimit =
      Number(timeLimit) || 30;

    if (finalTimeLimit < 1) {
      return res.status(400).json({
        message:
          "Time limit must be at least 1 minute",
      });
    }

    // ---------------------------------------------
    // ATTEMPTS
    // ---------------------------------------------

    const finalNumberOfAttempts =
      Number(numberOfAttempts) || 1;

    if (finalNumberOfAttempts < 1) {
      return res.status(400).json({
        message:
          "Number of attempts must be at least 1",
      });
    }

    // ---------------------------------------------
    // TOTAL MARKS
    // Automatically calculated
    // ---------------------------------------------

    const totalMarks =
      calculateTotalMarks(
        preparedQuestions
      );

    // ---------------------------------------------
    // PASSING MARKS
    // ---------------------------------------------

    const finalPassingMarks =
      Number(passingMarks) || 0;

    if (finalPassingMarks < 0) {
      return res.status(400).json({
        message:
          "Passing marks cannot be negative",
      });
    }

    if (
      finalPassingMarks > totalMarks
    ) {
      return res.status(400).json({
        message:
          "Passing marks cannot be greater than total marks",
      });
    }

    // ---------------------------------------------
    // DATE / TIME
    // ---------------------------------------------

    const schedule =
      validateSchedule(
        startDateTime,
        endDateTime
      );

    if (!schedule.valid) {
      return res.status(400).json({
        message: schedule.message,
      });
    }

    // ---------------------------------------------
    // STATUS
    // ---------------------------------------------

    const finalStatus =
      status === "draft"
        ? "draft"
        : "published";

    // ---------------------------------------------
    // CREATE QUIZ
    // ---------------------------------------------

    const quiz = new Quiz({
      title: title.trim(),

      subject:
        subject?.trim() || "",

      department:
        department?.trim() || "",

      classSemester:
        classSemester?.trim() || "",

      description:
        description?.trim() || "",

      timeLimit:
        finalTimeLimit,

      totalMarks,

      passingMarks:
        finalPassingMarks,

      questions:
        preparedQuestions,

      numberOfAttempts:
        finalNumberOfAttempts,

      randomizeQuestions:
        Boolean(randomizeQuestions),

      randomizeOptions:
        Boolean(randomizeOptions),

      showResultImmediately:
        showResultImmediately !== false,

      startDateTime:
        schedule.start || null,

      endDateTime:
        schedule.end || null,

      assignedDepartment:
        assignedDepartment?.trim() || "",

      assignedClassSemester:
        assignedClassSemester?.trim() || "",

      studentGroup:
        studentGroup?.trim() ||
        "All Students",

      status:
        finalStatus,

      createdBy:
        req.user.userId,
    });

    await quiz.save();

    console.log(
      "QUIZ CREATED:",
      quiz._id.toString()
    );

    res.status(201).json({
      message:
        finalStatus === "draft"
          ? "Quiz saved as draft"
          : "Quiz published successfully",

      quiz,
    });
  } catch (error) {
    console.log(
      "CREATE QUIZ ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create quiz",
      error: error.message,
    });
  }
});

// =====================================================
// UPDATE QUIZ
// ONLY OWNER TEACHER
// =====================================================

router.put(
  "/:id",
  verifyTeacher,
  async (req, res) => {
    try {
      const quiz =
        await Quiz.findOne({
          _id: req.params.id,
          createdBy:
            req.user.userId,
        });

      if (!quiz) {
        return res.status(404).json({
          message:
            "Quiz not found or you do not own this quiz",
        });
      }

      const {
        title,
        subject,
        department,
        classSemester,
        description,

        timeLimit,
        passingMarks,

        questions,

        numberOfAttempts,
        randomizeQuestions,
        randomizeOptions,
        showResultImmediately,

        startDateTime,
        endDateTime,

        assignedDepartment,
        assignedClassSemester,
        studentGroup,

        status,
      } = req.body;

      // ---------------------------------------------
      // BASIC INFORMATION
      // ---------------------------------------------

      if (title !== undefined) {
        if (!title.trim()) {
          return res.status(400).json({
            message:
              "Quiz title cannot be empty",
          });
        }

        quiz.title = title.trim();
      }

      if (subject !== undefined) {
        quiz.subject =
          subject?.trim() || "";
      }

      if (department !== undefined) {
        quiz.department =
          department?.trim() || "";
      }

      if (classSemester !== undefined) {
        quiz.classSemester =
          classSemester?.trim() || "";
      }

      if (description !== undefined) {
        quiz.description =
          description?.trim() || "";
      }

      // ---------------------------------------------
      // TIME LIMIT
      // ---------------------------------------------

      if (timeLimit !== undefined) {
        const value =
          Number(timeLimit);

        if (
          !Number.isFinite(value) ||
          value < 1
        ) {
          return res.status(400).json({
            message:
              "Time limit must be at least 1 minute",
          });
        }

        quiz.timeLimit = value;
      }

      // ---------------------------------------------
      // QUESTIONS
      // ---------------------------------------------

      if (questions !== undefined) {
        const questionError =
          validateQuestions(
            questions
          );

        if (questionError) {
          return res.status(400).json({
            message: questionError,
          });
        }

        quiz.questions =
          prepareQuestions(
            questions
          );

        // Recalculate total marks
        quiz.totalMarks =
          calculateTotalMarks(
            quiz.questions
          );
      }

      // ---------------------------------------------
      // PASSING MARKS
      // ---------------------------------------------

      if (
        passingMarks !== undefined
      ) {
        const value =
          Number(passingMarks);

        if (
          !Number.isFinite(value) ||
          value < 0
        ) {
          return res.status(400).json({
            message:
              "Passing marks cannot be negative",
          });
        }

        quiz.passingMarks = value;
      }

      // Make sure passing marks are valid
      if (
        quiz.passingMarks >
        quiz.totalMarks
      ) {
        return res.status(400).json({
          message:
            "Passing marks cannot be greater than total marks",
        });
      }

      // ---------------------------------------------
      // NUMBER OF ATTEMPTS
      // ---------------------------------------------

      if (
        numberOfAttempts !== undefined
      ) {
        const value =
          Number(numberOfAttempts);

        if (
          !Number.isFinite(value) ||
          value < 1
        ) {
          return res.status(400).json({
            message:
              "Number of attempts must be at least 1",
          });
        }

        quiz.numberOfAttempts =
          value;
      }

      // ---------------------------------------------
      // RANDOMIZATION
      // ---------------------------------------------

      if (
        randomizeQuestions !==
        undefined
      ) {
        quiz.randomizeQuestions =
          Boolean(
            randomizeQuestions
          );
      }

      if (
        randomizeOptions !==
        undefined
      ) {
        quiz.randomizeOptions =
          Boolean(
            randomizeOptions
          );
      }

      // ---------------------------------------------
      // RESULT SETTING
      // ---------------------------------------------

      if (
        showResultImmediately !==
        undefined
      ) {
        quiz.showResultImmediately =
          Boolean(
            showResultImmediately
          );
      }

      // ---------------------------------------------
      // SCHEDULE
      // ---------------------------------------------

      const finalStart =
        startDateTime !== undefined
          ? startDateTime
          : quiz.startDateTime;

      const finalEnd =
        endDateTime !== undefined
          ? endDateTime
          : quiz.endDateTime;

      const schedule =
        validateSchedule(
          finalStart,
          finalEnd
        );

      if (!schedule.valid) {
        return res.status(400).json({
          message:
            schedule.message,
        });
      }

      quiz.startDateTime =
        schedule.start || null;

      quiz.endDateTime =
        schedule.end || null;

      // ---------------------------------------------
      // ASSIGNMENT
      // ---------------------------------------------

      if (
        assignedDepartment !==
        undefined
      ) {
        quiz.assignedDepartment =
          assignedDepartment?.trim() ||
          "";
      }

      if (
        assignedClassSemester !==
        undefined
      ) {
        quiz.assignedClassSemester =
          assignedClassSemester?.trim() ||
          "";
      }

      if (
        studentGroup !== undefined
      ) {
        quiz.studentGroup =
          studentGroup?.trim() ||
          "All Students";
      }

      // ---------------------------------------------
      // STATUS
      // ---------------------------------------------

      if (status !== undefined) {
        if (
          ![
            "draft",
            "published",
          ].includes(status)
        ) {
          return res.status(400).json({
            message:
              "Invalid quiz status",
          });
        }

        quiz.status = status;
      }

      // ---------------------------------------------
      // SAVE
      // ---------------------------------------------

      await quiz.save();

      res.json({
        message:
          quiz.status === "draft"
            ? "Quiz draft updated successfully"
            : "Quiz updated successfully",

        quiz,
      });
    } catch (error) {
      console.log(
        "UPDATE QUIZ ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update quiz",
        error: error.message,
      });
    }
  }
);

// =====================================================
// DELETE QUIZ
// ONLY OWNER TEACHER
// =====================================================

router.delete(
  "/:id",
  verifyTeacher,
  async (req, res) => {
    try {
      const quiz =
        await Quiz.findOneAndDelete({
          _id: req.params.id,
          createdBy:
            req.user.userId,
        });

      if (!quiz) {
        return res.status(404).json({
          message:
            "Quiz not found or you do not own this quiz",
        });
      }

      res.json({
        message:
          "Quiz deleted successfully",
      });
    } catch (error) {
      console.log(
        "DELETE QUIZ ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete quiz",
        error: error.message,
      });
    }
  }
);

module.exports = router;