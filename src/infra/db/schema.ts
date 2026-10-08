import {
  AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/**
 * Tabla de Categorías (BR-15, BR-18, BR-19, BR-38)
 */
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  parentId: integer("parent_id").references((): AnySQLiteColumn => categories.id, {
    onDelete: "restrict",
  }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  position: integer("position").notNull().default(0),
  isHidden: integer("is_hidden").notNull().default(0),
  isSystem: integer("is_system").notNull().default(0),
});

/**
 * Tabla de Productos (previamente garments) (BR-01, BR-02, BR-03, BR-05, BR-20, BR-23)
 */
export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: integer("code").notNull().unique(),
    rawText: text("raw_text").notNull(),
    title: text("title"),
    priceCents: integer("price_cents"),
    currency: text("currency").notNull().default("ARS"),
    size: text("size"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["AVAILABLE", "RESERVED", "SOLD_OUT"] })
      .notNull()
      .default("AVAILABLE"),
    soldOutAt: integer("sold_out_at"),
    reservedUntil: integer("reserved_until"),
    manualFields: text("manual_fields").notNull().default("[]"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("products_status_created_at_idx").on(table.status, table.createdAt),
    index("products_category_id_status_idx").on(table.categoryId, table.status),
    index("products_price_cents_idx").on(table.priceCents),
    index("products_sold_out_at_idx").on(table.soldOutAt),
  ]
);

/**
 * Variantes de color de un producto (BR-20)
 */
export const productColors = sqliteTable(
  "product_colors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    hexCode: text("hex_code"),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    index("product_colors_product_id_position_idx").on(table.productId, table.position),
  ]
);

/**
 * Talles y stock asignados a un color de producto (BR-20)
 */
export const productColorSizes = sqliteTable(
  "product_color_sizes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productColorId: integer("product_color_id")
      .notNull()
      .references(() => productColors.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    stock: integer("stock").notNull().default(0),
    reservedStock: integer("reserved_stock").notNull().default(0),
  },
  (table) => [
    index("product_color_sizes_color_size_idx").on(table.productColorId, table.size),
  ]
);

/**
 * Fotos asociadas a un producto (BR-07)
 */
export const productPhotos = sqliteTable("product_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  productColorId: integer("product_color_id").references(
    (): AnySQLiteColumn => productColors.id,
    { onDelete: "set null" }
  ),
  position: integer("position").notNull().default(0),
  keyThumb: text("key_thumb").notNull(),
  keyFull: text("key_full").notNull(),
  createdAt: integer("created_at").notNull(),
});

/**
 * Historial de cambios de estado para auditoría y deshacer (BR-28)
 * No tiene FK en cascade para preservar la auditoría tras la purga del producto.
 */
export const statusHistory = sqliteTable("status_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  productCode: integer("product_code").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  at: integer("at").notNull(),
  source: text("source", { enum: ["web", "telegram", "system"] }).notNull(),
});

/**
 * Registro de corridas de purga (BR-04, BR-32)
 */
export const purgeRuns = sqliteTable("purge_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startedAt: integer("started_at").notNull(),
  mode: text("mode", { enum: ["auto", "manual", "dry_run"] }).notNull(),
  productsDeleted: integer("products_deleted").notNull().default(0),
  photosDeleted: integer("photos_deleted").notNull().default(0),
  errors: text("errors").notNull().default("[]"),
});

/**
 * Configuraciones globales dinámicas del negocio (BR-35)
 */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * Control de fuerza bruta en login (BR-11)
 */
export const loginAttempts = sqliteTable("login_attempts", {
  key: text("key").primaryKey(),
  failedCount: integer("failed_count").notNull().default(0),
  lockedUntil: integer("locked_until"),
});

/**
 * Métricas desacopladas de categorías (AR-07, BR-39)
 */
export const categoryStats = sqliteTable("category_stats", {
  categoryId: integer("category_id")
    .primaryKey()
    .references(() => categories.id, { onDelete: "cascade" }),
  viewsCount: integer("views_count").notNull().default(0),
  lastViewedAt: integer("last_viewed_at"),
});

/**
 * Métricas desacopladas de productos (AR-07, BR-39)
 */
export const productStats = sqliteTable("product_stats", {
  productId: integer("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  viewsCount: integer("views_count").notNull().default(0),
  whatsappClicks: integer("whatsapp_clicks").notNull().default(0),
  lastViewedAt: integer("last_viewed_at"),
});

/**
 * Secuencias y contadores atómicos (BR-01: no MAX()+1)
 */
export const counters = sqliteTable("counters", {
  name: text("name").primaryKey(),
  value: integer("value").notNull().default(0),
});

