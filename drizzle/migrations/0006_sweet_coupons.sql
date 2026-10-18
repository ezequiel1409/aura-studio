CREATE TABLE `coupons` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE INDEX `coupons_code_idx` ON `coupons` (`code`);--> statement-breakpoint
CREATE INDEX `coupons_is_active_idx` ON `coupons` (`is_active`);--> statement-breakpoint
CREATE TABLE `coupon_redemptions` (
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
--> statement-breakpoint
CREATE INDEX `coupon_redemptions_coupon_id_idx` ON `coupon_redemptions` (`coupon_id`);--> statement-breakpoint
CREATE INDEX `coupon_redemptions_customer_email_idx` ON `coupon_redemptions` (`customer_email`);--> statement-breakpoint
CREATE INDEX `coupon_redemptions_customer_phone_idx` ON `coupon_redemptions` (`customer_phone`);--> statement-breakpoint
CREATE INDEX `coupon_redemptions_customer_dni_idx` ON `coupon_redemptions` (`customer_dni`);--> statement-breakpoint
CREATE INDEX `coupon_redemptions_coupon_email_idx` ON `coupon_redemptions` (`coupon_id`,`customer_email`);
