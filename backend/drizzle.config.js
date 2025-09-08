import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();

// Use the same connection logic as db.js
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || "postgres"}:${
    process.env.DB_PASSWORD || "password"
  }@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${
    process.env.DB_NAME || "videocallapp"
  }`;

export default defineConfig({
  schema: "./src/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
});
