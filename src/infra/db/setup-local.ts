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

  // Aplica migración idempotente
  const initSqlPath = path.resolve(process.cwd(), "drizzle/init-db.sql");
  if (fs.existsSync(initSqlPath)) {
    const initSql = fs.readFileSync(initSqlPath, "utf-8");
    sqlite.exec(initSql);
  }

  const db = drizzle(sqlite, { schema });

  // Ejecuta seed base
  await seedDatabase(db);
  console.log("Categorías y configuraciones sembradas.");

  const deps = {
    productRepo: new DrizzleProductRepository(db),
    categoryRepo: new DrizzleCategoryRepository(db),
    statusHistoryRepo: new DrizzleStatusHistoryRepository(db),
    counterRepo: new DrizzleCounterRepository(db),
    settingsRepo: new DrizzleSettingsRepository(db),
  };

  const countRow = sqlite.prepare("SELECT count(*) as count FROM products").get() as { count: number };
  if (countRow.count === 0) {
    console.log("Insertando productos de muestra con carrusel de fotos y talles variados...");
    const remerasCat = await deps.categoryRepo.findBySlug("remeras-y-tops");
    const jeansCat = await deps.categoryRepo.findBySlug("jeans");
    const abrigosCat = await deps.categoryRepo.findBySlug("abrigos");
    const vestidosCat = await deps.categoryRepo.findBySlug("vestidos-y-enteritos");

    // Prenda 1: Múltiples talles en letras (S, M, L)
    await createProduct(
      {
        rawText: `✨ Top Florencia Lino
Talles: S, M, L
Precio: $ 18.500
Confeccionado en lino 100% puro con escote cuadrado y tirantes regulables. Espalda con lazo ajustable.`,
        categoryId: remerasCat?.id,
        photos: [
          {
            keyThumb: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1600&auto=format&fit=crop&q=90",
            position: 0,
          },
          {
            keyThumb: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&auto=format&fit=crop&q=90",
            position: 1,
          },
          {
            keyThumb: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1600&auto=format&fit=crop&q=90",
            position: 2,
          },
        ],
      },
      deps
    );

    // Prenda 2: Múltiples talles numéricos (36, 38, 40)
    await createProduct(
      {
        rawText: `Jean Wide Leg Vintage Celeste
Talles: 36, 38, 40
Precio: $ 42.000
Denim rígido 100% algodón, tiro alto con lavado celeste vintage y terminación deshilachada artesanal.`,
        categoryId: jeansCat?.id,
        photos: [
          {
            keyThumb: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1600&auto=format&fit=crop&q=90",
            position: 0,
          },
          {
            keyThumb: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=1600&auto=format&fit=crop&q=90",
            position: 1,
          },
        ],
      },
      deps
    );

    // Prenda 3: Talle Único
    await createProduct(
      {
        rawText: `Blazer Milano Sastrero Negro
Talle: ÚNICO
Precio: $ 65.000
Corte oversize sastrero con solapa clásica, hombreras suaves y forro interno satinado en tono visón.`,
        categoryId: abrigosCat?.id,
        photos: [
          {
            keyThumb: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1600&auto=format&fit=crop&q=90",
            position: 0,
          },
          {
            keyThumb: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&auto=format&fit=crop&q=90",
            position: 1,
          },
          {
            keyThumb: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&auto=format&fit=crop&q=90",
            position: 2,
          },
        ],
      },
      deps
    );

    // Prenda 4: Talle individual clásico (M)
    await createProduct(
      {
        rawText: `Vestido Midi Seda Noche
Talle: M
Precio: $ 58.000
Vestido lencero confeccionado en satén premium con escote drapeado y espalda cruzada.`,
        categoryId: vestidosCat?.id,
        photos: [
          {
            keyThumb: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1600&auto=format&fit=crop&q=90",
            position: 0,
          },
        ],
      },
      deps
    );
  } else {
    // Si ya existen productos, actualizamos sus talles para la demostración
    sqlite.prepare("UPDATE products SET size = 'S, M, L' WHERE code = 1").run();
    sqlite.prepare("UPDATE products SET size = '36, 38, 40' WHERE code = 2").run();
    sqlite.prepare("UPDATE products SET size = 'ÚNICO' WHERE code = 3").run();

    // Verificamos si existe la prenda #004
    const p4 = await deps.productRepo.findByCode(4);
    if (!p4) {
      const vestidosCat = await deps.categoryRepo.findBySlug("vestidos-y-enteritos");
      await createProduct(
        {
          rawText: `Vestido Midi Seda Noche
Talle: M
Precio: $ 58.000
Vestido lencero confeccionado en satén premium con escote drapeado y espalda cruzada.`,
          categoryId: vestidosCat?.id,
          photos: [
            {
              keyThumb: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
              keyFull: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1600&auto=format&fit=crop&q=90",
              position: 0,
            },
          ],
        },
        deps
      );
      console.log("Prenda #004 creada con talle individual.");
    }

    console.log("Talles de prueba actualizados en productos existentes.");
  }

  console.log("Base de datos local actualizada con carruseles.");
}

main().catch(console.error);
