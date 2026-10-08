import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { DbClient } from "./client";
import {
  DrizzleCategoryRepository,
  DrizzleCounterRepository,
  DrizzleProductRepository,
  DrizzleSettingsRepository,
  DrizzleStatusHistoryRepository,
} from "./index";
import { ProductServiceDeps } from "../../services/product.service";

let globalDb: DbClient | null = null;
let globalDeps: ProductServiceDeps | null = null;

export function getDb(): DbClient {
  if (globalDb) return globalDb;

  // En entorno local de Next.js usamos local.sqlite
  const dbPath = path.resolve(process.cwd(), "local.sqlite");
  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");

  globalDb = drizzle(sqlite, { schema });
  return globalDb;
}

export function getProductServiceDeps(): ProductServiceDeps {
  if (globalDeps) return globalDeps;

  const db = getDb();
  globalDeps = {
    productRepo: new DrizzleProductRepository(db),
    categoryRepo: new DrizzleCategoryRepository(db),
    statusHistoryRepo: new DrizzleStatusHistoryRepository(db),
    counterRepo: new DrizzleCounterRepository(db),
    settingsRepo: new DrizzleSettingsRepository(db),
  };

  return globalDeps;
}

