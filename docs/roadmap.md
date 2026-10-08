# Roadmap

| Fase | Entregable | Reglas | Tag |
|---|---|---|---|
| **0 · Fundación** | Repo, docs, CI/CD, deploy, env validado | AR-04 | `v0.1.0` |
| **1 · Núcleo de datos** | Schema y migraciones, seed de categorías, parser, servicios `createProduct`, `listProducts` (filtros, orden, paginación), `changeStatus`; tests | BR-01 a 06, 15 a 21, 23 | `v0.2.0` |
| **2 · Catálogo público** | Home, carrusel, grilla, filtros y orden, panel móvil, búsqueda por código, ficha con URL propia, Open Graph, tracking desacoplado de visitas y clics WhatsApp | BR-09, 16, 21 a 24, 38, 39, AR-07 | `v0.3.0` |
| **3 · Auth + backoffice base** | Login seguro, resumen, carga con vista previa, lista de prendas (con métricas), cambio de estado con deshacer e historial | BR-07, 08, 10, 11, 25 a 28, 36, 37, 39 | `v0.4.0` |
| **4 · Backoffice avanzado** | Gestión de categorías (árbol), acciones en lote, edición completa, configuración | BR-17, 18, 29, 33, 34, 35 | `v0.5.0` |
| **5 · Ciclo de vida** | Vencimiento de reservas, purga automática, barrido con vista previa, logs | BR-04, 30, 31, 32 | `v0.6.0` |
| **6 · Telegram** | Webhook seguro, álbumes, whitelist, respuesta con resumen | BR-12 | `v0.7.0` |
| **7 · Pagos** | Payment adapter (WhatsApp → Mercado Pago) | BR-13, 14 | `v1.0.0` |

Cada fase termina con: PR a `main`, CI en verde, deploy, tag y release en GitHub.
