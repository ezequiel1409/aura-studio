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
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `commerces_slug_unique` ON `commerces` (`slug`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `commerces_slug_idx` ON `commerces` (`slug`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `commerces_admin_user_id_idx` ON `commerces` (`admin_user_id`);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `customers_email_unique` ON `customers` (`email`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `customers_email_idx` ON `customers` (`email`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `customers_phone_idx` ON `customers` (`phone`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `customers_status_idx` ON `customers` (`status`);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `customer_addresses_customer_id_idx` ON `customer_addresses` (`customer_id`);
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `customer_id` integer REFERENCES `customers`(`id`) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `commerce_id` integer REFERENCES `commerces`(`id`) ON DELETE set null;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `orders_customer_id_idx` ON `orders` (`customer_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `orders_commerce_id_idx` ON `orders` (`commerce_id`);

