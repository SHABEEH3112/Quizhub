const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const getToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return req.body?.token || req.query?.token || null;
};

const verifyToken = (req, res, next) => {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    console.log("PROFILE AUTH ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const profileFields = {
  name: 1,
  email: 1,
  role: 1,
  rollNumber: 1,
  className: 1,
  section: 1,
  subject: 1,
  department: 1,
  profilePicture: 1,
  teacherId: 1,
  department: 1,
  classSemester: 1,
  studentGroup: 1,
};

router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(profileFields);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Profile loaded successfully",
      profile: user,
    });
  } catch (error) {
    console.log("GET PROFILE ERROR:", error);

    res.status(500).json({
      message: "Profile load nahi ho saka",
      error: error.message,
    });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updates = {};
    const name =
      String(req.body.name ?? user.name).trim();
    if (name) updates.name = name;

    updates.className =
      String(req.body.className ?? "").trim();

    updates.section =
      String(req.body.section ?? "").trim();

    updates.rollNumber =
      String(req.body.rollNumber ?? user.rollNumber ?? "").trim();

    updates.subject =
      String(req.body.subject ?? "").trim();

    updates.department =
      String(req.body.department ?? user.department ?? "").trim();

    if (req.body.teacherId !== undefined) {
      updates.teacherId = String(req.body.teacherId).trim();
    }

    if (req.body.profilePicture !== undefined) {
      const picture = String(req.body.profilePicture);

      if (picture.length > 3_000_000) {
        return res.status(400).json({
          message:
            "Profile picture bohat bari hai. 2 MB se chhoti image use karein.",
        });
      }

      updates.profilePicture = picture;
    }

    await User.findOneAndUpdate(
      { _id: user._id },
      updates
    );

    const updatedUser =
      await User.findById(user._id).select(profileFields);

    res.status(200).json({
      message: "Profile created successfully",
      profile: updatedUser,
    });
  } catch (error) {
    console.log("CREATE PROFILE ERROR:", error);

    res.status(500).json({
      message: "Profile create nahi hua",
      error: error.message,
    });
  }
});

router.put("/", verifyToken, async (req, res) => {
  try {
    console.log("PROFILE UPDATE REQUEST:", {
      userId: req.user.userId,
      name: req.body.name,
      className: req.body.className,
      section: req.body.section,
      rollNumber: req.body.rollNumber,
      subject: req.body.subject,
      hasPicture: Boolean(req.body.profilePicture),
    });

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updates = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();

      if (name) {
        updates.name = name;
      }
    }

    if (req.body.className !== undefined) {
      updates.className = String(req.body.className).trim();
    }

    if (req.body.section !== undefined) {
      updates.section = String(req.body.section).trim();
    }

    if (req.body.rollNumber !== undefined) {
      updates.rollNumber = String(req.body.rollNumber).trim();
    }

    if (req.body.subject !== undefined) {
      updates.subject = String(req.body.subject).trim();
    }

    if (req.body.department !== undefined) {
      updates.department = String(req.body.department).trim();
    }

    if (req.body.teacherId !== undefined) {
      updates.teacherId = String(req.body.teacherId).trim();
    }

    if (req.body.profilePicture !== undefined) {
      const picture =
        String(req.body.profilePicture);

      if (picture.length > 3_000_000) {
        return res.status(400).json({
          message:
            "Profile picture bohat bari hai. 2 MB se chhoti image use karein.",
        });
      }

      updates.profilePicture = picture;
    }

    await User.findOneAndUpdate({ _id: user._id }, updates);

    const updatedUser =
      await User.findById(user._id).select(profileFields);

    console.log("PROFILE UPDATE SUCCESS:", user._id);

    return res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedUser,
    });
  } catch (error) {
    console.log("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      message: "Profile update nahi hua",
      error: error.message,
    });
  }
});

module.exports = router;