CREATE TABLE `product_color_sizes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_color_id` integer NOT NULL,
	`size` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`reserved_stock` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_color_id`) REFERENCES `product_colors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_color_sizes_color_size_idx` ON `product_color_sizes` (`product_color_id`,`size`);--> statement-breakpoint
CREATE TABLE `product_colors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`hex_code` text,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_colors_product_id_position_idx` ON `product_colors` (`product_id`,`position`);--> statement-breakpoint
ALTER TABLE `product_photos` ADD `product_color_id` integer REFERENCES product_colors(id);