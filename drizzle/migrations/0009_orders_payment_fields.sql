ALTER TABLE `orders` ADD COLUMN `payment_method` text DEFAULT 'WHATSAPP' NOT NULL;
ALTER TABLE `orders` ADD COLUMN `payment_status` text DEFAULT 'PENDING' NOT NULL;
ALTER TABLE `orders` ADD COLUMN `payment_external_id` text;
ALTER TABLE `orders` ADD COLUMN `payment_discount_cents` integer DEFAULT 0 NOT NULL;
CREATE INDEX IF NOT EXISTS `orders_payment_status_idx` ON `orders` (`payment_status`);
