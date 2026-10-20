import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/infra/db/schema";
import { seedDatabase } from "../src/infra/db/seed";
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
  DrizzleNavigationRepository,
  DrizzlePromotionRepository,
} from "../src/infra/db";
import { GlobalAppDeps } from "../src/infra/db/connection";

export function createTestEnvironment() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");

  // Lee y aplica todas las migraciones SQL generadas por Drizzle Kit (AR-05)
  const migrationsDir = path.resolve(process.cwd(), "drizzle/migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const migrationSql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    const cleanedSql = migrationSql.replace(/--> statement-breakpoint/g, "");
    sqlite.exec(cleanedSql);
  }

  const db = drizzle(sqlite, { schema });

  const categoryRepo = new DrizzleCategoryRepository(db);
  const productRepo = new DrizzleProductRepository(db);
  const statusHistoryRepo = new DrizzleStatusHistoryRepository(db);
  const counterRepo = new DrizzleCounterRepository(db);
  const settingsRepo = new DrizzleSettingsRepository(db);
  const loginAttemptRepo = new DrizzleLoginAttemptRepository(db);
  const adminUserRepo = new DrizzleAdminUserRepository(db);
  const passwordResetTokenRepo = new DrizzlePasswordResetTokenRepository(db);
  const orderRepo = new DrizzleOrderRepository(db);
  const customerRepo = new DrizzleCustomerRepository(db);
  const customerAddressRepo = new DrizzleCustomerAddressRepository(db);
  const commerceRepo = new DrizzleCommerceRepository(db);
  const couponRepo = new DrizzleCouponRepository(db);
  const orderClaimRepo = new DrizzleOrderClaimRepository(db);
  const navigationRepo = new DrizzleNavigationRepository(db);
  const promotionRepo = new DrizzlePromotionRepository(db);

  const deps: GlobalAppDeps = {
    productRepo,
    categoryRepo,
    statusHistoryRepo,
    counterRepo,
    settingsRepo,
    loginAttemptRepo,
    adminUserRepo,
    passwordResetTokenRepo,
    orderRepo,
    customerRepo,
    customerAddressRepo,
    commerceRepo,
    couponRepo,
    orderClaimRepo,
    navigationRepo,
    promotionRepo,
    db,
  };

  return {
    sqlite,
    db,
    deps,
    seed: () => seedDatabase(db),
  };
}

