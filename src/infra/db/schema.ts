import {
  type AnySQLiteColumn,
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
    compareAtPriceCents: integer("compare_at_price_cents"),
    currency: text("currency").notNull().default("ARS"),
    size: text("size"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["AVAILABLE", "RESERVED", "SOLD_OUT"] })
      .notNull()
      .default("AVAILABLE"),
    isFeatured: integer("is_featured").notNull().default(0),
    allowReturn: integer("allow_return").notNull().default(1),
    publishedAt: integer("published_at"),
    soldOutAt: integer("sold_out_at"),
    reservedUntil: integer("reserved_until"),
    manualFields: text("manual_fields").notNull().default("[]"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("products_status_created_at_idx").on(table.status, table.createdAt),
    index("products_status_published_at_idx").on(table.status, table.publishedAt),
    index("products_category_id_status_idx").on(table.categoryId, table.status),
    index("products_price_cents_idx").on(table.priceCents),
    index("products_sale_idx").on(table.status, table.compareAtPriceCents, table.priceCents),
    index("products_sold_out_at_idx").on(table.soldOutAt),
    index("products_is_featured_idx").on(table.isFeatured),
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

/**
 * Tabla de Usuarios Administradores (BR-08, BR-10)
 * Soporta jerarquía Super Admin y Admins delegados con estados ACTIVE y SUSPENDED.
 */
export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    role: text("role", { enum: ["SUPER_ADMIN", "ADMIN"] })
      .notNull()
      .default("ADMIN"),
    status: text("status", { enum: ["ACTIVE", "SUSPENDED"] })
      .notNull()
      .default("ACTIVE"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("admin_users_email_idx").on(table.email),
    index("admin_users_status_idx").on(table.status),
  ]
);

/**
 * Tokens de un solo uso para recuperación de contraseña por email (BR-10)
 */
export const passwordResetTokens = sqliteTable(
  "password_reset_tokens",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: integer("expires_at").notNull(),
    usedAt: integer("used_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("password_reset_tokens_token_hash_idx").on(table.tokenHash),
    index("password_reset_tokens_user_id_idx").on(table.userId),
  ]
);

/**
 * Órdenes de Compra (Fase 5 - BR-41, BR-42)
 */
export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: integer("code").notNull().unique(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email").notNull().default(""),
    customerDni: text("customer_dni").notNull().default(""),
    deliveryMethod: text("delivery_method", {
      enum: ["HOME_DELIVERY", "MOTORCYCLE", "PICKUP"],
    }).notNull(),
    deliveryAddress: text("delivery_address"),
    deliveryNotes: text("delivery_notes"),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("ARS"),
    couponCode: text("coupon_code"),
    status: text("status", {
      enum: ["PENDING", "CONFIRMED", "PAID", "CANCELLED"],
    })
      .notNull()
      .default("PENDING"),
    paymentMethod: text("payment_method", {
      enum: [
        "MERCADOPAGO",
        "PAYWAY",
        "GETNET",
        "MODO",
        "GOOGLEPAY",
        "TRANSFER",
        "CASH",
        "STRIPE",
        "WHATSAPP",
      ],
    })
      .notNull()
      .default("WHATSAPP"),
    paymentStatus: text("payment_status", {
      enum: ["PENDING", "AUTHORIZED", "PAID", "REJECTED", "REFUNDED"],
    })
      .notNull()
      .default("PENDING"),
    paymentExternalId: text("payment_external_id"),
    paymentDiscountCents: integer("payment_discount_cents").notNull().default(0),
    customerId: integer("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    commerceId: integer("commerce_id").references(() => commerces.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("orders_code_idx").on(table.code),
    index("orders_status_created_at_idx").on(table.status, table.createdAt),
    index("orders_payment_status_idx").on(table.paymentStatus),
    index("orders_customer_id_idx").on(table.customerId),
    index("orders_customer_dni_idx").on(table.customerDni),
    index("orders_commerce_id_idx").on(table.commerceId),
  ]
);

/**
 * Comercios / Tiendas (Entidad de comercio vinculada al Administrador)
 */
export const commerces = sqliteTable(
  "commerces",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    whatsappNumber: text("whatsapp_number"),
    address: text("address"),
    adminUserId: integer("admin_user_id").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    isActive: integer("is_active").notNull().default(1),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("commerces_slug_idx").on(table.slug),
    index("commerces_admin_user_id_idx").on(table.adminUserId),
  ]
);

/**
 * Clientes / Compradores registrados en la tienda
 */
export const customers = sqliteTable(
  "customers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    phone: text("phone"),
    dni: text("dni"),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    status: text("status", { enum: ["ACTIVE", "SUSPENDED"] })
      .notNull()
      .default("ACTIVE"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("customers_email_idx").on(table.email),
    index("customers_phone_idx").on(table.phone),
    index("customers_dni_idx").on(table.dni),
    index("customers_status_idx").on(table.status),
  ]
);

/**
 * Direcciones guardadas de entrega de un Cliente
 */
export const customerAddresses = sqliteTable(
  "customer_addresses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Principal"),
    recipientName: text("recipient_name"),
    recipientPhone: text("recipient_phone"),
    address: text("address").notNull(),
    city: text("city"),
    postalCode: text("postal_code"),
    notes: text("notes"),
    isDefault: integer("is_default").notNull().default(1),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("customer_addresses_customer_id_idx").on(table.customerId),
  ]
);

/**
 * Ítems asociados a una orden de compra (BR-40, BR-42)
 */
export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productCode: integer("product_code").notNull(),
    productTitle: text("product_title").notNull(),
    colorName: text("color_name").notNull(),
    size: text("size").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    photoUrl: text("photo_url"),
  },
  (table) => [index("order_items_order_id_idx").on(table.orderId)]
);

/**
 * Cupones de descuento (Portal de Descuentos)
 */
export const coupons = sqliteTable(
  "coupons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull().unique(),
    description: text("description"),
    type: text("type", { enum: ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"] }).notNull(),
    value: integer("value").notNull(), // Porcentaje (ej: 10 para 10%) o centavos (ej: 500000 para $5.000)
    minOrderCents: integer("min_order_cents").default(0),
    maxDiscountCents: integer("max_discount_cents"), // Tope máximo en centavos para descuentos porcentuales
    usageLimit: integer("usage_limit"), // Límite global total de usos (null = ilimitado)
    usedCount: integer("used_count").notNull().default(0),
    maxUsesPerEmail: integer("max_uses_per_email").default(1), // Tope por usuario/email (1 por defecto, null = ilimitado)
    isActive: integer("is_active").notNull().default(1),
    startsAt: integer("starts_at"),
    expiresAt: integer("expires_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("coupons_code_idx").on(table.code),
    index("coupons_is_active_idx").on(table.isActive),
  ]
);

/**
 * Canjes y usos registrados de cupones por orden y email
 */
export const couponRedemptions = sqliteTable(
  "coupon_redemptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    couponId: integer("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone"),
    customerDni: text("customer_dni"),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    discountCents: integer("discount_cents").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("coupon_redemptions_coupon_id_idx").on(table.couponId),
    index("coupon_redemptions_customer_email_idx").on(table.customerEmail),
    index("coupon_redemptions_customer_phone_idx").on(table.customerPhone),
    index("coupon_redemptions_customer_dni_idx").on(table.customerDni),
    index("coupon_redemptions_coupon_email_idx").on(table.couponId, table.customerEmail),
  ]
);

/**
 * Solicitudes de Arrepentimiento y Cambios (Postventa / Res. 424/2020)
 */
export const orderClaims = sqliteTable(
  "order_claims",
  {
    id: text("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderCode: integer("order_code").notNull(),
    type: text("type", { enum: ["REVOCATION", "EXCHANGE"] }).notNull().default("REVOCATION"),
    claimCode: text("claim_code").notNull().unique(),
    customerName: text("customer_name").notNull(),
    customerDni: text("customer_dni").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    reason: text("reason"),
    conditionAccepted: integer("condition_accepted").notNull().default(1),
    status: text("status", { enum: ["PENDING", "APPROVED_RESTOCKED", "REJECTED_CONDITION", "RESOLVED"] })
      .notNull()
      .default("PENDING"),
    rejectionReason: text("rejection_reason"),
    adminNotes: text("admin_notes"),
    createdAt: integer("created_at").notNull(),
    resolvedAt: integer("resolved_at"),
  },
  (table) => [
    index("order_claims_order_id_idx").on(table.orderId),
    index("order_claims_claim_code_idx").on(table.claimCode),
    index("order_claims_status_idx").on(table.status),
  ]
);

/**
 * Definición de atributos configurables por rubro (ej. "Para", "Material", "Marca")
 */
export const productAttributeDefinitions = sqliteTable(
  "product_attribute_definitions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    optionsJson: text("options_json").notNull().default("[]"),
    isFilterable: integer("is_filterable").notNull().default(1),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    index("product_attr_defs_slug_idx").on(table.slug),
    index("product_attr_defs_position_idx").on(table.position),
  ]
);

/**
 * Valores de atributos por producto indexados para filtrado y conteo en servidor
 */
export const productAttributeValues = sqliteTable(
  "product_attribute_values",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    attributeSlug: text("attribute_slug").notNull(),
    value: text("value").notNull(),
  },
  (table) => [
    index("product_attr_slug_val_idx").on(table.attributeSlug, table.value, table.productId),
    index("product_attr_product_id_idx").on(table.productId),
  ]
);

/**
 * Secciones de navegación editables con reglas de colección (ej. HOMBRE, MUJER, SALE, RECIÉN LLEGADOS)
 */
export const navigationSections = sqliteTable(
  "navigation_sections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ruleType: text("rule_type", {
      enum: [
        "ATTRIBUTE",
        "CATEGORY",
        "DISCOUNT",
        "SALE",
        "RECENT",
        "RECENCY",
        "FEATURED",
        "MANUAL",
      ],
    }).notNull(),
    ruleConfigJson: text("rule_config_json").notNull().default("{}"),
    accentColor: text("accent_color"),
    badgeText: text("badge_text"),
    coverImageUrl: text("cover_image_url"),
    subcategoriesJson: text("subcategories_json").notNull().default("[]"),
    position: integer("position").notNull().default(0),
    isVisible: integer("is_visible").notNull().default(1),
  },
  (table) => [
    index("nav_sections_slug_idx").on(table.slug),
    index("nav_sections_visible_pos_idx").on(table.isVisible, table.position),
  ]
);

/**
 * Catálogo de bancos y billeteras reutilizables en promociones
 */
export const banks = sqliteTable(
  "banks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url").notNull().default(""),
    brandColor: text("brand_color").notNull().default("#1c1917"),
    officialUrl: text("official_url"),
    isActive: integer("is_active").notNull().default(1),
  },
  (table) => [
    index("banks_slug_idx").on(table.slug),
    index("banks_is_active_idx").on(table.isActive),
  ]
);

/**
 * Promociones bancarias y propias del comercio (informativas en Etapa 1)
 */
export const promotions = sqliteTable(
  "promotions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", { enum: ["BANK", "STORE"] }).notNull().default("BANK"),
    bankId: integer("bank_id").references(() => banks.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    benefitSummary: text("benefit_summary").notNull(),
    benefitType: text("benefit_type", {
      enum: ["INSTALLMENTS", "DISCOUNT", "CASHBACK", "BOTH"],
    }).notNull(),
    capCents: integer("cap_cents"),
    validDaysJson: text("valid_days_json").notNull().default("[]"),
    paymentMethodsJson: text("payment_methods_json").notNull().default("[]"),
    termsAndConditions: text("terms_and_conditions").notNull(),
    officialBankUrl: text("official_bank_url"),
    showInHomeBanner: integer("show_in_home_banner").notNull().default(0),
    startsAt: integer("starts_at").notNull(),
    endsAt: integer("ends_at").notNull(),
    position: integer("position").notNull().default(0),
    isActive: integer("is_active").notNull().default(1),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("promotions_slug_idx").on(table.slug),
    index("promotions_active_dates_idx").on(table.isActive, table.startsAt, table.endsAt),
    index("promotions_bank_id_idx").on(table.bankId),
  ]
);

/**
 * Banners programables con imagen diferenciada para escritorio y celular
 */
export const homeBanners = sqliteTable(
  "home_banners",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    placement: text("placement", {
      enum: ["HOME_HERO", "PROMOTIONS_HERO", "SALE_BANNER"],
    })
      .notNull()
      .default("HOME_HERO"),
    desktopImageUrl: text("desktop_image_url").notNull(),
    mobileImageUrl: text("mobile_image_url").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    ctaLabel: text("cta_label").notNull(),
    ctaHref: text("cta_href").notNull(),
    promotionId: integer("promotion_id").references(() => promotions.id, {
      onDelete: "set null",
    }),
    startsAt: integer("starts_at"),
    endsAt: integer("ends_at"),
    position: integer("position").notNull().default(0),
    isActive: integer("is_active").notNull().default(1),
  },
  (table) => [
    index("home_banners_placement_active_idx").on(table.placement, table.isActive, table.position),
  ]
);


