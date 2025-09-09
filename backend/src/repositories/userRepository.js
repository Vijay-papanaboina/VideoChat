import { eq, and, desc } from "drizzle-orm";
import { db } from "../db.js";
import { users, userSessions } from "../schema.js";

export class UserRepository {
  // Create a new user
  static async create(userData) {
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  // Find user by ID
  static async findById(id) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  // Find user by email
  static async findByEmail(email) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  // Find user by username
  static async findByUsername(username) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user;
  }

  // Update user
  static async update(id, updateData) {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Delete user
  static async delete(id) {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  // Get all users with pagination
  static async findAll(limit = 50, offset = 0) {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    return allUsers;
  }

  // Store user session
  static async storeSession(sessionData) {
    const [session] = await db
      .insert(userSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  // Find session by token hash
  static async findSessionByTokenHash(tokenHash) {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.tokenHash, tokenHash))
      .limit(1);
    return session;
  }

  // Delete session
  static async deleteSession(tokenHash) {
    await db.delete(userSessions).where(eq(userSessions.tokenHash, tokenHash));
    return true;
  }

  // Delete all user sessions
  static async deleteAllUserSessions(userId) {
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
    return true;
  }

  // Update user stats
  static async updateUserStats(userId, stats) {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...stats,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
}
