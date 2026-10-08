import "./loadEnv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

/**
 * Lazily-created DB client — only connects when actually called, so
 * importing this module (or anything that re-exports from index.ts)
 * doesn't throw in environments without DATABASE_URL set, like the current
 * JSON-seed-backed app. Call `getDb()` from the future seed-import script
 * and monitor jobs once a real Postgres/Neon instance exists.
 */
let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — provision a Postgres instance (e.g. Neon) and set it before calling getDb().",
    );
  }
  const client = postgres(url, { prepare: false });
  cached = drizzle(client, { schema });
  return cached;
}
