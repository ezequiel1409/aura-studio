CREATE TABLE `order_claims` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `order_claims_claim_code_unique` ON `order_claims` (`claim_code`);--> statement-breakpoint
CREATE INDEX `order_claims_order_id_idx` ON `order_claims` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_claims_claim_code_idx` ON `order_claims` (`claim_code`);--> statement-breakpoint
CREATE INDEX `order_claims_status_idx` ON `order_claims` (`status`);--> statement-breakpoint
ALTER TABLE `products` ADD `allow_return` integer DEFAULT 1 NOT NULL;