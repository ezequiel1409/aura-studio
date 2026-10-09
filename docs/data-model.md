# Modelo de datos (borrador para Fase 1)

Base: Cloudflare D1 (SQLite) + Drizzle. Todo cambio va con migración versionada (AR-05).

## products
| Campo | Tipo | Notas |
|---|---|---|
| id | integer PK autoincrement | Garantiza BR-01 (no se reutiliza) |
| code | integer unique | Se muestra como `#001` |
| raw_text | text | Texto crudo original (BR-05) |
| title | text null | Interpretado o editado |
| price_cents | integer null | BR-20 / BR-23 |
| currency | text default 'ARS' | |
| category_id | integer FK | Nunca nulo: "Sin clasificar" por defecto (BR-19) |
| status | text | `AVAILABLE` / `RESERVED` / `SOLD_OUT` (derivado de stock global o manual) |
| sold_out_at | integer null | BR-03 (se setea al llegar a stock total 0) |
| reserved_until | integer null | BR-30 |
| manual_fields | text (JSON) | Campos corregidos a mano, no se pisan (BR-33) |
| created_at / updated_at | integer | |

Índices: `(status, created_at)`, `(category_id, status)`, `(price_cents)`, `(sold_out_at)`.

## product_colors (Variantes de Color)
| Campo | Tipo | Notas |
|---|---|---|
| id | integer PK autoincrement | |
| product_id | integer FK (cascade) | Pertenece a un producto |
| name | text not null | Nombre del color (ej: "Negro", "Blanco", "Celeste Vintage") |
| hex_code | text null | Código hexadecimal opcional (ej: `#000000`, `#E7DEC8`) |
| position | integer default 0 | Orden de visualización en el catálogo |

Índices: `(product_id, position)`.

## product_color_sizes (Talles y Stock por Color)
| Campo | Tipo | Notas |
|---|---|---|
| id | integer PK autoincrement | |
| product_color_id | integer FK (cascade) | Pertenece a un color del producto |
| size | text not null | Normalizado: "S", "M", "L", "38", "40", "ÚNICO" (BR-20) |
| stock | integer not null default 0 | Cantidad física disponible (>= 0) |
| reserved_stock | integer not null default 0 | Cantidad comprometida en reservas temporales (>= 0) |

Índices: `(product_color_id, size)`.

## product_photos
| Campo | Tipo | Notas |
|---|---|---|
| id | integer PK autoincrement | |
| product_id | integer FK (cascade) | Producto al que pertenece |
| product_color_id | integer FK null (set null) | Opcional: foto asignada a un color específico |
| position | integer default 0 | Orden en el carrusel |
| key_thumb | text | Clave/URL en R2 (versión miniatura) |
| key_full | text | Clave/URL en R2 (versión completa) |
| created_at | integer | Timestamp unix |

## categories
`id`, `parent_id` FK null, `name`, `slug` unique, `position`, `is_hidden`, `is_system`.
Restricciones de aplicación: profundidad máxima 2 (BR-15); `is_system` para "Sin clasificar" (BR-19).
Nota: Prendas/indumentaria ("Garment"), calzado, accesorios, etc. son ramas/categorías del catálogo.

## status_history
`id`, `product_id`, `product_code`, `from_status`, `to_status`, `at`, `source` (`web` / `telegram` / `system`). Auditoría y base del "Deshacer" (BR-28).

## purge_runs
`id`, `started_at`, `mode` (`auto` / `manual` / `dry_run`), `products_deleted`, `photos_deleted`, `errors` (JSON). BR-32.

## settings
`key` PK, `value`. Claves: `whatsapp_number`, `brand_name`, `reservation_hours`. BR-35.

## login_attempts
`key` (IP o identificador), `failed_count`, `locked_until`. BR-11.

## admin_users
| Campo | Tipo | Notas |
|---|---|---|
| id | integer PK autoincrement | |
| email | text not null unique | Email normalizado en minúsculas |
| name | text not null | Nombre y apellido o alias |
| password_hash | text not null | Hash PBKDF2-HMAC-SHA512 (100.000 iteraciones) |
| password_salt | text not null | Salt criptográfico aleatorio de 16 bytes (hex) |
| role | text not null default 'ADMIN' | `SUPER_ADMIN` (gestiona otros admins) o `ADMIN` |
| status | text not null default 'ACTIVE' | `ACTIVE` o `SUSPENDED` (bloqueo por Super Admin) |
| created_at / updated_at | integer not null | Timestamp unix |

## password_reset_tokens
| Campo | Tipo | Notas |
|---|---|---|
| id | integer PK autoincrement | |
| user_id | integer not null FK | Referencia a `admin_users(id)` (cascade) |
| token_hash | text not null unique | Hash SHA-256 del token aleatorio de un solo uso |
| expires_at | integer not null | Vencimiento (1 hora por defecto) |
| used_at | integer null | Timestamp de consumo |
| created_at | integer not null | |

## category_stats
| Campo | Tipo | Notas |
|---|---|---|
| category_id | integer PK FK | Relación 1:1 con `categories` (cascade). BR-39 |
| views_count | integer default 0 | Visitas acumuladas a la sección/categoría |
| last_viewed_at | integer null | Timestamp unix de la última visita |

## product_stats
| Campo | Tipo | Notas |
|---|---|---|
| product_id | integer PK FK | Relación 1:1 con `products` (cascade al purgar). BR-39 |
| views_count | integer default 0 | Visitas a la ficha del producto |
| whatsapp_clicks | integer default 0 | Clics en "Consultar / Reservar por WhatsApp" |
| last_viewed_at | integer null | Timestamp unix de la última visita |

## Notas
- **Jerarquía de Stock**: Un producto tiene 1 o más colores (`product_colors`), y cada color tiene 1 o más talles con stock numérico (`product_color_sizes`).
- Si un producto es de talle y color único, se modela con un color `"Único"` y un talle `"ÚNICO"`.
- El estado `SOLD_OUT` se activa automáticamente cuando la suma de `stock` de todas sus combinaciones (color + talle) es igual a 0.
- `status_history.product_id` no tiene FK con cascade, para conservar la auditoría tras la purga (se guarda el `product_code`).
- Los códigos usan un contador propio (`counters`) y no `MAX()+1` (BR-01).
- `product_stats` y `category_stats` se mantienen separados de sus tablas maestras para evitar mutar `updated_at` e invalidar cachés de lectura cada vez que se registra una vista pública (AR-07).
