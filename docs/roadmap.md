# Roadmap

| Fase | Entregable | Reglas | Tag |
|---|---|---|---|
| **0 · Fundación** | Repo, docs, CI/CD, deploy, env validado | AR-04 | `v0.1.0` |
| **1 · Núcleo de datos** | Schema y migraciones, seed de categorías, parser, jerarquía de variantes (colores, talles y stock), servicios `createProduct`, `listProducts` (filtros, orden, paginación), `changeStatus`; tests | BR-01 a 06, 15 a 21, 23 | `v0.2.0` |
| **2 · Catálogo público** | Home, carrusel, grilla, filtros y orden, panel móvil, búsqueda por código, ficha con URL propia, selector interactivo de color y talle con stock, Open Graph, tracking desacoplado de visitas y clics WhatsApp, navegación fluida SPA y loading spinner accesible | BR-09, 13, 16, 20 a 24, 38, 39, AR-07, AR-11 | `v0.3.0` |
| **3 · Auth + backoffice base** | Login seguro, resumen, carga con vista previa, lista de prendas (con métricas), cambio de estado con deshacer e historial | BR-07, 08, 10, 11, 25 a 28, 36, 37, 39 | `v0.4.0` |
| **4 · Backoffice avanzado + Store Global** | Gestión de categorías (árbol), acciones en lote (`BR-29`), edición completa, configuración; **integración de Zustand** como manejador de estados global de cliente (selección múltiple de prendas, estado de lotes, modales y filtros interactivos) | BR-17, 18, 29, 33, 34, 35, AR-10 | `v0.5.0` |
| **5 · Ciclo de vida** | Vencimiento de reservas, purga automática, barrido con vista previa, logs | BR-04, 30, 31, 32 | `v0.6.0` |
| **6 · Telegram** | Webhook seguro, álbumes, whitelist, respuesta con resumen | BR-12 | `v0.7.0` |
| **7 · Pagos & Carrito** | Payment adapter (WhatsApp → Mercado Pago), carrito/bolsa multi-prenda gestionada con store global (Zustand) | BR-13, 14, AR-10 | `v1.0.0` |

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
- **Fase 7 (Pagos & Checkout multi-prenda · `v1.0.0`)**: Tienda `useCartStore` para gestionar la bolsa de compras / selección de múltiples prendas y talles antes de disparar la reserva en WhatsApp o la preferencia en Mercado Pago.
