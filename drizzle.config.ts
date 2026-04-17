import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Supabase requires SSL — append if not already present
const dbUrl = process.env.DATABASE_URL.includes("sslmode")
  ? process.env.DATABASE_URL
  : `${process.env.DATABASE_URL}?sslmode=require`;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});
