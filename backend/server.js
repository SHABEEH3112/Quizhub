const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const quizRoutes = require("./routes/quiz");
const attemptRoutes = require("./routes/attempt");
const profileRoutes = require("./routes/profile");

const app = express();
const port = Number(process.env.PORT) || 5000;
let databaseConnection;

const ensureDatabaseConnection = () => {
  if (!databaseConnection) {
    databaseConnection = connectDB().catch((error) => {
      databaseConnection = null;
      throw error;
    });
  }

  return databaseConnection;
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests, please try again later.",
  },
});

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(apiLimiter);
app.use(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/profile", profileRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Quiz Website Backend is Running!",
    status: "ok",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled app error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    message: "Something went wrong on the server.",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      console.warn("JWT_SECRET is not defined. Set it in your .env file for authentication to work properly.");
    }

    await ensureDatabaseConnection();

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;