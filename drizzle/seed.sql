-- ==========================================
-- SEED DATA: AURA STUDIO (CLOUDFLARE D1 / LOCAL)
-- ==========================================

-- 1. Settings (BR-35)
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('whatsapp_number', '+5491100000000'),
  ('brand_name', 'Aura Studio'),
  ('reservation_hours', '48');

-- 2. Categories (BR-15, BR-19)
INSERT OR IGNORE INTO categories (id, parent_id, name, slug, position, is_hidden, is_system) VALUES
  (1, NULL, 'Sin clasificar', 'sin-clasificar', 999, 0, 1),
  (2, NULL, 'Prendas', 'prendas', 1, 0, 0),
  (3, 2, 'Remeras y Tops', 'remeras-y-tops', 1, 0, 0),
  (4, 2, 'Camisas y Blusas', 'camisas-y-blusas', 2, 0, 0),
  (5, 2, 'Buzos y Sweaters', 'buzos-y-sweaters', 3, 0, 0),
  (6, 2, 'Pantalones', 'pantalones', 4, 0, 0),
  (7, 2, 'Jeans', 'jeans', 5, 0, 0),
  (8, 2, 'Shorts y Faldas', 'shorts-y-faldas', 6, 0, 0),
  (9, 2, 'Vestidos y Enteritos', 'vestidos-y-enteritos', 7, 0, 0),
  (10, 2, 'Abrigos', 'abrigos', 8, 0, 0),
  (11, NULL, 'Calzado', 'calzado', 2, 0, 0),
  (12, NULL, 'Accesorios', 'accesorios', 3, 0, 0);

INSERT OR IGNORE INTO category_stats (category_id, views_count, last_viewed_at) VALUES
  (1, 0, NULL), (2, 0, NULL), (3, 0, NULL), (4, 0, NULL),
  (5, 0, NULL), (6, 0, NULL), (7, 0, NULL), (8, 0, NULL),
  (9, 0, NULL), (10, 0, NULL), (11, 0, NULL), (12, 0, NULL);

-- 3. Admin Users (BR-08, BR-10)
INSERT OR REPLACE INTO admin_users (id, email, name, password_hash, password_salt, role, status, created_at, updated_at) VALUES (1, 'admin@aurastudio.com', 'Administradora Principal', '778b8c8a828ee3c88f936f703011cd8324c902096a938d54c820dd18e7e8eb3385de948a5b856af18126ee1f4951b880b628306bd8b42a6e92eabba55bac2254', '1731a76f409e2a2a808446ee32ed2812', 'SUPER_ADMIN', 'ACTIVE', 1791548960310, 1791548960310);
INSERT OR REPLACE INTO admin_users (id, email, name, password_hash, password_salt, role, status, created_at, updated_at) VALUES (2, 'ezequiel140901@gmail.com', 'Ezequiel', 'b5c1f9e37947591bd3a996666cfaa0ee3c47a83fb1658ae6d6855bb017119d90fc949f04ebe2e63ff0a706b0e1d7a0d6b4727931b5dea5edc854a06612b2124d', '199d0778c590702ef49dbc37d3985d78', 'SUPER_ADMIN', 'ACTIVE', 1791665181467, 1791665181467);

-- 4. Counters (BR-01)
INSERT OR REPLACE INTO counters (name, value) VALUES ('product_code', 5);

-- 5. Mock Products (BR-02, BR-03, BR-20)
INSERT OR REPLACE INTO products (id, code, raw_text, title, price_cents, currency, size, category_id, status, is_featured, sold_out_at, reserved_until, manual_fields, created_at, updated_at) VALUES (7, 1, '✨ Top Florencia Lino
Confeccionado en lino 100% puro con escote cuadrado y tirantes regulables. Espalda con lazo ajustable.
Colores disponibles: Blanco, Negro y Beige Lino.
Precio: $ 18.500', 'Top Florencia Lino', 1850000, 'ARS', NULL, 3, 'AVAILABLE', 0, NULL, NULL, '["categoryId"]', 1791497227674, 1791497227674);
INSERT OR REPLACE INTO products (id, code, raw_text, title, price_cents, currency, size, category_id, status, is_featured, sold_out_at, reserved_until, manual_fields, created_at, updated_at) VALUES (8, 2, 'Jean Wide Leg Vintage
Denim rígido 100% algodón, tiro alto con terminación deshilachada artesanal.
Colores: Celeste Vintage y Denim Oscuro.
Precio: $ 42.000', 'Jean Wide Leg Vintage', 4200000, 'ARS', NULL, 7, 'RESERVED', 0, NULL, 1791749167803, '["categoryId"]', 1791497227784, 1791576367803);
INSERT OR REPLACE INTO products (id, code, raw_text, title, price_cents, currency, size, category_id, status, is_featured, sold_out_at, reserved_until, manual_fields, created_at, updated_at) VALUES (9, 3, 'Blazer Milano Sastrero
Corte oversize sastrero con solapa clásica, hombreras suaves y forro interno satinado en tono visón.
Colores: Negro Sastrero, Camel y Gris Perla.
Talle: ÚNICO
Precio: $ 65.000', 'Blazer Milano Sastrero', 6500000, 'ARS', 'ÚNICO', 10, 'AVAILABLE', 0, NULL, NULL, '["categoryId"]', 1791497227861, 1791497227861);
INSERT OR REPLACE INTO products (id, code, raw_text, title, price_cents, currency, size, category_id, status, is_featured, sold_out_at, reserved_until, manual_fields, created_at, updated_at) VALUES (10, 4, 'Vestido Midi Seda Noche
Vestido lencero confeccionado en satén premium con escote drapeado y espalda cruzada.
Colores: Esmeralda y Champagne.
Precio: $ 58.000', 'Vestido Midi Seda Noche', 5800000, 'ARS', NULL, 9, 'AVAILABLE', 0, NULL, NULL, '["categoryId"]', 1791497227931, 1791497227931);
INSERT OR REPLACE INTO products (id, code, raw_text, title, price_cents, currency, size, category_id, status, is_featured, sold_out_at, reserved_until, manual_fields, created_at, updated_at) VALUES (11, 5, 'Sweater Roma Cuello Tortuga
Tejido punto trenzado suave, abrigado y con terminaciones acanaladas en puños y cintura.
Colores: Off White y Moka.
Precio: $ 39.000', 'Sweater Roma Cuello Tortuga', 3900000, 'ARS', NULL, 5, 'AVAILABLE', 0, NULL, NULL, '["categoryId"]', 1791497227990, 1791546899292);

-- 6. Product Colors (BR-20)
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (7, 7, 'Blanco', '#FFFFFF', 0);
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (8, 7, 'Negro', '#1C1917', 1);
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (9, 7, 'Beige Lino', '#E7DEC8', 2);
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (10, 8, 'Celeste Vintage', '#8EABC2', 0);
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (11, 8, 'Denim Oscuro', '#1E293B', 1);
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (12, 9, 'Negro Sastrero', '#111111', 0);
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (13, 9, 'Camel', '#C19A6B', 1);
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (14, 9, 'Gris Perla', '#D1D5DB', 2);
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (15, 10, 'Verde Esmeralda', '#064E3B', 0);
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (16, 10, 'Champagne', '#F7E7CE', 1);
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (17, 11, 'Off White', '#F8FAFC', 0);
INSERT OR REPLACE INTO product_colors (id, product_id, name, hex_code, position) VALUES (18, 11, 'Marrón Moka', '#4A3728', 1);

-- 7. Product Color Sizes & Stock (BR-20)
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (21, 7, 'L', 1, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (20, 7, 'M', 3, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (19, 7, 'S', 2, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (24, 8, 'L', 0, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (23, 8, 'M', 2, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (22, 8, 'S', 1, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (27, 9, 'L', 1, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (26, 9, 'M', 2, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (25, 9, 'S', 1, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (28, 10, '36', 3, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (29, 10, '38', 4, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (30, 10, '40', 2, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (31, 11, '38', 2, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (32, 11, '40', 2, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (33, 11, '42', 1, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (34, 12, 'ÚNICO', 4, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (35, 13, 'ÚNICO', 2, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (36, 14, 'ÚNICO', 1, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (38, 15, 'M', 2, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (37, 15, 'S', 1, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (41, 16, 'L', 1, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (40, 16, 'M', 2, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (39, 16, 'S', 0, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (43, 17, 'M', 3, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (42, 17, 'S', 2, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (45, 18, 'M', 1, 0);
INSERT OR REPLACE INTO product_color_sizes (id, product_color_id, size, stock, reserved_stock) VALUES (44, 18, 'S', 1, 0);

-- 8. Product Photos (BR-07)
INSERT OR REPLACE INTO product_photos (id, product_id, position, key_thumb, key_full, created_at, product_color_id) VALUES (8, 7, 0, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1600&auto=format&fit=crop&q=90', 1791497227674, NULL);
INSERT OR REPLACE INTO product_photos (id, product_id, position, key_thumb, key_full, created_at, product_color_id) VALUES (9, 7, 1, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&auto=format&fit=crop&q=90', 1791497227674, NULL);
INSERT OR REPLACE INTO product_photos (id, product_id, position, key_thumb, key_full, created_at, product_color_id) VALUES (10, 7, 2, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1600&auto=format&fit=crop&q=90', 1791497227674, NULL);
INSERT OR REPLACE INTO product_photos (id, product_id, position, key_thumb, key_full, created_at, product_color_id) VALUES (11, 8, 0, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1600&auto=format&fit=crop&q=90', 1791497227784, NULL);
INSERT OR REPLACE INTO product_photos (id, product_id, position, key_thumb, key_full, created_at, product_color_id) VALUES (12, 8, 1, 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=1600&auto=format&fit=crop&q=90', 1791497227784, NULL);
INSERT OR REPLACE INTO product_photos (id, product_id, position, key_thumb, key_full, created_at, product_color_id) VALUES (13, 9, 0, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1600&auto=format&fit=crop&q=90', 1791497227861, NULL);
INSERT OR REPLACE INTO product_photos (id, product_id, position, key_thumb, key_full, created_at, product_color_id) VALUES (14, 9, 1, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&auto=format&fit=crop&q=90', 1791497227861, NULL);
INSERT OR REPLACE INTO product_photos (id, product_id, position, key_thumb, key_full, created_at, product_color_id) VALUES (15, 9, 2, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&auto=format&fit=crop&q=90', 1791497227861, NULL);
INSERT OR REPLACE INTO product_photos (id, product_id, position, key_thumb, key_full, created_at, product_color_id) VALUES (16, 10, 0, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1600&auto=format&fit=crop&q=90', 1791497227931, NULL);
INSERT OR REPLACE INTO product_photos (id, product_id, position, key_thumb, key_full, created_at, product_color_id) VALUES (17, 11, 0, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1600&auto=format&fit=crop&q=90', 1791497227990, NULL);

-- 9. Product Stats (BR-39)
INSERT OR REPLACE INTO product_stats (product_id, views_count, whatsapp_clicks, last_viewed_at) VALUES (7, 1, 0, 1791661464871);
INSERT OR REPLACE INTO product_stats (product_id, views_count, whatsapp_clicks, last_viewed_at) VALUES (8, 5, 1, 1791660752097);
INSERT OR REPLACE INTO product_stats (product_id, views_count, whatsapp_clicks, last_viewed_at) VALUES (9, 6, 0, 1791557919303);
INSERT OR REPLACE INTO product_stats (product_id, views_count, whatsapp_clicks, last_viewed_at) VALUES (10, 3, 0, 1791557882355);
INSERT OR REPLACE INTO product_stats (product_id, views_count, whatsapp_clicks, last_viewed_at) VALUES (11, 2, 0, 1791557067244);
