const bcrypt = require("bcryptjs");
const { pool } = require("../config/database");

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.avatar = data.avatar;
    this.bio = data.bio;
    this.theme = data.theme;
    this.emailNotifications = data.email_notifications;
    this.pushNotifications = data.push_notifications;
    this.totalCalls = data.total_calls;
    this.totalDuration = data.total_duration;
    this.lastActive = data.last_active;
    this.isVerified = data.is_verified;
    this.isActive = data.is_active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
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

      const query = `
        INSERT INTO users (
          username, email, password, first_name, last_name, 
          avatar, bio, theme, email_notifications, push_notifications
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        username,
        email,
        hashedPassword,
        firstName,
        lastName,
        avatar,
        bio,
        theme,
        emailNotifications,
        pushNotifications,
      ];

      const result = await pool.query(query, values);
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const query = "SELECT * FROM users WHERE id = $1 AND is_active = true";
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) return null;
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const query =
        "SELECT * FROM users WHERE username = $1 AND is_active = true";
      const result = await pool.query(query, [username]);

      if (result.rows.length === 0) return null;
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const query = "SELECT * FROM users WHERE email = $1 AND is_active = true";
      const result = await pool.query(query, [email]);

      if (result.rows.length === 0) return null;
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async update(updateData) {
    try {
      const allowedFields = [
        "first_name",
        "last_name",
        "avatar",
        "bio",
        "theme",
        "email_notifications",
        "push_notifications",
      ];

      const updates = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        const dbField = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        if (allowedFields.includes(dbField)) {
          updates.push(`${dbField} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) return this;

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(this.id);

      const query = `
        UPDATE users 
        SET ${updates.join(", ")} 
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const query = `
        UPDATE users 
        SET password = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [hashedPassword, this.id]);
      return new User(result.rows[0]);
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
      const query = `
        UPDATE users 
        SET last_active = CURRENT_TIMESTAMP 
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [this.id]);
      this.lastActive = result.rows[0].last_active;
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Increment call stats
  async incrementCallStats(durationMinutes = 0) {
    try {
      const query = `
        UPDATE users 
        SET total_calls = total_calls + 1, 
            total_duration = total_duration + $1,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [durationMinutes, this.id]);
      this.totalCalls = result.rows[0].total_calls;
      this.totalDuration = result.rows[0].total_duration;
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
      const query = `
        UPDATE users 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `;

      await pool.query(query, [this.id]);
      this.isActive = false;
      return this;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
