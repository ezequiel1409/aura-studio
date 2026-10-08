import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { seedDatabase } from "./seed";
import {
  DrizzleCategoryRepository,
  DrizzleCounterRepository,
  DrizzleProductRepository,
  DrizzleSettingsRepository,
  DrizzleStatusHistoryRepository,
} from "./index";
import { createProduct } from "../../services/product.service";

async function main() {
  const dbPath = path.resolve(process.cwd(), "local.sqlite");
  console.log("Inicializando base de datos local en:", dbPath);

  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");

  // Aplica migración
  const migrationPath = path.resolve(
    process.cwd(),
    "drizzle/migrations/0000_fixed_doctor_spectrum.sql"
  );
  const migrationSql = fs.readFileSync(migrationPath, "utf-8");
  const cleanedSql = migrationSql.replace(/--> statement-breakpoint/g, "");
  sqlite.exec(cleanedSql);

  const db = drizzle(sqlite, { schema });

  // Ejecuta seed base
  await seedDatabase(db);
  console.log("Categorías y configuraciones sembradas.");

  // Si no hay productos, inserta productos de demostración para el catálogo
  const countRow = sqlite.prepare("SELECT count(*) as count FROM products").get() as { count: number };
  if (countRow.count === 0) {
    console.log("Insertando productos de muestra para el catálogo...");
    const deps = {
      productRepo: new DrizzleProductRepository(db),
      categoryRepo: new DrizzleCategoryRepository(db),
      statusHistoryRepo: new DrizzleStatusHistoryRepository(db),
      counterRepo: new DrizzleCounterRepository(db),
      settingsRepo: new DrizzleSettingsRepository(db),
    };

    const remerasCat = await deps.categoryRepo.findBySlug("remeras-y-tops");
    const jeansCat = await deps.categoryRepo.findBySlug("jeans");
    const abrigosCat = await deps.categoryRepo.findBySlug("abrigos");
    const vestidosCat = await deps.categoryRepo.findBySlug("vestidos-y-enteritos");

    await createProduct(
      {
        rawText: `✨ Top Florencia Lino
Talle: M
Precio: $ 18.500
Confeccionado en lino 100% puro con escote cuadrado y tirantes regulables.`,
        categoryId: remerasCat?.id,
        photos: [
          {
            keyThumb: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80",
          },
        ],
      },
      deps
    );

    await createProduct(
      {
        rawText: `Jean Wide Leg Vintage Celeste
Talle: 38
Precio: $ 42.000
Denim rígido 100% algodón, tiro alto con lavado celeste vintage.`,
        categoryId: jeansCat?.id,
        photos: [
          {
            keyThumb: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&auto=format&fit=crop&q=80",
          },
        ],
      },
      deps
    );

    await createProduct(
      {
        rawText: `Blazer Milano Sastrero Negro
Talle: ÚNICO
Precio: $ 65.000
Corte oversize sastrero con hombreras suaves y forro interno satinado.`,
        categoryId: abrigosCat?.id,
        photos: [
          {
            keyThumb: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&auto=format&fit=crop&q=80",
          },
        ],
      },
      deps
    );

    await createProduct(
      {
        rawText: `Vestido Midi Seda Noche
Talle: S
Vestido lencero de satén premium con espalda cruzada. Consultar precio por privado.`,
        categoryId: vestidosCat?.id,
        photos: [
          {
            keyThumb: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&auto=format&fit=crop&q=80",
          },
        ],
      },
      deps
    );

    console.log("Productos de muestra creados exitosamente.");
  }

  console.log("Base de datos local lista.");
}

main().catch(console.error);

