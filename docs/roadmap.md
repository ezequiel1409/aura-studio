# Roadmap

| Fase | Entregable | Reglas | Tag |
|---|---|---|---|
| **0 · Fundación** | Repo, docs, CI/CD, deploy Cloudflare, env validado con Zod | AR-04 | `v0.1.0` (Completada) |
| **1 · Núcleo de datos** | Schema y migraciones, seed de categorías, parser, jerarquía de variantes (colores, talles y stock), servicios `createProduct`, `listProducts` (filtros, orden, paginación), `changeStatus`; tests | BR-01 a 06, 15 a 21, 23 | `v0.2.0` (Completada) |
| **2 · Catálogo público** | Home, carrusel, grilla, filtros y orden en URL, búsqueda por código, ficha con URL propia, selector interactivo de color y talle con stock, Open Graph, tracking desacoplado de visitas y clics WhatsApp, navegación fluida SPA y loading spinner accesible | BR-09, 13, 16, 20 a 24, 38, 39, AR-07, AR-11 | `v0.3.0` (Completada) |
| **3 · Auth + backoffice base** | Login seguro PBKDF2-HMAC-SHA512, roles Super Admin y Admin hijos, rate-limiting, resumen con contadores, carga con vista previa y parser, lista de prendas con métricas, cambio de estado con deshacer e historial | BR-07, 08, 10, 11, 25 a 28, 36, 37, 39 | `v0.4.0` (Completada) |
| **4 · Backoffice avanzado, Categorías, Temas & Store Global** | Gestión de categorías (árbol 2 niveles, reordenamiento, protección de borrado), acciones en lote (`BR-29`), personalización de showroom sin deploy (logo, colores, paletas dinámicas, portada con carrusel/banner), y Zustand como store global (`useBackofficeStore`) | BR-17, 18, 29, 33, 34, 35, AR-10 | `v0.5.0` (Completada) |
| **5 · Carrito de compras, Logística y Órdenes de Pedido/WhatsApp** | Reemplazo del botón directo de WhatsApp en la ficha por selector de cantidad (con tope estricto de inventario) y botón "Agregar al carrito"; Drawer/Modal interactivo con Zustand (`useCartStore`); cálculo de subtotales; selección de logística (Envío a domicilio / Motomensajería / Retiro en Showroom convenido); generación de Orden de Compra/Pago (`#ORD-xxx`) y adaptador de checkout multi-producto para WhatsApp | BR-40, 41, 42, AR-10, AR-12, AR-14 | `v0.6.0` (En curso) |
| **6 · Marketing: Anuncios, Popups & Cupones Jerarquizados** | Banners de anuncios superiores (announcement bar rotativo/fijo); modales/popups promocionales y de bienvenida con control de frecuencia (`localStorage`); Cupones de descuento con jerarquía estricta (`ALL_STORE`, `CATEGORY`, `SELECTED_PRODUCTS`), tipos porcentaje y monto fijo, vigencias, topes y montos mínimos; validación en tiempo real en carrito; gestión y métricas en Backoffice | BR-43, 44, AR-13, AR-15 | `v0.7.0` |
| **7 · Ciclo de vida y purgas automáticas** | Vencimiento de reservas (`reservation_hours`), purga automática de prendas en `SOLD_OUT` > 30 días, barrido manual con vista previa (*dry-run*), logs en `purge_runs` | BR-04, 30, 31, 32 | `v0.8.0` |
| **8 · Integración de Telegram & Webhook** | Bot de Telegram para alta rápida de prendas desde celular (álbum de fotos + texto crudo), autenticación por `ADMIN_CHAT_ID` y `secret_token`, respuesta con resumen y confirmación | BR-12 | `v0.9.0` |
| **9 · Pasarela de Pagos Online (Mercado Pago)** | Adaptador `MercadoPagoOrderAdapter` (Checkout Pro), webhooks de confirmación, cambio automático a `PAID` y descuento de stock atómico en base de datos | BR-14, AR-14 | `v1.0.0` |

---

## Convención de Cierre y Commits por Fase del Roadmap

Al finalizar cada fase o entrega del roadmap, es **mandatorio** registrar los cambios aplicando de forma rigurosa la convención oficial definida en [docs/git-conventions.md](file:///c:/Users/Ezequ/Documents/emprendimiento/aura-studio/docs/git-conventions.md):

1. **Commits Atómicos por Capa (Secuencia Canónica)**:
   - Prohibido consolidar toda una fase en un único commit masivo ("squash" ciego o "fase completa").
   - Los cambios deben registrarse secuencialmente por capa técnica:
     1. `docs:` Actualización de especificaciones funcionales, modelo de datos y reglas de negocio (`docs/business-rules.md`, `docs/data-model.md`, `docs/architecture.md`, `docs/roadmap.md`).
     2. `feat(db):` Esquemas Drizzle (`schema.ts`) y migraciones SQL versionadas (`drizzle/migrations/`).
     3. `feat(domain):` Entidades, tipos TypeScript puros (`src/domain/product/types.ts`) y reglas de negocio (`rules.ts`).
     4. `feat(services | payments | auth):` Servicios de aplicación, casos de uso y adaptadores de infraestructura (`src/services/`, `src/infra/`).
     5. `feat(catalog | backoffice):` Componentes de interfaz de usuario, páginas y feedback interactivo (`src/components/`, `src/app/`).
     6. `test:` Suites de pruebas automatizadas, fixtures y verificaciones (`tests/`).

2. **Formato y Propósito del Mensaje**:
   - Estructura obligatoria:
     ```text
     <tipo>(<ámbito>): <descripción concisa en minúsculas> [(BR-xx | AR-xx)]
     ```
   - Cumplir el principio rector: **"Se edita [X] para establecer funcionalidad para el objetivo [X]"** (evitar mensajes genéricos como *"ajustes de fase"* o *"update"*).
   - Indicar explícitamente las reglas de negocio (`BR-xx`) o de arquitectura (`AR-xx`) resueltas por el commit.

3. **Checklist Obligatorio de Aprobación Previa al Commit**:
   - [ ] Todos los tests de la suite en verde (`npm test` / `npx vitest run`).
   - [ ] Verificación de tipos y build de producción limpio (`npm run build`).
   - [ ] Sin archivos temporales, logs ni credenciales en el `git status`.

4. **Publicación de la Fase**:
   - Cada fase concluye formalmente con:
     - Pull Request hacia `main`.
     - CI en verde en el repositorio.
     - Deploy exitoso a producción.
     - Tag semántico correspondiente al roadmap (ej: `v0.1.0`, `v0.2.0`, `v0.3.0`, etc.) y Release documentado en GitHub.

---

## Integración del Manejador de Estados (Evaluación Técnica)

### Selección: Zustand como estándar para Next.js 16 + React 19 (App Router)

Para la arquitectura moderna de Next.js basada en React Server Components (RSC) y Server Actions, se seleccionó **Zustand** como el manejador de estados más apto por las siguientes razones técnicas:

1. **Separación de responsabilidades con RSC**:
   - **Estado de Servidor**: Administrado directamente por Server Components, Drizzle ORM y base de datos Cloudflare D1. No se requiere un cliente pesado de caché tipo Redux o Apollo.
   - **Estado de Navegación/URL**: Filtros del catálogo, orden y búsqueda se mantienen en la URL (`searchParams` / `nuqs`) para preservar la indexación, SEO y URLs compartibles.
   - **Estado Global de Cliente (Zustand)**: UI compartida, selecciones en lote de backoffice, bolsa/carrito de prendas y estados de diálogos interactivos.

2. **Ventajas clave de Zustand frente a alternativas**:
   - **Peso ínfimo (~1.1 KB)** vs. Redux Toolkit (~32 KB) o MobX (~16 KB): impacto nulo en el First Input Delay y bundle inicial.
   - **Sin Context Providers anidados**: A diferencia de React Context tradicional, no obliga a envolver todo el árbol de la aplicación en `<Provider>` de cliente, evitando desoptimizaciones en el streaming de RSC y re-renders innecesarios.
   - **Compatibilidad nativa con React 19 y SSR**: Utiliza `useSyncExternalStore` internamente, eliminando errores de *hydration mismatch* (desfase entre cliente y servidor).
   - **Suscripciones atómicas**: Permite que los componentes solo se vuelvan a renderizar cuando cambia la porción exacta de estado que consumen mediante selectores simples (`useBackofficeStore(s => s.selectedProductIds)`).

### Casos de uso asignados en el proyecto

- **Fase 4 (Backoffice Avanzado · `v0.5.0`)**: Tienda `useBackofficeStore` para la selección múltiple de prendas en acciones en lote (`BR-29`), filtros rápidos en memoria y persistencia del estado de modales de edición.
- **Fase 5 (Carrito de compras & Checkout multi-prenda · `v0.6.0`)**: Tienda `useCartStore` para gestionar la bolsa de compras / selección de múltiples prendas y talles con control de inventario antes de disparar la reserva en WhatsApp o la preferencia en Mercado Pago.
