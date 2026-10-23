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
  DrizzleNavigationRepository,
  DrizzlePromotionRepository,
} from "./index";
import { ProductServiceDeps } from "../../services/product.service";
import { IEmailService } from "../../domain/ports/email.port";
import { getEmailService } from "../email/resend.adapter";

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
  navigationRepo: DrizzleNavigationRepository;
  promotionRepo: DrizzlePromotionRepository;
  emailService?: IEmailService;
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
      const hasCompareAtPrice = pragmaCols.some((col) => col.name === "compare_at_price_cents");
      if (!hasCompareAtPrice) {
        sqlite.exec("ALTER TABLE products ADD COLUMN compare_at_price_cents integer;");
      }
      const hasPublishedAt = pragmaCols.some((col) => col.name === "published_at");
      if (!hasPublishedAt) {
        sqlite.exec("ALTER TABLE products ADD COLUMN published_at integer;");
        sqlite.exec("UPDATE products SET published_at = created_at WHERE published_at IS NULL;");
      }

      const pragmaOrderCols = sqlite.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>;
      const hasCustomerDni = pragmaOrderCols.some((col) => col.name === "customer_dni");
      if (!hasCustomerDni) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN customer_dni text;");
        sqlite.exec("CREATE INDEX IF NOT EXISTS orders_customer_dni_idx ON orders (customer_dni);");
      }

      const hasPaymentMethod = pragmaOrderCols.some((col) => col.name === "payment_method");
      if (!hasPaymentMethod) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN payment_method text DEFAULT 'CASH_ON_PICKUP' NOT NULL;");
      }
      const hasPaymentStatus = pragmaOrderCols.some((col) => col.name === "payment_status");
      if (!hasPaymentStatus) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'PENDING' NOT NULL;");
        sqlite.exec("CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders (payment_status);");
      }
      const hasPaymentExternalId = pragmaOrderCols.some((col) => col.name === "payment_external_id");
      if (!hasPaymentExternalId) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN payment_external_id text;");
      }
      const hasPaymentDiscountCents = pragmaOrderCols.some((col) => col.name === "payment_discount_cents");
      if (!hasPaymentDiscountCents) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN payment_discount_cents integer DEFAULT 0 NOT NULL;");
      }
      const hasTransferReceiptUrl = pragmaOrderCols.some((col) => col.name === "transfer_receipt_url");
      if (!hasTransferReceiptUrl) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN transfer_receipt_url text;");
      }
      const hasTransferReceiptUploadedAt = pragmaOrderCols.some((col) => col.name === "transfer_receipt_uploaded_at");
      if (!hasTransferReceiptUploadedAt) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN transfer_receipt_uploaded_at integer;");
      }

      const pragmaCustomerCols = sqlite.prepare("PRAGMA table_info(customers)").all() as Array<{ name: string }>;
      if (pragmaCustomerCols.length > 0) {
        const hasDni = pragmaCustomerCols.some((col) => col.name === "dni");
        if (!hasDni) {
          sqlite.exec("ALTER TABLE customers ADD COLUMN dni text;");
          sqlite.exec("CREATE INDEX IF NOT EXISTS customers_dni_idx ON customers (dni);");
        }
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

        CREATE TABLE IF NOT EXISTS product_attribute_definitions (
          id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          slug text NOT NULL UNIQUE,
          name text NOT NULL,
          options_json text DEFAULT '[]' NOT NULL,
          is_filterable integer DEFAULT 1 NOT NULL,
          position integer DEFAULT 0 NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS product_attr_defs_slug_unique ON product_attribute_definitions (slug);
        CREATE INDEX IF NOT EXISTS product_attr_defs_slug_idx ON product_attribute_definitions (slug);
        CREATE INDEX IF NOT EXISTS product_attr_defs_position_idx ON product_attribute_definitions (position);

        CREATE TABLE IF NOT EXISTS product_attribute_values (
          id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          product_id integer NOT NULL,
          attribute_slug text NOT NULL,
          value text NOT NULL,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE cascade
        );
        CREATE INDEX IF NOT EXISTS product_attr_slug_val_idx ON product_attribute_values (attribute_slug, value, product_id);
        CREATE INDEX IF NOT EXISTS product_attr_product_id_idx ON product_attribute_values (product_id);

        CREATE TABLE IF NOT EXISTS navigation_sections (
          id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          name text NOT NULL,
          slug text NOT NULL UNIQUE,
          seo_title text,
          seo_description text,
          rule_type text NOT NULL,
          rule_config_json text DEFAULT '{}' NOT NULL,
          accent_color text,
          badge_text text,
          cover_image_url text,
          subcategories_json text DEFAULT '[]' NOT NULL,
          position integer DEFAULT 0 NOT NULL,
          is_visible integer DEFAULT 1 NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS nav_sections_slug_unique ON navigation_sections (slug);
        CREATE INDEX IF NOT EXISTS nav_sections_slug_idx ON navigation_sections (slug);
        CREATE INDEX IF NOT EXISTS nav_sections_visible_pos_idx ON navigation_sections (is_visible, position);

        CREATE TABLE IF NOT EXISTS banks (
          id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          name text NOT NULL,
          slug text NOT NULL UNIQUE,
          logo_url text NOT NULL,
          brand_color text DEFAULT '#1c1917' NOT NULL,
          official_url text,
          is_active integer DEFAULT 1 NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS banks_slug_unique ON banks (slug);
        CREATE INDEX IF NOT EXISTS banks_slug_idx ON banks (slug);
        CREATE INDEX IF NOT EXISTS banks_is_active_idx ON banks (is_active);

        CREATE TABLE IF NOT EXISTS promotions (
          id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          type text DEFAULT 'BANK' NOT NULL,
          bank_id integer,
          slug text NOT NULL UNIQUE,
          title text NOT NULL,
          benefit_summary text NOT NULL,
          benefit_type text NOT NULL,
          cap_cents integer,
          valid_days_json text DEFAULT '[]' NOT NULL,
          payment_methods_json text DEFAULT '[]' NOT NULL,
          terms_and_conditions text NOT NULL,
          official_bank_url text,
          show_in_home_banner integer DEFAULT 0 NOT NULL,
          starts_at integer NOT NULL,
          ends_at integer NOT NULL,
          position integer DEFAULT 0 NOT NULL,
          is_active integer DEFAULT 1 NOT NULL,
          created_at integer NOT NULL,
          updated_at integer NOT NULL,
          FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE restrict
        );
        CREATE UNIQUE INDEX IF NOT EXISTS promotions_slug_unique ON promotions (slug);
        CREATE INDEX IF NOT EXISTS promotions_slug_idx ON promotions (slug);
        CREATE INDEX IF NOT EXISTS promotions_active_dates_idx ON promotions (is_active, starts_at, ends_at);
        CREATE INDEX IF NOT EXISTS promotions_bank_id_idx ON promotions (bank_id);

        CREATE TABLE IF NOT EXISTS home_banners (
          id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          placement text DEFAULT 'HOME_HERO' NOT NULL,
          desktop_image_url text NOT NULL,
          mobile_image_url text NOT NULL,
          title text NOT NULL,
          subtitle text,
          cta_label text NOT NULL,
          cta_href text NOT NULL,
          promotion_id integer,
          starts_at integer,
          ends_at integer,
          position integer DEFAULT 0 NOT NULL,
          is_active integer DEFAULT 1 NOT NULL,
          FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE set null
        );
        CREATE INDEX IF NOT EXISTS home_banners_placement_active_idx ON home_banners (placement, is_active, position);
      `);

      // Sembrar atributo "Para" y secciones por defecto si están vacíos
      const attrDefsCount = sqlite
        .prepare("SELECT count(*) as count FROM product_attribute_definitions")
        .get() as { count: number };
      if (!attrDefsCount || attrDefsCount.count === 0) {
        sqlite
          .prepare(
            "INSERT OR IGNORE INTO product_attribute_definitions (slug, name, options_json, is_filterable, position) VALUES (?, ?, ?, ?, ?)"
          )
          .run("para", "Para", JSON.stringify(["Mujer", "Hombre", "Unisex"]), 1, 0);
        sqlite
          .prepare(
            "INSERT OR IGNORE INTO product_attribute_definitions (slug, name, options_json, is_filterable, position) VALUES (?, ?, ?, ?, ?)"
          )
          .run("material", "Material", JSON.stringify(["Lino", "Algodón", "Denim", "Seda", "Lana"]), 1, 1);
      }

      const navSectionsCount = sqlite
        .prepare("SELECT count(*) as count FROM navigation_sections")
        .get() as { count: number };
      if (!navSectionsCount || navSectionsCount.count === 0) {
        const insertNav = sqlite.prepare(
          `INSERT OR IGNORE INTO navigation_sections
           (name, slug, seo_title, seo_description, rule_type, rule_config_json, accent_color, badge_text, cover_image_url, subcategories_json, position, is_visible)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        insertNav.run(
          "MUJER",
          "mujer",
          "Colección Mujer | Aura Studio",
          "Prendas seleccionadas y sastrería atemporal para mujer.",
          "ATTRIBUTE",
          JSON.stringify({ attributeSlug: "para", attributeValue: "Mujer" }),
          null,
          null,
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
          "[]",
          0,
          1
        );
        insertNav.run(
          "HOMBRE",
          "hombre",
          "Colección Hombre | Aura Studio",
          "Básicos nobles, abrigos y sastrería para hombre y unisex.",
          "ATTRIBUTE",
          JSON.stringify({ attributeSlug: "para", attributeValue: "Hombre" }),
          null,
          null,
          "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80",
          "[]",
          1,
          1
        );
        insertNav.run(
          "RECIÉN LLEGADOS",
          "recien-llegados",
          "Recién Llegados | Aura Studio",
          "Nuevas piezas incorporadas en los últimos 30 días.",
          "RECENT",
          JSON.stringify({ days: 30 }),
          null,
          "Nuevo",
          "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=900&auto=format&fit=crop&q=80",
          "[]",
          2,
          1
        );
        insertNav.run(
          "SALE",
          "sale",
          "Sale y Oportunidades | Aura Studio",
          "Piezas seleccionadas con descuento sobre su precio anterior.",
          "DISCOUNT",
          JSON.stringify({}),
          "#9f1239",
          "Sale",
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80",
          "[]",
          3,
          1
        );
      }

      // Si existen productos pero ningún product_attribute_values, asignar valores iniciales para que Mujer/Hombre/Sale tengan datos
      const attrValsCount = sqlite
        .prepare("SELECT count(*) as count FROM product_attribute_values")
        .get() as { count: number };
      if (!attrValsCount || attrValsCount.count === 0) {
        const existingProds = sqlite
          .prepare("SELECT id, price_cents, compare_at_price_cents FROM products ORDER BY id ASC")
          .all() as Array<{ id: number; price_cents: number | null; compare_at_price_cents: number | null }>;

        const insertAttrVal = sqlite.prepare(
          "INSERT INTO product_attribute_values (product_id, attribute_slug, value) VALUES (?, ?, ?)"
        );
        const updateSalePrice = sqlite.prepare(
          "UPDATE products SET compare_at_price_cents = ? WHERE id = ? AND compare_at_price_cents IS NULL"
        );

        existingProds.forEach((p, idx) => {
          insertAttrVal.run(p.id, "para", "Mujer");
          if (idx % 2 === 1) {
            insertAttrVal.run(p.id, "para", "Hombre");
            insertAttrVal.run(p.id, "para", "Unisex");
          }
          if (idx === 0 || idx === 2) {
            insertAttrVal.run(p.id, "material", "Lino");
          } else {
            insertAttrVal.run(p.id, "material", "Algodón");
          }
          // Asignar compare_at_price_cents a un par de productos para poblar SALE por defecto
          if ((idx === 0 || idx === 3) && p.price_cents && !p.compare_at_price_cents) {
            const comparePrice = Math.round((p.price_cents * 1.25) / 10000) * 10000;
            if (comparePrice > p.price_cents) {
              updateSalePrice.run(comparePrice, p.id);
            }
          }
        });
      }

      // Sembrar bancos y promociones bancarias informativas de ejemplo si no existen
      const banksCount = sqlite
        .prepare("SELECT count(*) as count FROM banks")
        .get() as { count: number };
      if (!banksCount || banksCount.count === 0) {
        const now = Date.now();
        const sixtyDaysLater = now + 60 * 24 * 60 * 60 * 1000;
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

        const insertBank = sqlite.prepare(
          "INSERT INTO banks (name, slug, logo_url, brand_color, official_url, is_active) VALUES (?, ?, ?, ?, ?, ?)"
        );
        const galiciaInfo = insertBank.run(
          "Banco Galicia",
          "banco-galicia",
          "https://ui-avatars.com/api/?name=GA&background=EA580C&color=fff&bold=true&size=128",
          "#EA580C",
          "https://www.galicia.ar",
          1
        );
        const bbvaInfo = insertBank.run(
          "BBVA",
          "bbva",
          "https://ui-avatars.com/api/?name=BBVA&background=004481&color=fff&bold=true&size=128",
          "#004481",
          "https://www.bbva.com.ar",
          1
        );
        const santanderInfo = insertBank.run(
          "Banco Santander",
          "banco-santander",
          "https://ui-avatars.com/api/?name=SA&background=EC0000&color=fff&bold=true&size=128",
          "#EC0000",
          "https://www.santander.com.ar",
          1
        );

        const insertPromo = sqlite.prepare(
          `INSERT INTO promotions
           (type, bank_id, slug, title, benefit_summary, benefit_type, cap_cents, valid_days_json, payment_methods_json, terms_and_conditions, official_bank_url, show_in_home_banner, starts_at, ends_at, position, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        insertPromo.run(
          "BANK",
          Number(galiciaInfo.lastInsertRowid),
          "galicia-3-cuotas-y-20-ahorro",
          "Jueves y Viernes con Galicia",
          "20% de ahorro y hasta 3 cuotas sin interés",
          "DISCOUNT",
          1500000, // Tope $15.000
          JSON.stringify(["J", "V"]),
          JSON.stringify(["Visa Crédito", "Mastercard Crédito", "MODO"]),
          "Promoción de carácter informativo válida en la República Argentina los días jueves y viernes durante el período de vigencia para compras abonadas con tarjetas de crédito Visa y Mastercard emitidas por Banco Galicia a través de MODO. Tope de reintegro: $15.000 por mes y por cuenta. El reintegro es gestionado por la entidad bancaria según las condiciones de su cartera. Consultá alcances al coordinar tu pedido.",
          "https://www.galicia.ar/personas/beneficios",
          1,
          sevenDaysAgo,
          sixtyDaysLater,
          0,
          1,
          now,
          now
        );

        insertPromo.run(
          "BANK",
          Number(bbvaInfo.lastInsertRowid),
          "bbva-3-cuotas-sin-interes",
          "3 cuotas sin interés con BBVA",
          "3 cuotas sin interés todos los viernes y sábados",
          "INSTALLMENTS",
          null,
          JSON.stringify(["V", "S"]),
          JSON.stringify(["Visa Crédito", "Mastercard Crédito"]),
          "Beneficio informativo válido los días viernes y sábados para clientes con paquetes activos de BBVA Argentina abonando con tarjetas de crédito Visa o Mastercard. Costo Financiero Total (CFT) sujeto a las condiciones vigentes de la entidad emisora al momento de procesar el pago.",
          "https://www.bbva.com.ar/personas/promociones.html",
          0,
          sevenDaysAgo,
          sixtyDaysLater,
          1,
          1,
          now,
          now
        );

        insertPromo.run(
          "BANK",
          Number(santanderInfo.lastInsertRowid),
          "santander-15-reintegro-miercoles",
          "Miércoles de moda con Santander",
          "15% de reintegro en el acto",
          "CASHBACK",
          1200000, // Tope $12.000
          JSON.stringify(["X"]),
          JSON.stringify(["Visa Débito", "Visa Crédito", "MODO"]),
          "Promoción informativa válida los días miércoles para compras presenciales o coordinadas con tarjetas Santander seleccionadas. Tope de reintegro: $12.000 por transacción. Sujeto a términos y condiciones de Banco Santander Argentina S.A.",
          "https://www.santander.com.ar/personas/beneficios",
          0,
          sevenDaysAgo,
          sixtyDaysLater,
          2,
          1,
          now,
          now
        );
      }
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
    navigationRepo: new DrizzleNavigationRepository(db),
    promotionRepo: new DrizzlePromotionRepository(db),
    emailService: getEmailService(),
    db,
  };

  if (!isCloudflare) {
    globalDeps = deps;
  }

  return deps;
}


