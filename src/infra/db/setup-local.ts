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
  const forceSeed = process.argv.includes("--force") || process.env.FORCE_SEED === "true";
  const productsCountRow = sqlite
    .prepare("SELECT count(*) as count FROM products")
    .get() as { count: number };

  if (productsCountRow.count < 5 || forceSeed) {
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
            keyThumb: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1600&auto=format&fit=crop&q=90",
            position: 0,
          },
          {
            keyThumb: "https://images.unsplash.com/photo-1548624313-039e222d4f57?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1548624313-039e222d4f57?w=1600&auto=format&fit=crop&q=90",
            position: 1,
          },
          {
            keyThumb: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&auto=format&fit=crop&q=90",
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
            keyThumb: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1600&auto=format&fit=crop&q=90",
            position: 0,
          },
          {
            keyThumb: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1600&auto=format&fit=crop&q=90",
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
            keyThumb: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1600&auto=format&fit=crop&q=90",
            position: 0,
          },
          {
            keyThumb: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=600&auto=format&fit=crop&q=80",
            keyFull: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=1600&auto=format&fit=crop&q=90",
            position: 1,
          },
        ],
      },
      deps
    );

    console.log("5 prendas creadas exitosamente con colores y stocks asignados.");
  } else {
    console.log("Los productos con variantes ya están presentes en la base de datos.");
  }

  // Verifica si ya existen órdenes de muestra en la tabla orders (BR-41, BR-42)
  const ordersCountRow = sqlite
    .prepare("SELECT count(*) as count FROM orders")
    .get() as { count: number };

  if (ordersCountRow.count < 4) {
    console.log("Sembrando órdenes de compra de prueba en el ambiente de desarrollo...");

    const dbProducts = sqlite
      .prepare("SELECT * FROM products ORDER BY code ASC LIMIT 5")
      .all() as Array<{
      id: number;
      code: number;
      title: string;
      price_cents: number;
    }>;

    const p1 = dbProducts[0] || { id: 1, code: 1, title: "Top Florencia Lino", price_cents: 1850000 };
    const p2 = dbProducts[1] || { id: 2, code: 2, title: "Jean Wide Leg Vintage", price_cents: 4200000 };
    const p3 = dbProducts[2] || { id: 3, code: 3, title: "Blazer Milano Sastrero", price_cents: 6500000 };
    const p4 = dbProducts[3] || { id: 4, code: 4, title: "Vestido Midi Seda Noche", price_cents: 5800000 };

    const nowSec = Math.floor(Date.now() / 1000);

    const mockOrders = [
      {
        code: 1,
        customerName: "Camila Díaz",
        customerPhone: "+5491145678901",
        customerEmail: "camila.diaz@gmail.com",
        deliveryMethod: "PICKUP",
        deliveryAddress: null,
        deliveryNotes: "Retiro hoy por la tarde en el showroom",
        subtotalCents: p1.price_cents,
        discountCents: 0,
        shippingCents: 0,
        totalCents: p1.price_cents,
        status: "PENDING",
        notes: "Consultó disponibilidad por WhatsApp",
        createdAt: nowSec - 7200,
        updatedAt: nowSec - 7200,
        items: [
          {
            productId: p1.id,
            productCode: p1.code,
            productTitle: p1.title,
            colorName: "Blanco",
            size: "M",
            quantity: 1,
            unitPriceCents: p1.price_cents,
            subtotalCents: p1.price_cents,
            photoUrl:
              "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
          },
        ],
      },
      {
        code: 2,
        customerName: "Valentina Rossi",
        customerPhone: "+5491198765432",
        customerEmail: "valen.rossi@outlook.com",
        deliveryMethod: "HOME_DELIVERY",
        deliveryAddress: "Av. Santa Fe 3420, Piso 5 B, CABA",
        deliveryNotes: "Timbre no funciona, tocar bocina o llamar",
        subtotalCents: p2.price_cents + p1.price_cents,
        discountCents: 500000,
        shippingCents: 450000,
        totalCents: p2.price_cents + p1.price_cents - 500000 + 450000,
        couponCode: "BIENVENIDA",
        status: "CONFIRMED",
        notes: "Pago por transferencia verificado",
        createdAt: nowSec - 18000,
        updatedAt: nowSec - 7200,
        items: [
          {
            productId: p2.id,
            productCode: p2.code,
            productTitle: p2.title,
            colorName: "Celeste Vintage",
            size: "38",
            quantity: 1,
            unitPriceCents: p2.price_cents,
            subtotalCents: p2.price_cents,
            photoUrl:
              "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
          },
          {
            productId: p1.id,
            productCode: p1.code,
            productTitle: p1.title,
            colorName: "Negro",
            size: "S",
            quantity: 1,
            unitPriceCents: p1.price_cents,
            subtotalCents: p1.price_cents,
            photoUrl:
              "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
          },
        ],
      },
      {
        code: 3,
        customerName: "Sofía Martínez",
        customerPhone: "+5491133221100",
        customerEmail: "sofia.martinez@aura.com",
        deliveryMethod: "MOTORCYCLE",
        deliveryAddress: "Gorriti 4800, Palermo Soho, CABA",
        deliveryNotes: "Entregar en conserjería",
        subtotalCents: p3.price_cents,
        discountCents: 0,
        shippingCents: 350000,
        totalCents: p3.price_cents + 350000,
        status: "PAID",
        notes: "Entregado por mensajería",
        createdAt: nowSec - 86400,
        updatedAt: nowSec - 43200,
        items: [
          {
            productId: p3.id,
            productCode: p3.code,
            productTitle: p3.title,
            colorName: "Camel",
            size: "ÚNICO",
            quantity: 1,
            unitPriceCents: p3.price_cents,
            subtotalCents: p3.price_cents,
            photoUrl:
              "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
          },
        ],
      },
      {
        code: 4,
        customerName: "Lucía Fernández",
        customerPhone: "+5491177889900",
        customerEmail: "lucia.f@gmail.com",
        deliveryMethod: "PICKUP",
        deliveryAddress: null,
        deliveryNotes: null,
        subtotalCents: p4.price_cents,
        discountCents: 0,
        shippingCents: 0,
        totalCents: p4.price_cents,
        status: "CANCELLED",
        notes: "Cancelada por falta de confirmación de pago",
        createdAt: nowSec - 172800,
        updatedAt: nowSec - 120000,
        items: [
          {
            productId: p4.id,
            productCode: p4.code,
            productTitle: p4.title,
            colorName: "Verde Esmeralda",
            size: "M",
            quantity: 1,
            unitPriceCents: p4.price_cents,
            subtotalCents: p4.price_cents,
            photoUrl:
              "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
          },
        ],
      },
    ];

    const insertOrderStmt = sqlite.prepare(`
      INSERT INTO orders (
        code, customer_name, customer_phone, customer_email,
        delivery_method, delivery_address, delivery_notes,
        subtotal_cents, discount_cents, shipping_cents, total_cents,
        currency, coupon_code, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ARS', ?, ?, ?, ?, ?)
    `);

    const insertItemStmt = sqlite.prepare(`
      INSERT INTO order_items (
        order_id, product_id, product_code, product_title,
        color_name, size, quantity, unit_price_cents, subtotal_cents, photo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const ord of mockOrders) {
      const existing = sqlite
        .prepare("SELECT id FROM orders WHERE code = ?")
        .get(ord.code) as { id: number } | undefined;

      let orderId = existing?.id;

      if (!existing) {
        const info = insertOrderStmt.run(
          ord.code,
          ord.customerName,
          ord.customerPhone,
          ord.customerEmail,
          ord.deliveryMethod,
          ord.deliveryAddress,
          ord.deliveryNotes,
          ord.subtotalCents,
          ord.discountCents,
          ord.shippingCents,
          ord.totalCents,
          ord.couponCode || null,
          ord.status,
          ord.notes,
          ord.createdAt,
          ord.updatedAt
        );
        orderId = Number(info.lastInsertRowid);
      }

      if (orderId) {
        const existingItems = sqlite
          .prepare("SELECT count(*) as count FROM order_items WHERE order_id = ?")
          .get(orderId) as { count: number };

        if (existingItems.count === 0) {
          for (const item of ord.items) {
            insertItemStmt.run(
              orderId,
              item.productId,
              item.productCode,
              item.productTitle,
              item.colorName,
              item.size,
              item.quantity,
              item.unitPriceCents,
              item.subtotalCents,
              item.photoUrl
            );
          }
        }
      }
    }

    sqlite
      .prepare(
        "INSERT INTO counters (name, value) VALUES ('order', 4) ON CONFLICT(name) DO UPDATE SET value = MAX(value, 4)"
      )
      .run();

    console.log("Órdenes de compra de prueba creadas exitosamente.");
  } else {
    console.log("Las órdenes ya están presentes en la base de datos.");
  }

  console.log("Base de datos local lista y verificada.");
}

main().catch(console.error);
