-- ================================================================
-- AURA STUDIO: MIGRACIÓN D1 PARA AGREGAR DNI A LAS ÓRDENES
-- ================================================================

ALTER TABLE `orders` ADD COLUMN `customer_dni` text;
CREATE INDEX IF NOT EXISTS `orders_customer_dni_idx` ON `orders` (`customer_dni`);
