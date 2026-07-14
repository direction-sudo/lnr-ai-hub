import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;
let client: Database.Database;

export function getDb() {
  if (!instance) {
    const dbPath = process.env.DATABASE_URL?.replace("sqlite:", "") || "./data/lnr-ai-hub.db";
    client = new Database(dbPath);
    client.pragma("journal_mode = WAL");
    instance = drizzle(client, { schema: fullSchema });
  }
  return instance;
}

// For migrations
export function getRawClient() {
  if (!client) {
    const dbPath = process.env.DATABASE_URL?.replace("sqlite:", "") || "./data/lnr-ai-hub.db";
    client = new Database(dbPath);
  }
  return client;
}
