import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const themeEnum = pgEnum("theme", ["light", "dark", "auto"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  avatar: varchar("avatar", { length: 500 }),
  bio: varchar("bio", { length: 500 }),
  theme: themeEnum("theme").default("auto"),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  totalCalls: integer("total_calls").default(0),
  totalDuration: integer("total_duration").default(0),
  lastActive: timestamp("last_active").defaultNow(),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rooms table
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  maxUsers: integer("max_users").default(5),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User sessions table
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Call sessions table (for tracking call statistics)
export const callSessions = pgTable("call_sessions", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 50 }).notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  duration: integer("duration").default(0), // in minutes
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  isActive: boolean("is_active").default(true),
  callQuality: integer("call_quality").default(0), // 1-5 rating
  participantsCount: integer("participants_count").default(1),
  connectionType: varchar("connection_type", { length: 20 }).default("webrtc"), // webrtc, fallback
});

// Room participants table (for tracking who joined which rooms)
export const roomParticipants = pgTable("room_participants", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 50 }).notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  username: varchar("username", { length: 50 }).notNull(), // Store username for guests
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").default(true),
  isFavorite: boolean("is_favorite").default(false),
});

// User favorites table (for favorite rooms)
export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roomId: varchar("room_id", { length: 50 }).notNull(),
  roomName: varchar("room_name", { length: 100 }), // Optional room name
  addedAt: timestamp("added_at").defaultNow(),
});
