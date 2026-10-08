CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`is_hidden` integer DEFAULT 0 NOT NULL,
	`is_system` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `category_stats` (
	`category_id` integer PRIMARY KEY NOT NULL,
	`views_count` integer DEFAULT 0 NOT NULL,
	`last_viewed_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `counters` (
	`name` text PRIMARY KEY NOT NULL,
	`value` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`locked_until` integer
);
--> statement-breakpoint
CREATE TABLE `product_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`key_thumb` text NOT NULL,
	`key_full` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_stats` (
	`product_id` integer PRIMARY KEY NOT NULL,
	`views_count` integer DEFAULT 0 NOT NULL,
	`whatsapp_clicks` integer DEFAULT 0 NOT NULL,
	`last_viewed_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` integer NOT NULL,
	`raw_text` text NOT NULL,
	`title` text,
	`price_cents` integer,
	`currency` text DEFAULT 'ARS' NOT NULL,
	`size` text,
	`category_id` integer NOT NULL,
	`status` text DEFAULT 'AVAILABLE' NOT NULL,
	`sold_out_at` integer,
	`reserved_until` integer,
	`manual_fields` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_code_unique` ON `products` (`code`);--> statement-breakpoint
CREATE INDEX `products_status_created_at_idx` ON `products` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `products_category_id_status_idx` ON `products` (`category_id`,`status`);--> statement-breakpoint
CREATE INDEX `products_price_cents_idx` ON `products` (`price_cents`);--> statement-breakpoint
CREATE INDEX `products_sold_out_at_idx` ON `products` (`sold_out_at`);--> statement-breakpoint
CREATE TABLE `purge_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`mode` text NOT NULL,
	`products_deleted` integer DEFAULT 0 NOT NULL,
	`photos_deleted` integer DEFAULT 0 NOT NULL,
	`errors` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`product_code` integer NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`at` integer NOT NULL,
	`source` text NOT NULL
);
