import { BetterSQLite3Database, drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

export type DbClient = BetterSQLite3Database<typeof schema>;

/**
 * Crea una conexión SQLite en memoria o a archivo (útil para tests y desarrollo local).
 */
export function createSqliteDb(dbPath: string = ":memory:"): {
  db: DbClient;
  sqlite: Database.Database;
} {
  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzleSqlite(sqlite, { schema });
  return { db, sqlite };
}

