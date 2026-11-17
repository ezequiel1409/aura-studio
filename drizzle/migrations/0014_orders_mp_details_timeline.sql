ALTER TABLE `orders` ADD COLUMN `customer_first_name` text;
ALTER TABLE `orders` ADD COLUMN `customer_last_name` text;
ALTER TABLE `orders` ADD COLUMN `postal_code` text;
ALTER TABLE `orders` ADD COLUMN `payment_details_json` text;
ALTER TABLE `orders` ADD COLUMN `timeline_json` text;
