import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db.js";
import { users, userSessions } from "../schema.js";

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
  const user = await createUser(newUserData);

  // Generate token
  const token = generateToken(user.id);

  // Store session
  await storeUserSession(user.id, token);

  return {
    user: sanitizeUser(user),
    token,
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
  // Data access functions
  createUser,
  findUserById,
  findUserByEmail,
  findUserByUsername,
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
