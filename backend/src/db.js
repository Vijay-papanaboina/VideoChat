import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import dotenv from "dotenv";
dotenv.config();

// Database connection
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || "postgres"}:${
    process.env.DB_PASSWORD || "password"
  }@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${
    process.env.DB_NAME || "videocallapp"
  }`;

// Create postgres client
const client = postgres(connectionString, {
  max: 20, // Maximum number of clients in the pool
  idle_timeout: 20, // Close idle clients after 20 seconds
  connect_timeout: 10, // Return an error after 10 seconds if connection could not be established
  // Force SSL for Neon database
  ssl: { rejectUnauthorized: false },
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Test database connection
export const testConnection = async () => {
  try {
    await client`SELECT 1`;
    console.log("✅ Connected to PostgreSQL database with Drizzle");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

// Close database connection
export const closeConnection = async () => {
  await client.end();
  console.log("📊 Database connection closed");
};
