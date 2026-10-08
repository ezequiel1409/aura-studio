import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/infra/db/schema";
import { seedDatabase } from "../src/infra/db/seed";
import {
  DrizzleCategoryRepository,
  DrizzleCounterRepository,
  DrizzleProductRepository,
  DrizzleSettingsRepository,
  DrizzleStatusHistoryRepository,
} from "../src/infra/db";
import { ProductServiceDeps } from "../src/services/product.service";

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

  const deps: ProductServiceDeps = {
    productRepo,
    categoryRepo,
    statusHistoryRepo,
    counterRepo,
    settingsRepo,
  };

  return {
    sqlite,
    db,
    deps,
    seed: () => seedDatabase(db),
  };
}

