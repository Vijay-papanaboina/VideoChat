import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "password",
        database: process.env.DB_NAME || "videocallapp",
        ssl:
          process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      },
  verbose: true,
  strict: true,
});
