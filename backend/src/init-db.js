import { db, testConnection } from "./db.js";
import { sql } from "drizzle-orm";

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error("Database connection failed");
    }

    // Create tables using raw SQL (Drizzle migrations are better for this, but this works for now)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        avatar VARCHAR(500),
        bio VARCHAR(500),
        theme VARCHAR(10) DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
        email_notifications BOOLEAN DEFAULT true,
        push_notifications BOOLEAN DEFAULT true,
        total_calls INTEGER DEFAULT 0,
        total_duration INTEGER DEFAULT 0,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_verified BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_by INTEGER REFERENCES users(id),
        max_users INTEGER DEFAULT 5,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS call_sessions (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(50) NOT NULL,
        user_id INTEGER REFERENCES users(id),
        duration INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        call_quality INTEGER DEFAULT 0,
        participants_count INTEGER DEFAULT 1,
        connection_type VARCHAR(20) DEFAULT 'webrtc'
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS room_participants (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(50) NOT NULL,
        user_id INTEGER REFERENCES users(id),
        username VARCHAR(50) NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        is_favorite BOOLEAN DEFAULT false
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        room_id VARCHAR(50) NOT NULL,
        room_name VARCHAR(100),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_rooms_room_id ON rooms(room_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_call_sessions_user_id ON call_sessions(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_call_sessions_room_id ON call_sessions(room_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_call_sessions_started_at ON call_sessions(started_at)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id)
    `);

    console.log("✅ Database tables initialized successfully with Drizzle");
    return true;
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};
