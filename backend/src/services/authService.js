import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserRepository } from "../repositories/userRepository.js";
import { UserValidation } from "../models/User.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export class AuthService {
  // Register a new user
  static async register(userData) {
    const { username, email, password, firstName, lastName, avatar, bio } =
      userData;

    // Validate input
    this.validateUserData(userData);

    // Check if user already exists
    const existingUserByEmail = await UserRepository.findByEmail(email);
    if (existingUserByEmail) {
      throw new Error("User with this email already exists");
    }

    const existingUserByUsername = await UserRepository.findByUsername(
      username
    );
    if (existingUserByUsername) {
      throw new Error("Username already taken");
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user data
    const newUserData = {
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      avatar: avatar || null,
      bio: bio || null,
      emailNotifications: true,
      pushNotifications: true,
      totalCalls: 0,
      totalDuration: 0,
      lastActive: new Date(),
      isVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create user
    const user = await UserRepository.create(newUserData);

    // Generate token
    const token = this.generateToken(user.id);

    // Store session
    await this.storeSession(user.id, token);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  // Login user
  static async login(email, password) {
    // Find user by email
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    // Update last active
    await UserRepository.update(user.id, { lastActive: new Date() });

    // Generate token
    const token = this.generateToken(user.id);

    // Store session
    await this.storeSession(user.id, token);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  // Logout user
  static async logout(token) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await UserRepository.deleteSession(tokenHash);
    return true;
  }

  // Verify token
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await UserRepository.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new Error("Invalid token");
      }

      return user;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  // Update user profile
  static async updateProfile(userId, updateData) {
    const allowedFields = [
      "firstName",
      "lastName",
      "avatar",
      "bio",
      "emailNotifications",
      "pushNotifications",
    ];
    const filteredData = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    const updatedUser = await UserRepository.update(userId, filteredData);
    return this.sanitizeUser(updatedUser);
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await UserRepository.update(userId, { password: hashedPassword });

    return true;
  }

  // Delete account
  static async deleteAccount(userId, password) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Password is incorrect");
    }

    // Delete all user sessions
    await UserRepository.deleteAllUserSessions(userId);

    // Delete user
    await UserRepository.delete(userId);

    return true;
  }

  // Helper methods
  static generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static async storeSession(userId, token) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await UserRepository.storeSession({
      userId,
      tokenHash,
      expiresAt,
      createdAt: new Date(),
    });
  }

  static sanitizeUser(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  static validateUserData(userData) {
    const { username, email, password, firstName, lastName } = userData;

    if (!username || username.length < UserValidation.username.minLength) {
      throw new Error("Username must be at least 3 characters long");
    }

    if (!email || !UserValidation.email.pattern.test(email)) {
      throw new Error("Invalid email format");
    }

    if (!password || password.length < UserValidation.password.minLength) {
      throw new Error("Password must be at least 8 characters long");
    }

    if (!firstName || firstName.length < UserValidation.firstName.minLength) {
      throw new Error("First name is required");
    }

    if (!lastName || lastName.length < UserValidation.lastName.minLength) {
      throw new Error("Last name is required");
    }
  }
}
