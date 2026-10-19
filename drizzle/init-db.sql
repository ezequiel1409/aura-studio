-- ===================================================
-- AURA STUDIO - ESQUEMA INICIAL DE BASE DE DATOS (D1)
-- ===================================================

CREATE TABLE IF NOT EXISTS `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`is_hidden` integer DEFAULT 0 NOT NULL,
	`is_system` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
CREATE UNIQUE INDEX IF NOT EXISTS `categories_slug_unique` ON `categories` (`slug`);

CREATE TABLE IF NOT EXISTS `category_stats` (
	`category_id` integer PRIMARY KEY NOT NULL,
	`views_count` integer DEFAULT 0 NOT NULL,
	`last_viewed_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `counters` (
	`name` text PRIMARY KEY NOT NULL,
	`value` integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS `login_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`locked_until` integer
);

CREATE TABLE IF NOT EXISTS `product_colors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`hex_code` text,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS `product_colors_product_id_position_idx` ON `product_colors` (`product_id`,`position`);

CREATE TABLE IF NOT EXISTS `product_color_sizes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_color_id` integer NOT NULL,
	`size` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`reserved_stock` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_color_id`) REFERENCES `product_colors`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS `product_color_sizes_color_size_idx` ON `product_color_sizes` (`product_color_id`,`size`);

CREATE TABLE IF NOT EXISTS `product_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`product_color_id` integer,
	`position` integer DEFAULT 0 NOT NULL,
	`key_thumb` text NOT NULL,
	`key_full` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_color_id`) REFERENCES `product_colors`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE TABLE IF NOT EXISTS `product_stats` (
	`product_id` integer PRIMARY KEY NOT NULL,
	`views_count` integer DEFAULT 0 NOT NULL,
	`whatsapp_clicks` integer DEFAULT 0 NOT NULL,
	`last_viewed_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` integer NOT NULL,
	`raw_text` text NOT NULL,
	`title` text,
	`price_cents` integer,
	`currency` text DEFAULT 'ARS' NOT NULL,
	`size` text,
	`category_id` integer NOT NULL,
	`status` text DEFAULT 'AVAILABLE' NOT NULL,
	`is_featured` integer DEFAULT 0 NOT NULL,
	`allow_return` integer DEFAULT 1 NOT NULL,
	`sold_out_at` integer,
	`reserved_until` integer,
	`manual_fields` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
CREATE UNIQUE INDEX IF NOT EXISTS `products_code_unique` ON `products` (`code`);
CREATE INDEX IF NOT EXISTS `products_status_created_at_idx` ON `products` (`status`,`created_at`);
CREATE INDEX IF NOT EXISTS `products_category_id_status_idx` ON `products` (`category_id`,`status`);
CREATE INDEX IF NOT EXISTS `products_price_cents_idx` ON `products` (`price_cents`);
CREATE INDEX IF NOT EXISTS `products_sold_out_at_idx` ON `products` (`sold_out_at`);
CREATE INDEX IF NOT EXISTS `products_is_featured_idx` ON `products` (`is_featured`);

CREATE TABLE IF NOT EXISTS `purge_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`mode` text NOT NULL,
	`products_deleted` integer DEFAULT 0 NOT NULL,
	`photos_deleted` integer DEFAULT 0 NOT NULL,
	`errors` text DEFAULT '[]' NOT NULL
);

CREATE TABLE IF NOT EXISTS `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`product_code` integer NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`at` integer NOT NULL,
	`source` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`role` text DEFAULT 'ADMIN' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `admin_users_email_unique` ON `admin_users` (`email`);
CREATE INDEX IF NOT EXISTS `admin_users_email_idx` ON `admin_users` (`email`);
CREATE INDEX IF NOT EXISTS `admin_users_status_idx` ON `admin_users` (`status`);

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS `password_reset_tokens_token_hash_unique` ON `password_reset_tokens` (`token_hash`);
CREATE INDEX IF NOT EXISTS `password_reset_tokens_token_hash_idx` ON `password_reset_tokens` (`token_hash`);
CREATE INDEX IF NOT EXISTS `password_reset_tokens_user_id_idx` ON `password_reset_tokens` (`user_id`);

CREATE TABLE IF NOT EXISTS `commerces` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`whatsapp_number` text,
	`address` text,
	`admin_user_id` integer,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE UNIQUE INDEX IF NOT EXISTS `commerces_slug_unique` ON `commerces` (`slug`);
CREATE INDEX IF NOT EXISTS `commerces_slug_idx` ON `commerces` (`slug`);
CREATE INDEX IF NOT EXISTS `commerces_admin_user_id_idx` ON `commerces` (`admin_user_id`);

CREATE TABLE IF NOT EXISTS `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `customers_email_unique` ON `customers` (`email`);
CREATE INDEX IF NOT EXISTS `customers_email_idx` ON `customers` (`email`);
CREATE INDEX IF NOT EXISTS `customers_phone_idx` ON `customers` (`phone`);
CREATE INDEX IF NOT EXISTS `customers_status_idx` ON `customers` (`status`);

CREATE TABLE IF NOT EXISTS `customer_addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`label` text DEFAULT 'Principal' NOT NULL,
	`recipient_name` text,
	`recipient_phone` text,
	`address` text NOT NULL,
	`city` text,
	`postal_code` text,
	`notes` text,
	`is_default` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS `customer_addresses_customer_id_idx` ON `customer_addresses` (`customer_id`);

CREATE TABLE IF NOT EXISTS `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` integer NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_email` text,
	`customer_dni` text,
	`delivery_method` text NOT NULL,
	`delivery_address` text,
	`delivery_notes` text,
	`subtotal_cents` integer NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`shipping_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`currency` text DEFAULT 'ARS' NOT NULL,
	`coupon_code` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`customer_id` integer,
	`commerce_id` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`commerce_id`) REFERENCES `commerces`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE UNIQUE INDEX IF NOT EXISTS `orders_code_unique` ON `orders` (`code`);
CREATE INDEX IF NOT EXISTS `orders_code_idx` ON `orders` (`code`);
CREATE INDEX IF NOT EXISTS `orders_status_created_at_idx` ON `orders` (`status`,`created_at`);
CREATE INDEX IF NOT EXISTS `orders_customer_id_idx` ON `orders` (`customer_id`);
CREATE INDEX IF NOT EXISTS `orders_customer_dni_idx` ON `orders` (`customer_dni`);
CREATE INDEX IF NOT EXISTS `orders_commerce_id_idx` ON `orders` (`commerce_id`);

CREATE TABLE IF NOT EXISTS `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer,
	`product_code` integer NOT NULL,
	`product_title` text NOT NULL,
	`color_name` text NOT NULL,
	`size` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`photo_url` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX IF NOT EXISTS `order_items_order_id_idx` ON `order_items` (`order_id`);

-- ===================================================
-- DATOS INICIALES (SEED)
-- ===================================================

-- Configuración base (BR-35)
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('whatsapp_number', '+5491100000000'),
  ('brand_name', 'Aura Studio'),
  ('reservation_hours', '48');

-- Contador atómico correlativo para productos (BR-01)
INSERT OR IGNORE INTO counters (name, value) VALUES ('product_code', 0);

-- Categoría de sistema 'Sin clasificar' (BR-19)
INSERT OR IGNORE INTO categories (id, parent_id, name, slug, position, is_hidden, is_system)
VALUES (1, NULL, 'Sin clasificar', 'sin-clasificar', 999, 0, 1);
INSERT OR IGNORE INTO category_stats (category_id, views_count, last_viewed_at) VALUES (1, 0, NULL);

-- Categoría raíz 'Prendas' (Garments)
INSERT OR IGNORE INTO categories (id, parent_id, name, slug, position, is_hidden, is_system)
VALUES (2, NULL, 'Prendas', 'prendas', 1, 0, 0);
INSERT OR IGNORE INTO category_stats (category_id, views_count, last_viewed_at) VALUES (2, 0, NULL);

-- Subcategorías de Prendas (profundidad 2, BR-15)
INSERT OR IGNORE INTO categories (id, parent_id, name, slug, position, is_hidden, is_system) VALUES
  (3, 2, 'Remeras y Tops', 'remeras-y-tops', 1, 0, 0),
  (4, 2, 'Camisas y Blusas', 'camisas-y-blusas', 2, 0, 0),
  (5, 2, 'Buzos y Sweaters', 'buzos-y-sweaters', 3, 0, 0),
  (6, 2, 'Pantalones', 'pantalones', 4, 0, 0),
  (7, 2, 'Jeans', 'jeans', 5, 0, 0),
  (8, 2, 'Shorts y Faldas', 'shorts-y-faldas', 6, 0, 0),
  (9, 2, 'Vestidos y Enteritos', 'vestidos-y-enteritos', 7, 0, 0),
  (10, 2, 'Abrigos', 'abrigos', 8, 0, 0);

INSERT OR IGNORE INTO category_stats (category_id, views_count, last_viewed_at) VALUES
  (3, 0, NULL),
  (4, 0, NULL),
  (5, 0, NULL),
  (6, 0, NULL),
  (7, 0, NULL),
  (8, 0, NULL),
  (9, 0, NULL),
  (10, 0, NULL);

-- Otras categorías raíz
INSERT OR IGNORE INTO categories (id, parent_id, name, slug, position, is_hidden, is_system) VALUES
  (11, NULL, 'Calzado', 'calzado', 2, 0, 0),
  (12, NULL, 'Accesorios', 'accesorios', 3, 0, 0);

INSERT OR IGNORE INTO category_stats (category_id, views_count, last_viewed_at) VALUES
  (11, 0, NULL),
  (12, 0, NULL);

CREATE TABLE IF NOT EXISTS `order_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` integer NOT NULL,
	`order_code` integer NOT NULL,
	`type` text DEFAULT 'REVOCATION' NOT NULL,
	`claim_code` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_dni` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_phone` text NOT NULL,
	`reason` text,
	`condition_accepted` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`rejection_reason` text,
	`admin_notes` text,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS `order_claims_claim_code_unique` ON `order_claims` (`claim_code`);
CREATE INDEX IF NOT EXISTS `order_claims_order_id_idx` ON `order_claims` (`order_id`);
CREATE INDEX IF NOT EXISTS `order_claims_claim_code_idx` ON `order_claims` (`claim_code`);
CREATE INDEX IF NOT EXISTS `order_claims_status_idx` ON `order_claims` (`status`);

