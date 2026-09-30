const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require("../config/mailer");

const router = express.Router();

// ==========================================
// REGISTER
// ==========================================
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      rollNumber,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const selectedRole = role || "student";

    if (!["student", "teacher"].includes(selectedRole)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // Student ke liye Roll Number required hai
    if (
      selectedRole === "student" &&
      !String(rollNumber || "").trim()
    ) {
      return res.status(400).json({
        message: "Student roll number is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const verificationUrl = new URL(
      process.env.CLIENT_URL || "http://localhost:5173"
    );
    verificationUrl.searchParams.set("verify", verificationToken);

    await PendingRegistration.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name: name.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role: selectedRole,
        rollNumber:
          selectedRole === "student"
            ? String(rollNumber).trim()
            : "",
        verificationTokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      { upsert: true, new: true, runValidators: true }
    );

    try {
      await sendVerificationEmail({
        to: normalizedEmail,
        verificationUrl: verificationUrl.toString(),
        role: selectedRole,
      });
    } catch (error) {
      console.error("REGISTRATION EMAIL ERROR:", error.name);
      return res.status(503).json({
        message: "Confirmation email send nahi hui. Backend SMTP settings check karein.",
      });
    }

    return res.status(202).json({
      message: "Confirmation email bhej di gayi hai. Account banane ke liye email link confirm karein.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error.name);

    res.status(500).json({
      message: "Registration failed",
    });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Email confirmation token is required.",
      });
    }

    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(String(token))
      .digest("hex");
    const pendingRegistration = await PendingRegistration.findOne({
      verificationTokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!pendingRegistration) {
      return res.status(400).json({
        message: "Confirmation link invalid ya expire ho gaya hai. Dobara registration karein.",
      });
    }

    const user = new User({
      name: pendingRegistration.name,
      email: pendingRegistration.email,
      password: pendingRegistration.password,
      role: pendingRegistration.role,
      rollNumber: pendingRegistration.rollNumber,
    });

    await user.save();
    await pendingRegistration.deleteOne();

    return res.status(201).json({
      message: "Email confirm ho gayi aur account create ho gaya. Ab login karein.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Is email ka account pehle se maujood hai. Login karein.",
      });
    }

    console.error("VERIFY EMAIL ERROR:", error.name);
    return res.status(500).json({
      message: "Email confirm nahi ho saki. Dobara try karein.",
    });
  }
});

// ==========================================
// LOGIN
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role || "student",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "student",
        rollNumber: user.rollNumber || "",
      },
    });
  } catch (error) {
    console.log("LOGIN ERROR:");
    console.log(error);

    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

// ==========================================
// FORGOT PASSWORD
// ==========================================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(202).json({
        message:
          "If this email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetUrl = new URL(
      process.env.CLIENT_URL || "http://localhost:5173"
    );
    resetUrl.searchParams.set("reset", resetToken);

    user.resetPasswordTokenHash = resetTokenHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires =
      new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: resetUrl.toString(),
      });
    } catch (emailError) {
      console.error("PASSWORD RESET EMAIL ERROR:", emailError.name);
    }

    return res.status(202).json({
      message: "If this email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.log("FORGOT PASSWORD ERROR:");
    console.log(error);

    res.status(500).json({
      message: "Forgot password request failed",
      error: error.message,
    });
  }
});

// ==========================================
// RESET PASSWORD
// ==========================================
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    const user = await User.findOne({
      resetPasswordTokenHash: crypto
        .createHash("sha256")
        .update(String(token))
        .digest("hex"),
      resetPasswordExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    user.resetPasswordTokenHash = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log("RESET PASSWORD ERROR:");
    console.log(error);

    res.status(500).json({
      message: "Password reset failed",
      error: error.message,
    });
  }
});

module.exports = router;