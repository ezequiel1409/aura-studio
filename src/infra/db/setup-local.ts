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

  // Aplica todas las migraciones SQL de Drizzle Kit (AR-05)
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
          // Ignora si la columna/tabla o índice ya existe
        }
      }
    }
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

  // Verifica si ya existen los 5 productos con colores y talles completos
  const productsCountRow = sqlite
    .prepare("SELECT count(*) as count FROM products")
    .get() as { count: number };

  if (productsCountRow.count < 5) {
    console.log("Limpiando productos anteriores para insertar nuevos mocks con Colores, Talles y Stock...");
    sqlite.prepare("DELETE FROM products").run();
    sqlite.prepare("DELETE FROM product_photos").run();
    sqlite.prepare("DELETE FROM product_colors").run();
    sqlite.prepare("DELETE FROM product_color_sizes").run();
    sqlite.prepare("UPDATE counters SET value = 0 WHERE name = 'product_code'").run();

    console.log("Insertando productos de muestra con jerarquía Producto -> Colores -> Talles con Stock...");
    const remerasCat = await deps.categoryRepo.findBySlug("remeras-y-tops");
    const jeansCat = await deps.categoryRepo.findBySlug("jeans");
    const abrigosCat = await deps.categoryRepo.findBySlug("abrigos");
    const vestidosCat = await deps.categoryRepo.findBySlug("vestidos-y-enteritos");
    const buzosCat = await deps.categoryRepo.findBySlug("buzos-y-sweaters");

    // Prenda 1: Top Florencia Lino (3 colores, talles S, M, L)
    await createProduct(
      {
        rawText: `✨ Top Florencia Lino
Confeccionado en lino 100% puro con escote cuadrado y tirantes regulables. Espalda con lazo ajustable.
Colores disponibles: Blanco, Negro y Beige Lino.
Precio: $ 18.500`,
        categoryId: remerasCat?.id,
        colors: [
          {
            name: "Blanco",
            hexCode: "#FFFFFF",
            position: 0,
            sizes: [
              { size: "S", stock: 2 },
              { size: "M", stock: 3 },
              { size: "L", stock: 1 },
            ],
          },
          {
            name: "Negro",
            hexCode: "#1C1917",
            position: 1,
            sizes: [
              { size: "S", stock: 1 },
              { size: "M", stock: 2 },
              { size: "L", stock: 0 }, // Agotado en L para testing
            ],
          },
          {
            name: "Beige Lino",
            hexCode: "#E7DEC8",
            position: 2,
            sizes: [
              { size: "S", stock: 1 },
              { size: "M", stock: 2 },
              { size: "L", stock: 1 },
            ],
          },
        ],
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

    // Prenda 2: Jean Wide Leg Vintage (2 colores, talles numéricos 36, 38, 40, 42)
    await createProduct(
      {
        rawText: `Jean Wide Leg Vintage
Denim rígido 100% algodón, tiro alto con terminación deshilachada artesanal.
Colores: Celeste Vintage y Denim Oscuro.
Precio: $ 42.000`,
        categoryId: jeansCat?.id,
        colors: [
          {
            name: "Celeste Vintage",
            hexCode: "#8EABC2",
            position: 0,
            sizes: [
              { size: "36", stock: 3 },
              { size: "38", stock: 4 },
              { size: "40", stock: 2 },
            ],
          },
          {
            name: "Denim Oscuro",
            hexCode: "#1E293B",
            position: 1,
            sizes: [
              { size: "38", stock: 2 },
              { size: "40", stock: 2 },
              { size: "42", stock: 1 },
            ],
          },
        ],
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

    // Prenda 3: Blazer Milano Sastrero (3 colores, Talle ÚNICO con stock)
    await createProduct(
      {
        rawText: `Blazer Milano Sastrero
Corte oversize sastrero con solapa clásica, hombreras suaves y forro interno satinado en tono visón.
Colores: Negro Sastrero, Camel y Gris Perla.
Talle: ÚNICO
Precio: $ 65.000`,
        categoryId: abrigosCat?.id,
        colors: [
          {
            name: "Negro Sastrero",
            hexCode: "#111111",
            position: 0,
            sizes: [{ size: "ÚNICO", stock: 4 }],
          },
          {
            name: "Camel",
            hexCode: "#C19A6B",
            position: 1,
            sizes: [{ size: "ÚNICO", stock: 2 }],
          },
          {
            name: "Gris Perla",
            hexCode: "#D1D5DB",
            position: 2,
            sizes: [{ size: "ÚNICO", stock: 1 }],
          },
        ],
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

    // Prenda 4: Vestido Midi Seda Noche (2 colores: Esmeralda y Champagne)
    await createProduct(
      {
        rawText: `Vestido Midi Seda Noche
Vestido lencero confeccionado en satén premium con escote drapeado y espalda cruzada.
Colores: Esmeralda y Champagne.
Precio: $ 58.000`,
        categoryId: vestidosCat?.id,
        colors: [
          {
            name: "Verde Esmeralda",
            hexCode: "#064E3B",
            position: 0,
            sizes: [
              { size: "S", stock: 1 },
              { size: "M", stock: 2 },
            ],
          },
          {
            name: "Champagne",
            hexCode: "#F7E7CE",
            position: 1,
            sizes: [
              { size: "S", stock: 0 }, // Agotado
              { size: "M", stock: 2 },
              { size: "L", stock: 1 },
            ],
          },
        ],
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

    // Prenda 5: Sweater Roma Cuello Tortuga (2 colores)
    await createProduct(
      {
        rawText: `Sweater Roma Cuello Tortuga
Tejido punto trenzado suave, abrigado y con terminaciones acanaladas en puños y cintura.
Colores: Off White y Moka.
Precio: $ 39.000`,
        categoryId: buzosCat?.id,
        colors: [
          {
            name: "Off White",
            hexCode: "#F8FAFC",
            position: 0,
            sizes: [
              { size: "S", stock: 2 },
              { size: "M", stock: 3 },
            ],
          },
          {
            name: "Marrón Moka",
            hexCode: "#4A3728",
            position: 1,
            sizes: [
              { size: "S", stock: 1 },
              { size: "M", stock: 1 },
            ],
          },
        ],
        photos: [
          {
            keyThumb: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1600&auto=format&fit=crop&q=90",
            position: 0,
          },
        ],
      },
      deps
    );

    console.log("5 prendas creadas exitosamente con colores y stocks asignados.");
  } else {
    console.log("Los productos con variantes ya están presentes en la base de datos.");
  }

  console.log("Base de datos local lista y verificada.");
}

main().catch(console.error);
