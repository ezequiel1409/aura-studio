import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { DrizzleD1Database, drizzle as drizzleD1 } from "drizzle-orm/d1";
import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type { D1Database } from "@cloudflare/workers-types";
import type Database from "better-sqlite3";
import * as schema from "./schema";

export type DbClient = BaseSQLiteDatabase<any, any, typeof schema>;

/**
 * Crea una conexión SQLite en memoria o a archivo (útil para tests y desarrollo local).
 */
export function createSqliteDb(dbPath: string = ":memory:"): {
  db: DbClient;
  sqlite: Database.Database;
} {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const BetterSqlite = require("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle: drizzleSqlite } = require("drizzle-orm/better-sqlite3");

  const sqlite = new BetterSqlite(dbPath);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzleSqlite(sqlite, { schema });
  return { db, sqlite };
}

/**
 * Crea una conexión D1 para Cloudflare Workers / Pages en producción.
 */
export function createD1Db(d1: D1Database): DbClient {
  return drizzleD1(d1, { schema });
}

