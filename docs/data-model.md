# Modelo de datos (borrador para Fase 1)

Base: Cloudflare D1 (SQLite) + Drizzle. Todo cambio va con migración versionada (AR-05).

## garments
| Campo | Tipo | Notas |
|---|---|---|
| id | integer PK autoincrement | Garantiza BR-01 (no se reutiliza) |
| code | integer unique | Se muestra como `#001` |
| raw_text | text | Texto crudo original (BR-05) |
| title | text null | Interpretado o editado |
| price_cents | integer null | BR-20 / BR-23 |
| currency | text default 'ARS' | |
| size | text null | Normalizado (BR-20) |
| category_id | integer FK | Nunca nulo: "Sin clasificar" por defecto (BR-19) |
| status | text | `AVAILABLE` / `RESERVED` / `SOLD_OUT` |
| sold_out_at | integer null | BR-03 |
| reserved_until | integer null | BR-30 |
| manual_fields | text (JSON) | Campos corregidos a mano, no se pisan (BR-33) |
| created_at / updated_at | integer | |

Índices: `(status, created_at)`, `(category_id, status)`, `(price_cents)`, `(sold_out_at)`.

## garment_photos
`id`, `garment_id` FK (cascade), `position`, `key_thumb`, `key_full` (claves en R2), `created_at`.

## categories
`id`, `parent_id` FK null, `name`, `slug` unique, `position`, `is_hidden`, `is_system`.
Restricciones de aplicación: profundidad máxima 2 (BR-15); `is_system` para "Sin clasificar" (BR-19).

## status_history
`id`, `garment_id`, `from_status`, `to_status`, `at`, `source` (`web` / `telegram` / `system`). Auditoría y base del "Deshacer" (BR-28).

## purge_runs
`id`, `started_at`, `mode` (`auto` / `manual` / `dry_run`), `garments_deleted`, `photos_deleted`, `errors` (JSON). BR-32.

## settings
`key` PK, `value`. Claves: `whatsapp_number`, `brand_name`, `reservation_hours`. BR-35.

## login_attempts
`key` (IP o global), `failed_count`, `locked_until`. BR-11.

## category_stats
| Campo | Tipo | Notas |
|---|---|---|
| category_id | integer PK FK | Relación 1:1 con `categories` (cascade). BR-39 |
| views_count | integer default 0 | Visitas acumuladas a la sección/categoría |
| last_viewed_at | integer null | Timestamp unix de la última visita |

## garment_stats
| Campo | Tipo | Notas |
|---|---|---|
| garment_id | integer PK FK | Relación 1:1 con `garments` (cascade al purgar). BR-39 |
| views_count | integer default 0 | Visitas a la ficha de la prenda |
| whatsapp_clicks | integer default 0 | Clics en "Consultar / Reservar por WhatsApp" |
| last_viewed_at | integer null | Timestamp unix de la última visita |

## Notas
- `status_history.garment_id` no tiene FK con cascade, para conservar la auditoría tras la purga (se guarda el `code`).
- Los códigos usan un contador propio (`sqlite_sequence` o tabla `counters`) y no `MAX()+1`.
- `garment_stats` y `category_stats` se mantienen separados de sus tablas maestras para evitar mutar `updated_at` e invalidar cachés de lectura cada vez que se registra una vista pública (AR-07).
