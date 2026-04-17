import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const connectionString = process.env.DATABASE_URL;

// Supabase session pooler — use ssl: "require" (works with both pooler and direct)
const queryClient = postgres(connectionString, {
  ssl: "require",
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false, // required for session pooler / pgbouncer
});

export const db = drizzle(queryClient, { schema });

// Export schema for convenience
export * from "./schema";
