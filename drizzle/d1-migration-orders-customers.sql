-- ================================================================
-- AURA STUDIO: MIGRACIÓN D1 PARA TABLAS DE PEDIDOS, CLIENTES Y COMERCIO
-- ================================================================
-- Este script crea de manera segura e idempotente (IF NOT EXISTS)
-- todas las tablas e índices faltantes en Cloudflare D1.

-- 1. Tabla de Comercios
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

-- 2. Tabla de Clientes
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

-- 3. Tabla de Direcciones de Entrega de Clientes
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

-- 4. Tabla de Órdenes de Compra (Orders)
CREATE TABLE IF NOT EXISTS `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` integer NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_email` text,
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
CREATE INDEX IF NOT EXISTS `orders_commerce_id_idx` ON `orders` (`commerce_id`);

-- 5. Tabla de Artículos de la Orden (Order Items)
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

-- 6. Sembrar Comercio Predeterminado si no existe
INSERT OR IGNORE INTO `commerces` (`id`, `slug`, `name`, `whatsapp_number`, `is_active`, `created_at`, `updated_at`)
VALUES (1, 'aura-studio', 'Aura Studio', '+5491100000000', 1, 1791548960000, 1791548960000);

-- 7. Tabla de Cupones de Descuento
CREATE TABLE IF NOT EXISTS `coupons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`value` integer NOT NULL,
	`min_order_cents` integer DEFAULT 0,
	`max_discount_cents` integer,
	`usage_limit` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`max_uses_per_email` integer DEFAULT 1,
	`is_active` integer DEFAULT 1 NOT NULL,
	`starts_at` integer,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `coupons_code_unique` ON `coupons` (`code`);
CREATE INDEX IF NOT EXISTS `coupons_code_idx` ON `coupons` (`code`);
CREATE INDEX IF NOT EXISTS `coupons_is_active_idx` ON `coupons` (`is_active`);

-- 8. Tabla de Canjes de Cupones
CREATE TABLE IF NOT EXISTS `coupon_redemptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`coupon_id` integer NOT NULL,
	`order_id` integer,
	`customer_email` text NOT NULL,
	`customer_phone` text,
	`customer_dni` text,
	`customer_id` integer,
	`discount_cents` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX IF NOT EXISTS `coupon_redemptions_coupon_id_idx` ON `coupon_redemptions` (`coupon_id`);
CREATE INDEX IF NOT EXISTS `coupon_redemptions_customer_email_idx` ON `coupon_redemptions` (`customer_email`);
CREATE INDEX IF NOT EXISTS `coupon_redemptions_customer_phone_idx` ON `coupon_redemptions` (`customer_phone`);
CREATE INDEX IF NOT EXISTS `coupon_redemptions_customer_dni_idx` ON `coupon_redemptions` (`customer_dni`);
CREATE INDEX IF NOT EXISTS `coupon_redemptions_coupon_email_idx` ON `coupon_redemptions` (`coupon_id`, `customer_email`);


