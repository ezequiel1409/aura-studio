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
  DrizzleCouponRepository,
  DrizzleOrderClaimRepository,
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
  couponRepo: DrizzleCouponRepository;
  orderClaimRepo: DrizzleOrderClaimRepository;
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

    // Verificar y auto-migrar tabla de cupones y canjes si faltan
    try {
      const couponsTableCheck = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='coupons'")
        .get();
      if (!couponsTableCheck) {
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS coupons (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            code text NOT NULL UNIQUE,
            description text,
            type text NOT NULL,
            value integer NOT NULL,
            min_order_cents integer DEFAULT 0,
            max_discount_cents integer,
            usage_limit integer,
            used_count integer DEFAULT 0 NOT NULL,
            max_uses_per_email integer DEFAULT 1,
            is_active integer DEFAULT 1 NOT NULL,
            starts_at integer,
            expires_at integer,
            created_at integer NOT NULL,
            updated_at integer NOT NULL
          );
          CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_unique ON coupons (code);
          CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons (code);
          CREATE INDEX IF NOT EXISTS coupons_is_active_idx ON coupons (is_active);

          CREATE TABLE IF NOT EXISTS coupon_redemptions (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            coupon_id integer NOT NULL,
            order_id integer,
            customer_email text NOT NULL,
            customer_phone text,
            customer_dni text,
            customer_id integer,
            discount_cents integer NOT NULL,
            created_at integer NOT NULL,
            FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE cascade,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE set null,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE set null
          );
          CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_id_idx ON coupon_redemptions (coupon_id);
          CREATE INDEX IF NOT EXISTS coupon_redemptions_customer_email_idx ON coupon_redemptions (customer_email);
          CREATE INDEX IF NOT EXISTS coupon_redemptions_customer_phone_idx ON coupon_redemptions (customer_phone);
          CREATE INDEX IF NOT EXISTS coupon_redemptions_customer_dni_idx ON coupon_redemptions (customer_dni);
          CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_email_idx ON coupon_redemptions (coupon_id, customer_email);
        `);
      }
    } catch {
      // Ignorar si ocurre error al verificar
    }

    // Verificar y auto-migrar order_claims y products.allow_return si faltan
    try {
      const pragmaCols = sqlite.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>;
      const hasAllowReturn = pragmaCols.some((col) => col.name === "allow_return");
      if (!hasAllowReturn) {
        sqlite.exec("ALTER TABLE products ADD COLUMN allow_return integer DEFAULT 1 NOT NULL;");
      }

      const pragmaOrderCols = sqlite.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>;
      const hasCustomerDni = pragmaOrderCols.some((col) => col.name === "customer_dni");
      if (!hasCustomerDni) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN customer_dni text;");
        sqlite.exec("CREATE INDEX IF NOT EXISTS orders_customer_dni_idx ON orders (customer_dni);");
      }

      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS order_claims (
          id text PRIMARY KEY NOT NULL,
          order_id integer NOT NULL,
          order_code integer NOT NULL,
          type text DEFAULT 'REVOCATION' NOT NULL,
          claim_code text NOT NULL UNIQUE,
          customer_name text NOT NULL,
          customer_dni text NOT NULL,
          customer_email text NOT NULL,
          customer_phone text NOT NULL,
          reason text,
          condition_accepted integer DEFAULT 1 NOT NULL,
          status text DEFAULT 'PENDING' NOT NULL,
          rejection_reason text,
          admin_notes text,
          created_at integer NOT NULL,
          resolved_at integer,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE cascade
        );
        CREATE UNIQUE INDEX IF NOT EXISTS order_claims_claim_code_unique ON order_claims (claim_code);
        CREATE INDEX IF NOT EXISTS order_claims_order_id_idx ON order_claims (order_id);
        CREATE INDEX IF NOT EXISTS order_claims_claim_code_idx ON order_claims (claim_code);
        CREATE INDEX IF NOT EXISTS order_claims_status_idx ON order_claims (status);
      `);
    } catch {
      // Ignorar si ocurre error al verificar
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
    couponRepo: new DrizzleCouponRepository(db),
    orderClaimRepo: new DrizzleOrderClaimRepository(db),
    db,
  };

  if (!isCloudflare) {
    globalDeps = deps;
  }

  return deps;
}

