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
  DrizzleOrderRepository,
} from "./index";
import { ProductServiceDeps } from "../../services/product.service";

export interface GlobalAppDeps extends ProductServiceDeps {
  loginAttemptRepo: DrizzleLoginAttemptRepository;
  adminUserRepo: DrizzleAdminUserRepository;
  passwordResetTokenRepo: DrizzlePasswordResetTokenRepository;
  orderRepo: DrizzleOrderRepository;
}

let globalDb: DbClient | null = null;
let globalDeps: GlobalAppDeps | null = null;

export function getDb(): DbClient {
  const isCloudflare =
    typeof (globalThis as unknown as { WebSocketPair?: unknown }).WebSocketPair !== "undefined" ||
    (typeof process !== "undefined" && process.env?.NEXT_RUNTIME === "edge");

  // En entorno Cloudflare (Workers / OpenNext), conectamos con D1 usando el contexto actual
  if (isCloudflare) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const cf = getCloudflareContext();
      if (cf?.env?.DB) {
        return createD1Db(cf.env.DB);
      }
      throw new Error(
        "Cloudflare D1 database binding 'DB' was not found on the worker context. Verify wrangler.jsonc or Cloudflare Dashboard settings."
      );
    } catch (err) {
      throw err;
    }
  }

  if (globalDb) return globalDb;

  // En entorno local de Next.js usamos local.sqlite
  // eslint-disable-next-line @typescript-eslint/no-require-imports, no-eval
  const BetterSqlite = eval("require")("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports, no-eval
  const { drizzle: drizzleSqlite } = eval("require")("drizzle-orm/better-sqlite3");

  const dbPath = path.resolve(process.cwd(), "local.sqlite");
  const sqlite = new BetterSqlite(dbPath);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("temp_store = MEMORY");
  sqlite.pragma("cache_size = -64000");

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
  const isCloudflare =
    typeof (globalThis as unknown as { WebSocketPair?: unknown }).WebSocketPair !== "undefined" ||
    (typeof process !== "undefined" && process.env?.NEXT_RUNTIME === "edge");

  if (!isCloudflare && globalDeps) return globalDeps;

  const db = getDb();
  const deps: GlobalAppDeps = {
    productRepo: new DrizzleProductRepository(db),
    categoryRepo: new DrizzleCategoryRepository(db),
    statusHistoryRepo: new DrizzleStatusHistoryRepository(db),
    counterRepo: new DrizzleCounterRepository(db),
    settingsRepo: new DrizzleSettingsRepository(db),
    loginAttemptRepo: new DrizzleLoginAttemptRepository(db),
    adminUserRepo: new DrizzleAdminUserRepository(db),
    passwordResetTokenRepo: new DrizzlePasswordResetTokenRepository(db),
    orderRepo: new DrizzleOrderRepository(db),
  };

  if (!isCloudflare) {
    globalDeps = deps;
  }

  return deps;
}

