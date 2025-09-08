import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../src/models/User.js";
import { db } from "../src/db.js";
import { userSessions } from "../src/schema.js";
import { eq, and } from "drizzle-orm";
const router = express.Router();

// JWT Secret (should be in environment variables)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "Invalid token - user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Store session in database
const storeSession = async (userId, token) => {
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(userSessions).values({
      userId,
      tokenHash,
      expiresAt,
    });
  } catch (error) {
    console.error("Error storing session:", error);
  }
};

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, bio } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        error: "Username must be between 3 and 20 characters",
      });
    }

    // Check if user already exists
    const existingUser =
      (await User.findByUsername(username)) || (await User.findByEmail(email));
    if (existingUser) {
      return res.status(409).json({
        error: "Username or email already exists",
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      bio,
    });

    // Generate token
    const token = generateToken(user.id);

    // Store session
    await storeSession(user.id, token);

    // Update last active
    await user.updateLastActive();

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "23505") {
      // PostgreSQL unique constraint violation
      return res.status(409).json({
        error: "Username or email already exists",
      });
    }

    res.status(500).json({
      error: "Internal server error during registration",
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    // Find user by username or email
    const user =
      (await User.findByUsername(username)) ||
      (await User.findByEmail(username));

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Store session
    await storeSession(user.id, token);

    // Update last active
    await user.updateLastActive();

    res.json({
      message: "Login successful",
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error during login",
    });
  }
});

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.getPublicProfile(),
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      bio,
      theme,
      emailNotifications,
      pushNotifications,
    } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (theme !== undefined) updateData.theme = theme;
    if (emailNotifications !== undefined)
      updateData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined)
      updateData.pushNotifications = pushNotifications;

    const updatedUser = await req.user.update(updateData);

    res.json({
      message: "Profile updated successfully",
      user: updatedUser.getPublicProfile(),
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Change password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters long",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(
      currentPassword
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: "Current password is incorrect",
      });
    }

    // Update password
    await req.user.updatePassword(newPassword);

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Logout (invalidate session)
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Remove session from database
    await db
      .delete(userSessions)
      .where(
        and(
          eq(userSessions.userId, req.user.id),
          eq(userSessions.tokenHash, tokenHash)
        )
      );

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Delete account
router.delete("/account", authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "Password is required to delete account",
      });
    }

    // Verify password
    const isPasswordValid = await req.user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Password is incorrect",
      });
    }

    // Soft delete user
    await req.user.delete();

    res.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export { router, authenticateToken };
