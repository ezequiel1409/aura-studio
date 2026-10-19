-- ================================================================
-- AURA STUDIO: MIGRACIÓN D1 PARA ARREPENTIMIENTO Y CAMBIOS (RES. 424/2020)
-- ================================================================

-- 1. Agregar columna allow_return a la tabla products si no existe
-- En SQLite / D1, si ya existe no falla al atrapar error
ALTER TABLE `products` ADD COLUMN `allow_return` integer DEFAULT 1 NOT NULL;

-- 2. Crear tabla de Reclamos / Arrepentimiento / Cambios (order_claims)
CREATE TABLE IF NOT EXISTS `order_claims` (
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

CREATE UNIQUE INDEX IF NOT EXISTS `order_claims_claim_code_unique` ON `order_claims` (`claim_code`);
CREATE INDEX IF NOT EXISTS `order_claims_order_id_idx` ON `order_claims` (`order_id`);
CREATE INDEX IF NOT EXISTS `order_claims_claim_code_idx` ON `order_claims` (`claim_code`);
CREATE INDEX IF NOT EXISTS `order_claims_status_idx` ON `order_claims` (`status`);
