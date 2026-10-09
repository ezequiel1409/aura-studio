ALTER TABLE `products` ADD `is_featured` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `products_is_featured_idx` ON `products` (`is_featured`);