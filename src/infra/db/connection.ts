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
  DrizzleCustomerRepository,
  DrizzleCustomerAddressRepository,
  DrizzleCommerceRepository,
} from "./index";
import { ProductServiceDeps } from "../../services/product.service";

export interface GlobalAppDeps extends ProductServiceDeps {
  loginAttemptRepo: DrizzleLoginAttemptRepository;
  adminUserRepo: DrizzleAdminUserRepository;
  passwordResetTokenRepo: DrizzlePasswordResetTokenRepository;
  orderRepo: DrizzleOrderRepository;
  customerRepo: DrizzleCustomerRepository;
  customerAddressRepo: DrizzleCustomerAddressRepository;
  commerceRepo: DrizzleCommerceRepository;
  db?: DbClient;
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

    // Verificar y auto-migrar tablas incrementales si faltan (ej. orders, customers, commerces)
    const customersTableCheck = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'")
      .get();
    if (!customersTableCheck) {
      const migrationsDir = path.resolve(process.cwd(), "drizzle/migrations");
      if (fs.existsSync(migrationsDir)) {
        const migrationFiles = fs
          .readdirSync(migrationsDir)
          .filter((f) => f.endsWith(".sql"))
          .sort();
        for (const file of migrationFiles) {
          const migrationSql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
          const statements = migrationSql
            .split("--> statement-breakpoint")
            .map((s) => s.trim())
            .filter(Boolean);
          for (const statement of statements) {
            try {
              sqlite.exec(statement);
            } catch {
              // Ignorar si el índice o tabla ya existe
            }
          }
        }
      }
    }

    // Sembrar comercio principal por defecto si no existe ninguno
    try {
      const commercesTable = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='commerces'")
        .get();
      if (commercesTable) {
        const commerceCount = sqlite
          .prepare("SELECT count(*) as count FROM commerces")
          .get() as { count: number };
        if (commerceCount && commerceCount.count === 0) {
          const now = Date.now();
          sqlite
            .prepare(
              "INSERT OR IGNORE INTO commerces (slug, name, whatsapp_number, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
            )
            .run("aura-studio", "Aura Studio", "+5491100000000", 1, now, now);
        }
      }
    } catch {
      // Ignorar fallas no críticas
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
    customerRepo: new DrizzleCustomerRepository(db),
    customerAddressRepo: new DrizzleCustomerAddressRepository(db),
    commerceRepo: new DrizzleCommerceRepository(db),
    db,
  };

  if (!isCloudflare) {
    globalDeps = deps;
  }

  return deps;
}

