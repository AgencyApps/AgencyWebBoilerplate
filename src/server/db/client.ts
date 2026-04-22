import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnv } from "~/env";
import * as schema from "./schema";

let client: postgres.Sql | null = null;
let db: PostgresJsDatabase<typeof schema> | null = null;

export function getDb() {
  if (db) {
    return db;
  }

  client = postgres(requireEnv("DATABASE_URL"), {
    max: 10,
    prepare: false,
  });
  db = drizzle(client, { schema });

  return db;
}

export async function closeDb() {
  if (!client) {
    return;
  }

  await client.end();
  client = null;
  db = null;
}

export { schema };
