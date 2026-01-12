import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq, and, desc, or, ilike, ne, notInArray } from "drizzle-orm";
import { db } from "../db.js";
import { users, userSessions } from "../schema.js";
import { validateUserRegistration } from "../utils/validation.js";
import {
  generateToken as generateEmailToken,
  generateExpiry,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./emailServiceEthereal.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// User validation rules
const UserValidation = {
  username: { minLength: 3 },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { minLength: 8 },
  firstName: { minLength: 1 },
  lastName: { minLength: 1 },
};

// Create a new user
export const createUser = async (userData) => {
  const [newUser] = await db.insert(users).values(userData).returning();
  return newUser;
};

// Find user by ID
export const findUserById = async (id) => {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
};

// Find user by email
export const findUserByEmail = async (email) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user;
};

// Find user by username
export const findUserByUsername = async (username) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return user;
};

// Update user
export const updateUser = async (id, updateData) => {
  const [updatedUser] = await db
    .update(users)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updatedUser;
};

// Delete user
export const deleteUser = async (id) => {
  await db.delete(users).where(eq(users.id, id));
  return true;
};

// Search users by username (excluding current user and room members)
export const searchUsers = async (
  query,
  limit = 10,
  excludeUserId = null,
  excludeRoomMembers = null
) => {
  try {
    const conditions = [
      eq(users.isActive, true),
      ilike(users.username, `%${query}%`),
    ];

    // Exclude current user from search results if provided
    if (excludeUserId) {
      conditions.push(ne(users.id, excludeUserId));
    }

    // Get room members if roomId is provided (for marking them as already members)
    let roomMemberIds = [];
    if (excludeRoomMembers) {
      // Import permanentRoomMembers here to avoid circular dependency
      const { permanentRoomMembers } = await import("../schema.js");
      const roomMembers = await db
        .select({ userId: permanentRoomMembers.userId })
        .from(permanentRoomMembers)
        .where(eq(permanentRoomMembers.roomId, excludeRoomMembers));

      roomMemberIds = roomMembers.map((member) => member.userId);
    }

    const searchResults = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(and(...conditions))
      .limit(limit);

    // Add membership status to each result
    const resultsWithMembership = searchResults.map((user) => ({
      ...user,
      isRoomMember: roomMemberIds.includes(user.id),
    }));

    return resultsWithMembership;
  } catch (error) {
    console.error("Failed to search users:", error);
    return [];
  }
};

// Store user session
export const storeSession = async (sessionData) => {
  const [session] = await db
    .insert(userSessions)
    .values(sessionData)
    .returning();
  return session;
};

// Find session by token hash
export const findSessionByTokenHash = async (tokenHash) => {
  const [session] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.tokenHash, tokenHash))
    .limit(1);
  return session;
};

// Delete session
export const deleteSession = async (tokenHash) => {
  await db.delete(userSessions).where(eq(userSessions.tokenHash, tokenHash));
  return true;
};

// Delete all user sessions
export const deleteAllUserSessions = async (userId) => {
  await db.delete(userSessions).where(eq(userSessions.userId, userId));
  return true;
};

// Register a new user
export const register = async (userData) => {
  const { username, email, password, firstName, lastName, avatar, bio } =
    userData;

  // Validate input
  validateUserData(userData);

  // Check if user already exists
  const existingUserByEmail = await findUserByEmail(email);
  if (existingUserByEmail) {
    throw new Error("User with this email already exists");
  }

  const existingUserByUsername = await findUserByUsername(username);
  if (existingUserByUsername) {
    throw new Error("Username already taken");
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate verification token
  const verificationToken = generateEmailToken();
  const verificationTokenExpiry = generateExpiry(24); // 24 hours

  // In development mode, auto-verify users
  const isDevelopment = process.env.NODE_ENV !== "production";

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
    isVerified: isDevelopment, // Auto-verify in development
    isActive: true,
    verificationToken: isDevelopment ? null : verificationToken,
    verificationTokenExpiry: isDevelopment ? null : verificationTokenExpiry,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create user
  const user = await createUser(newUserData);

  // Send verification email only in production
  if (!isDevelopment) {
    sendVerificationEmail(email, username, verificationToken).catch((err) => {
      console.error("Failed to send verification email:", err);
    });
  } else {
    console.log(`[Dev Mode] User ${username} auto-verified, skipping email.`);
  }

  // Registration complete - user must log in separately
  return {
    user: sanitizeUser(user),
    message: isDevelopment
      ? "Registration successful! You can now log in."
      : "Registration successful! Please check your email to verify your account, then log in.",
  };
};

// Login user
export const login = async (email, password) => {
  // Find user by email
  const user = await findUserByEmail(email);
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

  // Check if email is verified (optional: can be made required)
  if (!user.isVerified) {
    // Resend verification email if not verified
    const verificationToken = generateEmailToken();
    const verificationTokenExpiry = generateExpiry(24);
    await updateUser(user.id, { verificationToken, verificationTokenExpiry });
    sendVerificationEmail(email, user.username, verificationToken).catch(
      console.error
    );

    throw new Error(
      "Email not verified. A new verification email has been sent."
    );
  }

  // Update last active
  await updateUser(user.id, { lastActive: new Date() });

  // Generate token
  const token = generateToken(user.id);

  // Store session
  await storeUserSession(user.id, token);

  return {
    user: sanitizeUser(user),
    token,
  };
};

// Verify email
export const verifyEmail = async (token) => {
  // Find user by verification token
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.verificationToken, token))
    .limit(1);

  if (!user) {
    throw new Error("Invalid verification token");
  }

  // Check if token is expired
  if (
    user.verificationTokenExpiry &&
    new Date() > user.verificationTokenExpiry
  ) {
    throw new Error(
      "Verification token has expired. Please request a new one."
    );
  }

  // Mark email as verified
  await updateUser(user.id, {
    isVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
  });

  return { message: "Email verified successfully! You can now log in." };
};

// Resend verification email
export const resendVerificationEmail = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists
    return {
      message: "If this email exists, a verification link has been sent.",
    };
  }

  if (user.isVerified) {
    throw new Error("Email is already verified");
  }

  const verificationToken = generateEmailToken();
  const verificationTokenExpiry = generateExpiry(24);

  await updateUser(user.id, { verificationToken, verificationTokenExpiry });
  await sendVerificationEmail(email, user.username, verificationToken);

  return { message: "Verification email sent successfully" };
};

// Forgot password - send reset email
export const forgotPassword = async (email) => {
  const user = await findUserByEmail(email);

  // Always return success message to prevent email enumeration
  if (!user) {
    return {
      message: "If this email exists, a password reset link has been sent.",
    };
  }

  const resetToken = generateEmailToken();
  const resetTokenExpiry = generateExpiry(1); // 1 hour

  await updateUser(user.id, { resetToken, resetTokenExpiry });
  await sendPasswordResetEmail(email, user.username, resetToken);

  return {
    message: "If this email exists, a password reset link has been sent.",
  };
};

// Reset password with token
export const resetPassword = async (token, newPassword) => {
  // Find user by reset token
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, token))
    .limit(1);

  if (!user) {
    throw new Error("Invalid reset token");
  }

  // Check if token is expired
  if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
    throw new Error("Reset token has expired. Please request a new one.");
  }

  // Validate new password
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password and clear reset token
  await updateUser(user.id, {
    password: hashedPassword,
    resetToken: null,
    resetTokenExpiry: null,
  });

  // Clear all sessions for security
  await deleteAllUserSessions(user.id);

  return {
    message:
      "Password reset successfully. Please log in with your new password.",
  };
};

// Logout user
export const logout = async (token) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await deleteSession(tokenHash);
  return true;
};

// Verify token
export const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.userId);

    if (!user || !user.isActive) {
      throw new Error("Invalid token");
    }

    return user;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

// Update user profile
export const updateProfile = async (userId, updateData) => {
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

  const updatedUser = await updateUser(userId, filteredData);
  return sanitizeUser(updatedUser);
};

// Change password
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
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
  await updateUser(userId, { password: hashedPassword });

  return true;
};

// Delete account
export const deleteAccount = async (userId, password) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error("Password is incorrect");
  }

  // Delete all user sessions
  await deleteAllUserSessions(userId);

  // Delete user
  await deleteUser(userId);

  return true;
};

// Helper functions
export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const storeUserSession = async (userId, token) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await storeSession({
    userId,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  });
};

export const sanitizeUser = (user) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

export const validateUserData = (userData) => {
  const errors = validateUserRegistration(userData);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Throw first error
  }
};

// Export all functions as a service object
export const authService = {
  register,
  login,
  logout,
  verifyToken,
  updateProfile,
  changePassword,
  deleteAccount,
  // Email verification
  verifyEmail,
  resendVerificationEmail,
  // Password reset
  forgotPassword,
  resetPassword,
  // Data access functions
  createUser,
  findUserById,
  findUserByEmail,
  findUserByUsername,
  searchUsers,
  updateUser,
  deleteUser,
  storeSession,
  findSessionByTokenHash,
  deleteSession,
  deleteAllUserSessions,
  // Helper functions
  generateToken,
  storeUserSession,
  sanitizeUser,
  validateUserData,
};
