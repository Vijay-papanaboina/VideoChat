import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import { users, userSessions } from "../schema.js";

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.avatar = data.avatar;
    this.bio = data.bio;
    this.theme = data.theme;
    this.emailNotifications = data.emailNotifications;
    this.pushNotifications = data.pushNotifications;
    this.totalCalls = data.totalCalls;
    this.totalDuration = data.totalDuration;
    this.lastActive = data.lastActive;
    this.isVerified = data.isVerified;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Create a new user
  static async create(userData) {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        avatar,
        bio,
        theme = "auto",
        emailNotifications = true,
        pushNotifications = true,
      } = userData;

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const [newUser] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          avatar,
          bio,
          theme,
          emailNotifications,
          pushNotifications,
        })
        .returning();

      return new User(newUser);
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.isActive, true)))
        .limit(1);

      if (!user) return null;
      return new User(user);
    } catch (error) {
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.username, username), eq(users.isActive, true)))
        .limit(1);

      if (!user) return null;
      return new User(user);
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.isActive, true)))
        .limit(1);

      if (!user) return null;
      return new User(user);
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async update(updateData) {
    try {
      const allowedFields = [
        "firstName",
        "lastName",
        "avatar",
        "bio",
        "theme",
        "emailNotifications",
        "pushNotifications",
      ];

      const updates = {};
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates[key] = value;
        }
      }

      if (Object.keys(updates).length === 0) return this;

      updates.updatedAt = new Date();

      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, this.id))
        .returning();

      return new User(updatedUser);
    } catch (error) {
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const [updatedUser] = await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, this.id))
        .returning();

      return new User(updatedUser);
    } catch (error) {
      throw error;
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Update last active
  async updateLastActive() {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ lastActive: new Date() })
        .where(eq(users.id, this.id))
        .returning();

      this.lastActive = updatedUser.lastActive;
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Increment call stats
  async incrementCallStats(durationMinutes = 0) {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          totalCalls: this.totalCalls + 1,
          totalDuration: this.totalDuration + durationMinutes,
          updatedAt: new Date(),
        })
        .where(eq(users.id, this.id))
        .returning();

      this.totalCalls = updatedUser.totalCalls;
      this.totalDuration = updatedUser.totalDuration;
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Get public profile (without sensitive data)
  getPublicProfile() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      avatar: this.avatar,
      bio: this.bio,
      theme: this.theme,
      emailNotifications: this.emailNotifications,
      pushNotifications: this.pushNotifications,
      totalCalls: this.totalCalls,
      totalDuration: this.totalDuration,
      lastActive: this.lastActive,
      isVerified: this.isVerified,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Delete user (soft delete)
  async delete() {
    try {
      await db
        .update(users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, this.id));

      this.isActive = false;
      return this;
    } catch (error) {
      throw error;
    }
  }
}

export default User;
