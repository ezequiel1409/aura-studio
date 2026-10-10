import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { DbClient, createD1Db } from "./client";
import {
  DrizzleAdminUserRepository,
  DrizzleCategoryRepository,
  DrizzleCounterRepository,
  DrizzleLoginAttemptRepository,
  DrizzlePasswordResetTokenRepository,
  DrizzleProductRepository,
  DrizzleSettingsRepository,
  DrizzleStatusHistoryRepository,
} from "./index";
import { ProductServiceDeps } from "../../services/product.service";

export interface GlobalAppDeps extends ProductServiceDeps {
  loginAttemptRepo: DrizzleLoginAttemptRepository;
  adminUserRepo: DrizzleAdminUserRepository;
  passwordResetTokenRepo: DrizzlePasswordResetTokenRepository;
}

let globalDb: DbClient | null = null;
let globalDeps: GlobalAppDeps | null = null;

export function getDb(): DbClient {
  if (globalDb) return globalDb;

  // En entorno Cloudflare (Workers / OpenNext), conectamos con D1
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const cf = getCloudflareContext();
    if (cf?.env?.DB) {
      globalDb = createD1Db(cf.env.DB);
      return globalDb;
    }
  } catch {
    // Entorno local o fuera de Cloudflare
  }

  // En entorno local de Next.js usamos local.sqlite
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const BetterSqlite = require("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle: drizzleSqlite } = require("drizzle-orm/better-sqlite3");

  const dbPath = path.resolve(process.cwd(), "local.sqlite");
  const sqlite = new BetterSqlite(dbPath);
  sqlite.pragma("foreign_keys = ON");

  // Si la tabla settings o categories no existe (ej. build en entorno CI), inicializamos el esquema local
  try {
    const tableCheck = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'")
      .get();
    if (!tableCheck) {
      const initSqlPath = path.resolve(process.cwd(), "drizzle/init-db.sql");
      if (fs.existsSync(initSqlPath)) {
        const initSql = fs.readFileSync(initSqlPath, "utf-8");
        sqlite.exec(initSql);
      }
    }
  } catch {
    // Continuamos si ocurre algún error menor en la verificación
  }

  const client = drizzleSqlite(sqlite, { schema }) as DbClient;
  globalDb = client;
  return client;
}

export function getProductServiceDeps(): GlobalAppDeps {
  if (globalDeps) return globalDeps;

  const db = getDb();
  globalDeps = {
    productRepo: new DrizzleProductRepository(db),
    categoryRepo: new DrizzleCategoryRepository(db),
    statusHistoryRepo: new DrizzleStatusHistoryRepository(db),
    counterRepo: new DrizzleCounterRepository(db),
    settingsRepo: new DrizzleSettingsRepository(db),
    loginAttemptRepo: new DrizzleLoginAttemptRepository(db),
    adminUserRepo: new DrizzleAdminUserRepository(db),
    passwordResetTokenRepo: new DrizzlePasswordResetTokenRepository(db),
  };

  return globalDeps;
}

