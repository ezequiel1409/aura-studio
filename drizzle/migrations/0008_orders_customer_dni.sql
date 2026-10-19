ALTER TABLE `orders` ADD `customer_dni` text;--> statement-breakpoint
CREATE INDEX `orders_customer_dni_idx` ON `orders` (`customer_dni`);
