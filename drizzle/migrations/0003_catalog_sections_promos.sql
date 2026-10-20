ALTER TABLE `products` ADD `compare_at_price_cents` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `published_at` integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `products_status_published_at_idx` ON `products` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `products_sale_idx` ON `products` (`status`,`compare_at_price_cents`,`price_cents`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `product_attribute_definitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`options_json` text DEFAULT '[]' NOT NULL,
	`is_filterable` integer DEFAULT 1 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `product_attr_defs_slug_unique` ON `product_attribute_definitions` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_attr_defs_slug_idx` ON `product_attribute_definitions` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_attr_defs_position_idx` ON `product_attribute_definitions` (`position`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `product_attribute_values` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`attribute_slug` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_attr_slug_val_idx` ON `product_attribute_values` (`attribute_slug`,`value`,`product_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_attr_product_id_idx` ON `product_attribute_values` (`product_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `navigation_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`rule_type` text NOT NULL,
	`rule_config_json` text DEFAULT '{}' NOT NULL,
	`accent_color` text,
	`badge_text` text,
	`cover_image_url` text,
	`subcategories_json` text DEFAULT '[]' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`is_visible` integer DEFAULT 1 NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `nav_sections_slug_unique` ON `navigation_sections` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `nav_sections_slug_idx` ON `navigation_sections` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `nav_sections_visible_pos_idx` ON `navigation_sections` (`is_visible`,`position`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `banks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo_url` text NOT NULL,
	`brand_color` text DEFAULT '#1c1917' NOT NULL,
	`official_url` text,
	`is_active` integer DEFAULT 1 NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `banks_slug_unique` ON `banks` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `banks_slug_idx` ON `banks` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `banks_is_active_idx` ON `banks` (`is_active`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `promotions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text DEFAULT 'BANK' NOT NULL,
	`bank_id` integer,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`benefit_summary` text NOT NULL,
	`benefit_type` text NOT NULL,
	`cap_cents` integer,
	`valid_days_json` text DEFAULT '[]' NOT NULL,
	`payment_methods_json` text DEFAULT '[]' NOT NULL,
	`terms_and_conditions` text NOT NULL,
	`official_bank_url` text,
	`show_in_home_banner` integer DEFAULT 0 NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bank_id`) REFERENCES `banks`(`id`) ON UPDATE no action ON DELETE restrict
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `promotions_slug_unique` ON `promotions` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `promotions_slug_idx` ON `promotions` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `promotions_active_dates_idx` ON `promotions` (`is_active`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `promotions_bank_id_idx` ON `promotions` (`bank_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `home_banners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`placement` text DEFAULT 'HOME_HERO' NOT NULL,
	`desktop_image_url` text NOT NULL,
	`mobile_image_url` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`cta_label` text NOT NULL,
	`cta_href` text NOT NULL,
	`promotion_id` integer,
	`starts_at` integer,
	`ends_at` integer,
	`position` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE set null
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `home_banners_placement_active_idx` ON `home_banners` (`placement`,`is_active`,`position`);

