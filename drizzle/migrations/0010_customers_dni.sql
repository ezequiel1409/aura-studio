ALTER TABLE customers ADD COLUMN dni text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS customers_dni_idx ON customers (dni);
