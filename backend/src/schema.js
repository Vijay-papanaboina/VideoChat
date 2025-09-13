import {
  pgTable,
  serial,
  varchar,
  boolean,
  integer,
  timestamp,
  text,
  unique,
} from "drizzle-orm/pg-core";

// Enums

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

// Temporary rooms table (for anonymous users, auto-deleted when empty)
export const temporaryRooms = pgTable("temporary_rooms", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }), // Optional password
  createdBy: varchar("created_by", { length: 50 }), // Anonymous username
  maxUsers: integer("max_users").default(100),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // Auto-cleanup after inactivity
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Permanent rooms table (for logged-in users, persistent)
export const permanentRooms = pgTable("permanent_rooms", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 50 }).notNull().unique(),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  maxUsers: integer("max_users").default(100),
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

// Room participants table (for tracking who joined which rooms)
export const roomParticipants = pgTable("room_participants", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 50 }).notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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

// Temporary room chat messages (auto-deleted with room)
export const temporaryChatMessages = pgTable("temporary_chat_messages", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 50 })
    .notNull()
    .references(() => temporaryRooms.roomId, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }), // Allow null for guests
  username: varchar("username", { length: 50 }).notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"), // text, image, file, system
  timestamp: timestamp("timestamp").defaultNow(),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Permanent room chat messages (persistent)
export const permanentChatMessages = pgTable("permanent_chat_messages", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 50 })
    .notNull()
    .references(() => permanentRooms.roomId, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }), // Allow null for guests
  username: varchar("username", { length: 50 }).notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"), // text, image, file, system
  timestamp: timestamp("timestamp").defaultNow(),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Temporary room chat sessions (tracks active temporary chat sessions)
export const temporaryChatSessions = pgTable("temporary_chat_sessions", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 50 })
    .notNull()
    .unique()
    .references(() => temporaryRooms.roomId, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at"),
  messageCount: integer("message_count").default(0),
});

// Permanent room chat sessions (tracks active permanent chat sessions)
export const permanentChatSessions = pgTable("permanent_chat_sessions", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 50 })
    .notNull()
    .unique()
    .references(() => permanentRooms.roomId, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at"),
  messageCount: integer("message_count").default(0),
});

// Permanent room members (users who have permanent access to the room)
export const permanentRoomMembers = pgTable(
  "permanent_room_members",
  {
    id: serial("id").primaryKey(),
    roomId: varchar("room_id", { length: 50 })
      .notNull()
      .references(() => permanentRooms.roomId, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addedBy: integer("added_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // Who added this member
    isAdmin: boolean("is_admin").default(false), // Can this member manage the room?
    addedAt: timestamp("added_at").defaultNow(),
  },
  (table) => ({
    // Ensure a user can only be added once per room
    roomUserUnique: unique("permanent_room_members_room_user_unique").on(
      table.roomId,
      table.userId
    ),
  })
);
