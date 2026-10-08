-- Configuración base (BR-35)
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('whatsapp_number', '+5491100000000'),
  ('brand_name', 'Aura Studio'),
  ('reservation_hours', '48');

-- Contador atómico correlativo para productos (BR-01)
INSERT OR IGNORE INTO counters (name, value) VALUES ('product_code', 0);

-- Categoría de sistema 'Sin clasificar' (BR-19)
INSERT OR IGNORE INTO categories (id, parent_id, name, slug, position, is_hidden, is_system)
VALUES (1, NULL, 'Sin clasificar', 'sin-clasificar', 999, 0, 1);
INSERT OR IGNORE INTO category_stats (category_id, views_count, last_viewed_at) VALUES (1, 0, NULL);

-- Categoría raíz 'Prendas' (Garments)
INSERT OR IGNORE INTO categories (id, parent_id, name, slug, position, is_hidden, is_system)
VALUES (2, NULL, 'Prendas', 'prendas', 1, 0, 0);
INSERT OR IGNORE INTO category_stats (category_id, views_count, last_viewed_at) VALUES (2, 0, NULL);

-- Subcategorías de Prendas (profundidad 2, BR-15)
INSERT OR IGNORE INTO categories (id, parent_id, name, slug, position, is_hidden, is_system) VALUES
  (3, 2, 'Remeras y Tops', 'remeras-y-tops', 1, 0, 0),
  (4, 2, 'Camisas y Blusas', 'camisas-y-blusas', 2, 0, 0),
  (5, 2, 'Buzos y Sweaters', 'buzos-y-sweaters', 3, 0, 0),
  (6, 2, 'Pantalones', 'pantalones', 4, 0, 0),
  (7, 2, 'Jeans', 'jeans', 5, 0, 0),
  (8, 2, 'Shorts y Faldas', 'shorts-y-faldas', 6, 0, 0),
  (9, 2, 'Vestidos y Enteritos', 'vestidos-y-enteritos', 7, 0, 0),
  (10, 2, 'Abrigos', 'abrigos', 8, 0, 0);

INSERT OR IGNORE INTO category_stats (category_id, views_count, last_viewed_at) VALUES
  (3, 0, NULL),
  (4, 0, NULL),
  (5, 0, NULL),
  (6, 0, NULL),
  (7, 0, NULL),
  (8, 0, NULL),
  (9, 0, NULL),
  (10, 0, NULL);

-- Otras categorías raíz
INSERT OR IGNORE INTO categories (id, parent_id, name, slug, position, is_hidden, is_system) VALUES
  (11, NULL, 'Calzado', 'calzado', 2, 0, 0),
  (12, NULL, 'Accesorios', 'accesorios', 3, 0, 0);

INSERT OR IGNORE INTO category_stats (category_id, views_count, last_viewed_at) VALUES
  (11, 0, NULL),
  (12, 0, NULL);

