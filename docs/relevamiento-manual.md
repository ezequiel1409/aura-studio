# Relevamiento Manual de Componentes, Servicios, APIs y Páginas

Documento de inventario técnico conciso de `src/` para auditoría y relevamiento manual de la arquitectura, seguridad, deuda técnica y neutralidad white-label.

---

## 1. Hallazgos Prioritarios para el Relevamiento

### Seguridad y Control de Acceso
- **Endpoint de expiración abierto:** [`src/app/api/orders/expire/route.ts`](../src/app/api/orders/expire/route.ts) expone `GET` y `POST` sin validación de secreto cron (`CRON_SECRET`) ni sesión admin; cualquiera puede disparar la cancelación de órdenes vencidas.
- **Precios confiados desde cliente en checkout:** [`src/services/order.service.ts`](../src/services/order.service.ts) (`createOrder`) verifica existencia y stock del producto, pero persiste `unitPriceCents`, `subtotalCents` y `totalCents` recibidos en el payload en lugar de recalcular precios desde la DB.
- **Reset con Clave Maestra sin rate-limit:** [`src/app/api/admin/password-reset/master-key/route.ts`](../src/app/api/admin/password-reset/master-key/route.ts) compara `ADMIN_RECOVERY_KEY` con `node:crypto` directamente en el handler sin registrar intentos fallidos (`loginAttempts`) ni delegar en `password-reset.service.ts`.
- **Páginas admin sin guard en Server Component:** [`src/app/admin/page.tsx`](../src/app/admin/page.tsx), [`src/app/admin/ordenes/page.tsx`](../src/app/admin/ordenes/page.tsx) y [`src/app/admin/ordenes/[id]/page.tsx`](../src/app/admin/ordenes/[id]/page.tsx) delegan la protección exclusivamente en [`src/proxy.ts`](../src/proxy.ts) (no llaman a `requireAdminSession()` como defensa en profundidad, a diferencia de las rutas bajo `(catalog)` y `(store)`).
- **Webhook Mercado Pago sin verificación HMAC:** [`src/infra/payments/mercadopago/mercadopago.adapter.ts`](../src/infra/payments/mercadopago/mercadopago.adapter.ts) no valida `x-signature` / `MP_WEBHOOK_SECRET` (aunque reconsulta el pago vía API de Mercado Pago cuando `MP_ACCESS_TOKEN` está configurado).

### Desvíos de Arquitectura (AR-02 / AR-03 / White-Label)
- **Route handlers que acceden directo a repositorios o APIs externas (AR-02):**
  - [`src/app/api/catalog/validate-stock/route.ts`](../src/app/api/catalog/validate-stock/route.ts) consulta `deps.productRepo.findById` en bucle (`Promise.all`) sin servicio.
  - [`src/app/api/admin/orders/[id]/route.ts`](../src/app/api/admin/orders/%5Bid%5D/route.ts) consulta `deps.orderRepo` directo sin `order.service.ts`.
  - [`src/app/api/admin/payments/status/route.ts`](../src/app/api/admin/payments/status/route.ts) hace `fetch("https://api.mercadopago.com/users/me")` directo en el handler.
- **Pasarelas de pago simuladas:** En [`src/services/payment.service.ts`](../src/services/payment.service.ts), los métodos `PAYWAY`, `GETNET`, `MODO` y `GOOGLEPAY` no usan adaptadores reales; devuelven `paymentUrl` directo a `/carrito?step=payment_success...`.
- **Datos sintéticos y acoplamiento de rubro (indumentaria):**
  - [`src/app/admin/page.tsx`](../src/app/admin/page.tsx) calcula `viewsCount: (p.code * 7) % 40 + 12` en lugar de leer estadísticas reales (`product_stats`).
  - [`src/app/(store)/p/[code]/page.tsx`](../src/app/%28store%29/p/%5Bcode%5D/page.tsx) hardcodea slugs de indumentaria (`top`, `remera`, `calza`, `biker`, etc.) para armar combinaciones y usa `ShareOutfitButton`.
- **Idempotencia en memoria local:** [`src/app/api/admin/products/create/route.ts`](../src/app/api/admin/products/create/route.ts) y [`src/services/order.service.ts`](../src/services/order.service.ts) mantienen caches de idempotencia en `Map` en memoria (no compartidos entre isolates de Cloudflare Workers).

### Código Sin Uso Detectado en `src/` (Candidatos a Limpieza)
13 archivos sin referencias desde ningún otro módulo de `src/`:
- **Dashboard admin:** `DashboardQuickLinks.tsx`, `DashboardStatGrid.tsx`, `DashboardWelcomeHeader.tsx`
- **Primitivas UI admin (solo en tests):** `AdminSearchFilterBar.tsx`, `AdminSwitch.tsx`, `SemanticBadge.tsx`
- **Catálogo storefront:** `ArchiveSection.tsx`, `HomeHero.tsx`, `HowToBuySection.tsx`, `WhatsAppButton.tsx` (0 refs en tests); `CategoryNav.tsx`, `SortFilterBar.tsx` (solo refs en tests)
- **Hooks:** `useAsyncAction.ts`

### Archivos Monolíticos (> 700 líneas) a Evaluar Modularización
- `CartPageClient.tsx` (2745L), `CustomerPortalClient.tsx` (1998L), `product.repository.ts` (1540L), `Header.tsx` (1235L), `ProductListClient.tsx` (1221L), `settings.service.ts` (1207L), `CatalogPanelView.tsx` (1144L), `EmailSettingsClient.tsx` (1071L), `NewProductClient.tsx` (1042L), `AppearanceSettingsClient.tsx` (1010L), `PromotionsManagerClient.tsx` (882L), `StockVariantsStep.tsx` (845L), `CouponsManagerClient.tsx` (809L), `AdminOrderDetailClient.tsx` (790L), `HomeSectionsManager.tsx` (783L), `ShippingSettingsClient.tsx` (775L), `CategoryManagerClient.tsx` (759L), `BannerCarouselManager.tsx` (742L), `order.service.ts` (732L), `PaymentsSettingsSection.tsx` (729L), `OrdersManagerClient.tsx` (704L), `connection.ts` (704L).

---

## 2. Páginas y Rutas App Router (`src/app/`)

### Raíz, Proxy y SEO
| Archivo | Líneas | Comentario |
| --- | ---: | --- |
| `src/proxy.ts` | 56 | Proxy Next.js 16 (middleware) para `/admin/:path*`: valida cookie admin y agrega `X-Robots-Tag: noindex, nofollow`. |
| `src/app/layout.tsx` | 79 | Root layout: fuentes base, metadata global vía `brand.ts` y `RouteLoadingIndicator`. |
| `src/app/global-error.tsx` | 53 | Error boundary global de último recurso (client). |
| `src/app/not-found.tsx` | 46 | Página 404 global. |
| `src/app/robots.ts` | 45 | Genera `robots.txt` bloqueando `/admin`, `/api`, `/cuenta` y `/carrito` (incluye bots de IA). |
| `src/app/sitemap.ts` | 91 | Genera `sitemap.xml` (ISR 1h) leyendo secciones, productos y promos directo de repositorios. |
| `src/app/llms.txt/route.ts` | 79 | Endpoint `/llms.txt` (ISR 1h) con resumen markdown de marca, secciones y categorías para agentes IA. |

### Storefront (`src/app/(store)/`)
| Ruta / Archivo | Líneas | Comentario |
| --- | ---: | --- |
| `src/app/(store)/layout.tsx` | 218 | Shell de tienda: inyecta `StoreThemeStyles`, `Header`, `Footer`, `CartToast` y `StoreShell` con settings y navegación. |
| `src/app/(store)/page.tsx` | 228 | Home pública (ISR): renderiza bloques configurables (banners, promos bancarias, mosaico de secciones, novedades, destacados, ofertas). |
| `src/app/(store)/catalogo/page.tsx` | 93 | Catálogo general con filtros URL (`searchParams`); delega carga en `loadCatalogPanelData` y renderiza `CatalogPanelView`. |
| `src/app/(store)/[sectionSlug]/page.tsx` | 126 | Catálogo por sección dinámica configurada en admin; reutiliza `loadCatalogPanelData`. |
| `src/app/(store)/p/[code]/page.tsx` | 497 | Ficha de producto (ISR 5m) + SEO/JSON-LD + productos complementarios (contiene lógica acoplada a indumentaria). |
| `src/app/(store)/promociones/page.tsx` | 40 | Listado público de promociones bancarias y descuentos vigentes. |
| `src/app/(store)/promociones/[slug]/page.tsx` | 311 | Detalle de promoción por slug con condiciones y productos/beneficios asociados. |
| `src/app/(store)/carrito/page.tsx` | 60 | Página de carrito y checkout en pasos (`CartPageClient`) con métodos de pago disponibles. |
| `src/app/(store)/cuenta/page.tsx` | 98 | Portal del cliente autenticado (`CustomerPortalClient`); redirige si no hay sesión cliente. |
| `src/app/(store)/cuenta/ingresar/page.tsx` | 44 | Acceso/registro de clientes (`CustomerAuthClient`). |
| `src/app/(store)/arrepentimiento/page.tsx` | 45 | Botón/formulario de arrepentimiento y reclamos (`RevocationFormClient`). |
| `src/app/(store)/terminos/page.tsx` | 110 | Términos y condiciones renderizados con `TermsContentRenderer`. |
| `src/app/(store)/loading.tsx` | 74 | Skeleton de carga para catálogo/tienda (AR-11). |
| `src/app/(store)/p/[code]/loading.tsx` | 92 | Skeleton de carga para ficha de producto. |
| `src/app/(store)/error.tsx` | 82 | Error boundary del storefront. |

### Backoffice (`src/app/admin/`)
| Ruta / Archivo | Líneas | Comentario |
| --- | ---: | --- |
| `src/app/admin/layout.tsx` | 29 | Layout admin (`noindex`): hidrata `AdminShellData` desde `dal.ts` en una sola pasada. |
| `src/app/admin/page.tsx` | 117 | Dashboard principal (checklist, alertas, métricas por período, últimos pedidos, resumen inventario). |
| `src/app/admin/login/page.tsx` | 6 | Login de administradoras (`AdminLoginClient`). |
| `src/app/admin/recuperar/page.tsx` | 486 | Recuperación de contraseña admin (email o clave maestra) — componente cliente autocontenido. |
| `src/app/admin/restablecer/page.tsx` | 252 | Confirmación de nueva contraseña admin vía token. |
| `src/app/admin/ordenes/page.tsx` | 53 | Listado de órdenes (`OrdersManagerClient`); redirige si llega `?id=`. |
| `src/app/admin/ordenes/[id]/page.tsx` | 87 | Detalle de orden e inspección de reclamo (`AdminOrderDetailClient`). |
| `src/app/admin/(catalog)/layout.tsx` | 10 | Shell de pestañas persistentes para grupo Catálogo. |
| `src/app/admin/(catalog)/productos/page.tsx` | 89 | Inventario paginado y filtrable (`ProductListClient`), requiere sesión admin. |
| `src/app/admin/(catalog)/productos/nuevo/page.tsx` | 23 | Alta guiada de producto (`NewProductClient`). |
| `src/app/admin/(catalog)/productos/[code]/editar/page.tsx` | 43 | Edición de producto (`EditProductClient`) buscando por código. |
| `src/app/admin/(catalog)/productos/atributos/page.tsx` | 32 | ABM de atributos dinámicos y config de catálogo (`CatalogAttributesManagerClient`). |
| `src/app/admin/(catalog)/productos/importar/page.tsx` | 15 | Importador masivo CSV (`ProductImportClient`). |
| `src/app/admin/(catalog)/categorias/page.tsx` | 16 | Árbol de categorías y subcategorías (`CategoryManagerClient`). |
| `src/app/admin/(catalog)/descuentos/page.tsx` | 39 | Gestión de cupones de descuento (`CouponsManagerClient`). |
| `src/app/admin/(catalog)/promociones/page.tsx` | 26 | Gestión de promociones bancarias (`PromotionsManagerClient`). |
| `src/app/admin/(store)/layout.tsx` | 10 | Shell de pestañas persistentes para grupo Mi Tienda. |
| `src/app/admin/(store)/tienda/portada/page.tsx` | 39 | Apariencia, banners, navbar, footer y secciones home (`AppearanceSettingsClient`). |
| `src/app/admin/(store)/tienda/negocio/page.tsx` | 16 | Datos del comercio, logo, vertical y horarios (`BusinessSettingsClient`). |
| `src/app/admin/(store)/tienda/pagos/page.tsx` | 16 | Configuración de medios de pago (`PaymentsSettingsClient`). |
| `src/app/admin/(store)/tienda/envios/page.tsx` | 16 | Zonas de envío, retiro y horarios (`ShippingSettingsClient`). |
| `src/app/admin/(store)/tienda/contacto/page.tsx` | 16 | WhatsApp, redes sociales y contacto en footer (`ContactSettingsClient`). |
| `src/app/admin/(store)/tienda/correos/page.tsx` | 16 | Plantillas de correo y estado de Resend (`EmailSettingsClient`). |
| `src/app/admin/(store)/tienda/politicas/page.tsx` | 16 | Términos y políticas personalizadas (`PoliciesSettingsClient`). |
| `src/app/admin/(store)/usuarios/page.tsx` | 30 | Gestión de admins subordinados (`AdminUsersClient`), restringido a `SUPER_ADMIN`. |
| `src/app/admin/**/{loading,error,not-found}.tsx` | 6–83 | Fallbacks de carga (`AdminRouteSkeleton` / spinners) y manejo de errores/404 del panel. |

---

## 3. API Endpoints (`src/app/api/`)

### Admin APIs (`/api/admin/*`)
| Endpoint | Métodos | Auth | Comentario |
| --- | --- | --- | --- |
| `src/app/api/admin/login/route.ts` | `GET`, `POST` | Pública | `GET` devuelve branding para login; `POST` autentica admin y setea cookie HTTP-only (2h). |
| `src/app/api/admin/logout/route.ts` | `POST` | Pública | Elimina la cookie de sesión admin. |
| `src/app/api/admin/session/route.ts` | `GET` | Cookie opcional | Devuelve estado y segundos restantes de la sesión admin actual. |
| `src/app/api/admin/session/refresh/route.ts` | `POST` | Sesión vigente | Renueva el TTL de la cookie admin por 2 horas más. |
| `src/app/api/admin/password-reset/request/route.ts` | `POST` | Pública | Solicita token de recuperación por email vía `password-reset.service`. |
| `src/app/api/admin/password-reset/confirm/route.ts` | `POST` | Pública | Valida token y actualiza contraseña admin. |
| `src/app/api/admin/password-reset/master-key/route.ts` | `POST` | `ADMIN_RECOVERY_KEY` | Resetea contraseña comparando clave maestra (`node:crypto`), sin servicio ni rate-limit. |
| `src/app/api/admin/users/route.ts` | `GET`, `POST` | `SUPER_ADMIN` | Lista y crea administradores subordinados. |
| `src/app/api/admin/users/status/route.ts` | `PATCH` | `SUPER_ADMIN` | Activa o suspende administradores subordinados. |
| `src/app/api/admin/products/route.ts` | `GET` | Admin | Lista paginada con filtros + resumen rápido de inventario. |
| `src/app/api/admin/products/create/route.ts` | `POST` | Admin | Crea producto con variantes/fotos e idempotencia en memoria. |
| `src/app/api/admin/products/[id]/route.ts` | `GET`, `PUT`, `DELETE` | Admin | Obtiene, edita o elimina un producto por ID (`GET` lee repo directo). |
| `src/app/api/admin/products/[id]/stock/route.ts` | `PATCH` | Admin | Edición rápida de stock por variante desde modal. |
| `src/app/api/admin/products/status/route.ts` | `POST` | Admin | Cambia estado (`AVAILABLE`, `RESERVED`, `SOLD_OUT`) y revalida caché. |
| `src/app/api/admin/products/featured/route.ts` | `POST` | Admin | Marca/desmarca producto como destacado. |
| `src/app/api/admin/products/bulk/route.ts` | `POST` | Admin | Acciones masivas (estado, mover categoría, destacar, eliminar). |
| `src/app/api/admin/products/import/route.ts` | `POST` | Admin | Importación por lote (hasta 500 filas), auto-creando categorías faltantes. |
| `src/app/api/admin/products/history/route.ts` | `GET` | Admin | Historial de cambios de estado de un producto. |
| `src/app/api/admin/products/undo/route.ts` | `POST` | Admin | Revierte el último cambio de estado (`UndoToast`). |
| `src/app/api/admin/categories/route.ts` | `GET`, `POST` | Admin | Lista árbol y crea categoría/subcategoría. |
| `src/app/api/admin/categories/[id]/route.ts` | `PATCH`, `DELETE` | Admin | Renombra, oculta o elimina categoría (moviendo huérfanos). |
| `src/app/api/admin/categories/reorder/route.ts` | `POST` | Admin | Reordena categorías. |
| `src/app/api/admin/attributes/route.ts` | `GET`, `POST`, `DELETE` | Admin | ABM de definiciones de atributos dinámicos del catálogo. |
| `src/app/api/admin/sections/route.ts` | `GET`, `POST`, `DELETE` | Admin | ABM y orden de secciones de navegación/home. |
| `src/app/api/admin/nav/route.ts` | `GET`, `PUT` | Admin | Lee y guarda configuración de barra de navegación (`NavbarConfig`). |
| `src/app/api/admin/settings/route.ts` | `GET`, `POST` | Admin | Lee y actualiza `ShowroomSettings` completos + revalidación. |
| `src/app/api/admin/coupons/route.ts` | `GET`, `POST` | Admin | Lista y crea cupones de descuento. |
| `src/app/api/admin/coupons/[id]/route.ts` | `PATCH`, `DELETE` | Admin | Edita, activa/pausa o elimina un cupón. |
| `src/app/api/admin/promotions/route.ts` | `GET`, `POST`, `DELETE` | Admin | Gestión de promociones, bancos y banners del home. |
| `src/app/api/admin/orders/route.ts` | `GET` | Admin | Lista órdenes con filtro de estado/búsqueda. |
| `src/app/api/admin/orders/[id]/route.ts` | `GET` | Admin | Detalle de orden por ID o código (accede directo a `orderRepo`). |
| `src/app/api/admin/orders/[id]/status/route.ts` | `POST` | Admin | Cambia estado logístico/ciclo de la orden y dispara emails. |
| `src/app/api/admin/orders/[id]/payment/route.ts` | `POST` | Admin | Marca manualmente estado de pago (ej. transferencia verificada). |
| `src/app/api/admin/claims/[id]/inspect/route.ts` | `POST` | Admin | Aprueba reposición de stock o rechaza reclamo postventa. |
| `src/app/api/admin/payments/status/route.ts` | `GET`, `POST` | Admin | Verifica configuración y conectividad con API de Mercado Pago. |
| `src/app/api/admin/email/status/route.ts` | `GET` | Admin | Consulta estado del proveedor de email (Resend). |
| `src/app/api/admin/email/test/route.ts` | `POST` | Admin | Envía email de prueba con la plantilla configurada. |
| `src/app/api/admin/upload/route.ts` | `POST` | Admin | Sube imágenes (máx. 4 MB, JPG/PNG/WebP/AVIF/GIF) a almacenamiento media. |

### Storefront, Cliente, Órdenes, Pagos y Media (`/api/*`)
| Endpoint | Métodos | Auth | Comentario |
| --- | --- | --- | --- |
| `src/app/api/auth/register/route.ts` | `POST` | Pública | Registra cliente y emite cookie de sesión cliente. |
| `src/app/api/auth/login/route.ts` | `POST` | Pública | Autentica cliente con control de intentos. |
| `src/app/api/auth/logout/route.ts` | `POST` | Pública | Cierra sesión cliente. |
| `src/app/api/auth/me/route.ts` | `GET` | Cliente | Devuelve perfil básico del cliente autenticado. |
| `src/app/api/customer/profile/route.ts` | `GET`, `PATCH` | Cliente | Consulta y edita perfil/contraseña del cliente. |
| `src/app/api/customer/addresses/route.ts` | `GET`, `POST` | Cliente | Lista y agrega direcciones del cliente. |
| `src/app/api/customer/addresses/[id]/route.ts` | `PATCH`, `DELETE` | Cliente | Marca dirección predeterminada o elimina dirección propia. |
| `src/app/api/customer/orders/route.ts` | `GET` | Cliente | Historial de órdenes del cliente autenticado. |
| `src/app/api/catalog/validate-stock/route.ts` | `POST` | Pública | Valida stock individual o en lote (consulta `productRepo` directo). |
| `src/app/api/search/suggestions/route.ts` | `GET` | Pública | Autocompletado de productos y categorías con caché HTTP pública. |
| `src/app/api/coupons/validate/route.ts` | `POST` | Pública | Valida cupón contra reglas y redenciones previas. |
| `src/app/api/orders/route.ts` | `POST` | Opcional cliente | Crea orden (verifica pausa de ventas, vincula cliente, valida cupón, aplica desc. transferencia, delega en `createOrder`). |
| `src/app/api/orders/expire/route.ts` | `GET`, `POST` | **Sin auth** | Ejecuta expiración de órdenes por transferencia vencidas (>24h). |
| `src/app/api/orders/[id]/receipt/route.ts` | `GET`, `POST` | `receiptGuard` / Pública en POST | `GET` descarga comprobante PDF/imagen; `POST` adjunta comprobante a la orden. |
| `src/app/api/claims/create/route.ts` | `POST` | Pública | Crea solicitud de arrepentimiento/reclamo verificando orden + identidad. |
| `src/app/api/payments/methods/route.ts` | `GET` | Pública | Lista métodos de pago habilitados según settings y env. |
| `src/app/api/payments/webhook/[provider]/route.ts` | `POST` | Pública (webhook) | Recibe notificaciones de pasarela (ej. Mercado Pago) y concilia orden. |
| `src/app/api/analytics/track/route.ts` | `POST` | Pública (filtra bots) | Registra vistas y clics WhatsApp en background (`ctx.waitUntil`). |
| `src/app/api/media/[...key]/route.ts` | `GET` | Pública | Sirve archivos multimedia (R2/local) con caché inmutable. |

---

## 4. Componentes (`src/components/`)

### Storefront: Layout, Tema, Analítica y Legales
| Componente | Líneas | Comentario |
| --- | ---: | --- |
| `src/components/layout/Header.tsx` | 1235 | Navbar principal, buscador con sugerencias, menú móvil, secciones/categorías y acceso a carrito/cuenta. |
| `src/components/layout/Footer.tsx` | 648 | Pie configurable CMS, horarios dinámicos, redes, data fiscal y enlaces legales. |
| `src/components/layout/AnnouncementBar.tsx` | 130 | Barra superior rotativa de anuncios configurables. |
| `src/components/layout/BrandLogo.tsx` | 23 | Renderiza logo del comercio con tamaño uniforme. |
| `src/components/layout/RouteLoadingIndicator.tsx` | 199 | Barra de progreso y feedback accesible al navegar entre rutas (AR-11). |
| `src/components/layout/StoreShell.tsx` | 71 | Wrapper cliente del storefront con restauración suave de scroll. |
| `src/components/theme/StoreThemeStyles.tsx` | 262 | Inyecta CSS variables de paleta, contraste accesible y tipografía elegida. |
| `src/components/analytics/AnalyticsTracker.tsx` | 75 | Dispara eventos de vista al montar y helper `trackWhatsAppClick`. |
| `src/components/icons/SocialIcons.tsx` | 79 | Iconos SVG de Instagram, TikTok y WhatsApp. |
| `src/components/legal/TermsContentRenderer.tsx` | 206 | Parser liviano de texto/Markdown para términos y políticas. |

### Storefront: Home, Catálogo, Carrito, Clientes y Reclamos
| Componente | Líneas | Comentario |
| --- | ---: | --- |
| `src/components/home/HeroBannerCarousel.tsx` | 236 | Carrusel de banners del home con fallback a hero estático. |
| `src/components/home/BankPromosBlock.tsx` | 109 | Bloque resumen de promociones bancarias vigentes en home. |
| `src/components/home/FeaturedSectionsMosaic.tsx` | 172 | Mosaico visual de secciones destacadas del catálogo. |
| `src/components/home/HomeShowcaseBlocks.tsx` | 223 | Bloques configurables: recién llegados, destacados, ofertas y trust strip. |
| `src/components/catalog/CatalogPanelView.tsx` | 1144 | Vista principal de catálogo con filtros facetados, ordenamiento, búsqueda y paginación. |
| `src/components/catalog/ProductCard.tsx` | 675 | Tarjeta de producto con selector rápido de variante, favorito y validación de stock. |
| `src/components/catalog/ProductGrid.tsx` | 58 | Grilla responsive de `ProductCard`. |
| `src/components/catalog/ProductShowcaseClient.tsx` | 156 | Orquestador de ficha de producto (galería, orden/variantes y acordeones). |
| `src/components/catalog/ProductGallery.tsx` | 285 | Galería interactiva por color con sincronización de fotos y apertura de lightbox. |
| `src/components/catalog/ProductLightboxModal.tsx` | 242 | Modal zoom/carrusel de fotos del producto. |
| `src/components/catalog/ProductOrderSection.tsx` | 474 | Selector de color/talle/cantidad, agregado al carrito (`useCartStore`) y reserva. |
| `src/components/catalog/ProductAccordions.tsx` | 159 | Acordeones de descripción, categoría y política de cambios. |
| `src/components/catalog/FavoriteButton.tsx` | 88 | Botón persistente de favoritos en `localStorage` (`useSyncExternalStore`). |
| `src/components/catalog/ShareOutfitButton.tsx` | 112 | Botón compartir producto vía Web Share / portapapeles (nombre acoplado a "Outfit"). |
| `src/components/catalog/NewPiecesAlertSection.tsx` | 124 | Suscripción/alerta visual de nuevos ingresos en home. |
| `src/components/catalog/ArchiveSection.tsx` | 133 | *Sin uso en `src/`.* Sección de piezas vendidas/archivo. |
| `src/components/catalog/CategoryNav.tsx` | 300 | *Sin uso en `src/`.* Navegación legacy de categorías (solo test). |
| `src/components/catalog/HomeHero.tsx` | 348 | *Sin uso en `src/`.* Hero legacy previo a `HeroBannerCarousel`. |
| `src/components/catalog/HowToBuySection.tsx` | 77 | *Sin uso en `src/`.* Bloque estático "Cómo comprar". |
| `src/components/catalog/SortFilterBar.tsx` | 139 | *Sin uso en `src/`.* Barra legacy reemplazada por `CatalogPanelView` (solo test). |
| `src/components/catalog/WhatsAppButton.tsx` | 52 | *Sin uso en `src/`.* Botón directo WhatsApp con tracking. |
| `src/components/cart/CartPageClient.tsx` | 2745 | Flujo completo de carrito y checkout en pasos (revisión, cupón, entrega, pago, comprobante). |
| `src/components/cart/CartDrawer.tsx` | 477 | Drawer lateral de bolsa rápida con revalidación de stock. |
| `src/components/cart/CartHeaderButton.tsx` | 41 | Botón del header con badge reactivo de unidades en carrito. |
| `src/components/cart/CartStepper.tsx` | 80 | Indicador visual de pasos del checkout. |
| `src/components/cart/CartToast.tsx` | 88 | Notificación toast al agregar ítems al carrito. |
| `src/components/cart/PaymentProcessorIcon.tsx` | 58 | Iconografía por método de pago. |
| `src/components/promotions/PromotionsPageClient.tsx` | 261 | Listado interactivo de promociones con filtros por banco, tipo y día. |
| `src/components/customer/CustomerAuthClient.tsx` | 511 | Formularios de login y registro de clientes. |
| `src/components/customer/CustomerPortalClient.tsx` | 1998 | Portal cliente: perfil, direcciones, historial de pedidos, carga de comprobantes y recompra. |
| `src/components/claims/RevocationFormClient.tsx` | 514 | Formulario público de botón de arrepentimiento y reclamos postventa. |

### Admin: Shell, Navegación, Dashboard, Onboarding y UI Primitives
| Componente | Líneas | Comentario |
| --- | ---: | --- |
| `src/components/admin/AdminShell.tsx` | 61 | Contenedor raíz del panel: inicializa tema, contexto de nav, header, frame y monitor de sesión. |
| `src/components/admin/AdminHeader.tsx` | 599 | Barra superior, menús de usuario, reloj de sesión y drawer móvil. |
| `src/components/admin/AdminLayoutFrame.tsx` | 77 | Layout de contenido admin con tabs de sección y banner de novedades. |
| `src/components/admin/AdminSessionMonitor.tsx` | 265 | Controla expiración por inactividad y renovación en 1 clic. |
| `src/components/admin/AdminThemeInitializer.tsx` | 24 | Sincroniza tema claro/oscuro admin antes/al montar. |
| `src/components/admin/AdminThemeToggle.tsx` | 52 | Switch de tema conectado a `useBackofficeStore`. |
| `src/components/admin/AdminLoginClient.tsx` | 268 | Pantalla de login admin con manejo de bloqueo por intentos. |
| `src/components/admin/header/nav-items.ts` | 235 | Definición declarativa de ítems, subrutas y helpers de ruta activa del backoffice. |
| `src/components/admin/header/AdminMobileDrawer.tsx` | 142 | Menú lateral móvil del backoffice. |
| `src/components/admin/header/AdminUserMenuPopover.tsx` | 156 | Popover de cuenta admin, tiempo de sesión y logout. |
| `src/components/admin/navigation/AdminNavContext.tsx` | 279 | Contexto global de navegación admin, badge de pedidos pendientes y estado de sesión. |
| `src/components/admin/navigation/AdminMainSidebar.tsx` | 291 | Barra lateral primaria del backoffice. |
| `src/components/admin/navigation/AdminSecondarySidebar.tsx` | 51 | Submenú lateral para secciones con pestañas. |
| `src/components/admin/navigation/AdminSectionShell.tsx` | 43 | Wrapper para layouts agrupados `(catalog)` y `(store)`. |
| `src/components/admin/navigation/AdminSectionTabs.tsx` | 45 | Tabs horizontales persistentes de subsección. |
| `src/components/admin/navigation/AdminSubNavLink.tsx` | 100 | Link de subnavegación con indicador de transición. |
| `src/components/admin/onboarding/AdminWhatsNewBanner.tsx` | 147 | Banner de últimas novedades no leídas (`releases.ts`). |
| `src/components/admin/onboarding/AdminWhatsNewModal.tsx` | 277 | Modal con changelog completo y marcado de lectura. |
| `src/components/admin/onboarding/AdminWhatsNewTrigger.tsx` | 106 | Botón disparador del modal de novedades con contador de no leídas. |
| `src/components/admin/dashboard/OnboardingChecklist.tsx` | 216 | Checklist inicial de puesta en marcha de la tienda. |
| `src/components/admin/dashboard/ActionRequiredSection.tsx` | 170 | Alertas operativas: órdenes pendientes, reservas por vencer, productos sin precio/categoría. |
| `src/components/admin/dashboard/PeriodMetricsSection.tsx` | 203 | Métricas de ventas, órdenes y ticket promedio (hoy / 7d / 30d). |
| `src/components/admin/dashboard/RecentOrdersAndViewsSection.tsx` | 225 | Últimos pedidos y top productos en dashboard. |
| `src/components/admin/dashboard/InventorySummaryLine.tsx` | 56 | Línea resumen de stock disponible, reservado y agotado. |
| `src/components/admin/dashboard/DashboardQuickLinks.tsx` | 136 | *Sin uso en `src/`.* Accesos rápidos legacy del dashboard. |
| `src/components/admin/dashboard/DashboardStatGrid.tsx` | 115 | *Sin uso en `src/`.* Grilla legacy de contadores del dashboard. |
| `src/components/admin/dashboard/DashboardWelcomeHeader.tsx` | 36 | *Sin uso en `src/`.* Cabecera legacy de bienvenida. |
| `src/components/admin/ui/AdminFeedbackBanner.tsx` | 86 | Banner accesible de éxito/error/info en línea. |
| `src/components/admin/ui/AdminImageUploadField.tsx` | 268 | Selector y subida de imagen a `/api/admin/upload` con preview. |
| `src/components/admin/ui/AdminPageHeader.tsx` | 59 | Encabezado estándar de vistas admin. |
| `src/components/admin/ui/AdminPaginationBar.tsx` | 66 | Pie de paginación uniforme para listados. |
| `src/components/admin/ui/AdminRouteSkeleton.tsx` | 102 | Skeleton reutilizable para `loading.tsx` del admin. |
| `src/components/admin/ui/ConfirmDialog.tsx` | 87 | Diálogo accesible de confirmación destructiva. |
| `src/components/admin/ui/ModalDialog.tsx` | 188 | Primitiva modal accesible (focus trap, Escape, botón >=44px). |
| `src/components/admin/ui/StockStepperField.tsx` | 97 | Control +/- de stock seguro para móvil. |
| `src/components/admin/ui/AdminSearchFilterBar.tsx` | 88 | *Sin uso en `src/` (solo test).* Barra reutilizable de búsqueda y filtros. |
| `src/components/admin/ui/AdminSwitch.tsx` | 81 | *Sin uso en `src/` (solo test).* Interruptor accesible `role="switch"`. |
| `src/components/admin/ui/SemanticBadge.tsx` | 54 | *Sin uso en `src/` (solo test).* Badge semántico de estados. |

### Admin: Catálogo, Órdenes, Usuarios y Configuración
| Componente | Líneas | Comentario |
| --- | ---: | --- |
| `src/components/admin/ProductListClient.tsx` | 1221 | Inventario admin completo: búsqueda, filtros, agrupación, cambio rápido, acciones masivas y modales. |
| `src/components/admin/products/list/ProductInventoryRowCard.tsx` | 517 | Fila/tarjeta de producto con edición inline de precio/estado y detalle de variantes. |
| `src/components/admin/products/list/ProductBulkActionBar.tsx` | 179 | Barra flotante inferior de acciones por lote. |
| `src/components/admin/NewProductClient.tsx` | 1042 | Wizard de creación de producto (datos, multimedia, variantes, atributos y preview). |
| `src/components/admin/EditProductClient.tsx` | 429 | Formulario de edición y eliminación de producto reutilizando pasos de `new/`. |
| `src/components/admin/products/form/product-form.helpers.ts` | 142 | Serialización y normalización de formulario de producto. |
| `src/components/admin/products/new/BasicDataStep.tsx` | 232 | Paso 1: título, categoría, precio, texto crudo/descripción. |
| `src/components/admin/products/new/MediaUploaderStep.tsx` | 391 | Paso 2: carga, compresión WebP cliente y orden de fotos. |
| `src/components/admin/products/new/StockVariantsStep.tsx` | 845 | Paso 3: matriz de colores, talles/sistemas de talle y stock por variante. |
| `src/components/admin/products/new/ProductAttributesStep.tsx` | 269 | Paso 4: valores de atributos dinámicos del catálogo. |
| `src/components/admin/products/new/ProductPreviewCard.tsx` | 192 | Vista previa en vivo de tarjeta de producto. |
| `src/components/admin/products/new/MobileProductPreviewSheet.tsx` | 63 | Sheet móvil de vista previa de producto. |
| `src/components/admin/products/ProductImportClient.tsx` | 576 | Descarga plantilla CSV, valida filas localmente y ejecuta importación masiva. |
| `src/components/admin/QuickStockModal.tsx` | 283 | Modal de edición rápida de stock por variante. |
| `src/components/admin/StatusHistoryModal.tsx` | 205 | Modal con auditoría de cambios de estado del producto. |
| `src/components/admin/ConfirmDeleteProductModal.tsx` | 161 | Modal de confirmación de borrado de producto. |
| `src/components/admin/UndoToast.tsx` | 124 | Toast temporizado para deshacer cambios de estado de producto. |
| `src/components/admin/CategoryManagerClient.tsx` | 759 | ABM jerárquico (2 niveles) y reordenamiento de categorías. |
| `src/components/admin/catalog/CatalogAttributesManagerClient.tsx` | 443 | ABM de atributos dinámicos y configuración de filtros/ancho del catálogo. |
| `src/components/admin/CouponsManagerClient.tsx` | 809 | ABM de cupones, alcances, topes y vigencias. |
| `src/components/admin/PromotionsManagerClient.tsx` | 882 | ABM de promociones bancarias, cuotas y beneficios por día. |
| `src/components/admin/OrdersManagerClient.tsx` | 704 | Gestión de pedidos con filtros por estado, búsqueda y actualización rápida. |
| `src/components/admin/AdminOrderDetailClient.tsx` | 790 | Detalle completo de orden, comprobante, cambio de estado/pago, WhatsApp e inspección de reclamo. |
| `src/components/admin/orders/OrderListRow.tsx` | 337 | Fila expandible de orden con cambio rápido de estado. |
| `src/components/admin/orders/OrderClaimCard.tsx` | 95 | Tarjeta de inspección postventa para aprobar reposición o rechazar reclamo. |
| `src/components/admin/orders/order-ui.config.ts` | 228 | Diccionario de estados/pagos y generador de mensajes/links WhatsApp. |
| `src/components/admin/AdminUsersClient.tsx` | 289 | Panel `SUPER_ADMIN` para alta y suspensión de administradores. |
| `src/components/admin/users/AdminUserRow.tsx` | 122 | Fila de administrador con acción activar/suspender. |
| `src/components/admin/users/CreateAdminUserModal.tsx` | 167 | Modal de creación de administrador subordinado. |
| `src/components/admin/settings/AppearanceSettingsClient.tsx` | 1010 | Editor integral de portada: tema/paleta/fuentes, banners, navbar, secciones home y footer CMS. |
| `src/components/admin/settings/BannerCarouselManager.tsx` | 742 | ABM de banners del carrusel hero. |
| `src/components/admin/settings/HomeSectionsManager.tsx` | 783 | ABM de secciones dinámicas de navegación y home. |
| `src/components/admin/settings/NavbarSettingsManager.tsx` | 234 | Orquestador de configuración del navbar editable. |
| `src/components/admin/settings/navbar/*` | 76–342 | Subcomponentes del editor de navbar (`NavbarMasterSwitch`, `NavbarAlignmentSection`, `NavbarItemRow`, `NavbarNewItemForm`, `NavbarSubItemsEditor`, `navbar-settings.utils.ts`). |
| `src/components/admin/settings/FooterCmsManager.tsx` | 376 | Editor de columnas y enlaces legales/institucionales del footer. |
| `src/components/admin/settings/FooterSettingsSection.tsx` | 627 | Vista/edición de datos de contacto en footer y horarios. |
| `src/components/admin/settings/BusinessSettingsClient.tsx` | 328 | Identidad comercial, logo, vertical, reseña y pausa de ventas. |
| `src/components/admin/settings/ContactSettingsClient.tsx` | 165 | Wrapper de contacto/redes apoyado en `FooterSettingsSection`. |
| `src/components/admin/settings/PaymentsSettingsClient.tsx` | 219 | Wrapper de guardado de medios de pago en `/api/admin/settings`. |
| `src/components/admin/settings/PaymentsSettingsSection.tsx` | 729 | UI de pasarelas (MP, Payway, Getnet, MODO, Google Pay, transferencia, efectivo, WhatsApp) y test MP. |
| `src/components/admin/settings/ShippingSettingsClient.tsx` | 775 | Configuración de zonas/tarifas de envío, retiro en showroom y horarios semanales/excepciones. |
| `src/components/admin/settings/EmailSettingsClient.tsx` | 1071 | Personalización visual/textos de emails por evento y envío de prueba. |
| `src/components/admin/settings/PoliciesSettingsClient.tsx` | 398 | Editor de términos y condiciones personalizados con preview en vivo. |

---

## 5. Servicios / Casos de Uso (`src/services/`)

| Servicio | Líneas | Comentario |
| --- | ---: | --- |
| `src/services/index.ts` | 11 | Barrel de re-exportación de servicios principales. |
| `src/services/product.service.ts` | 690 | CRUD de productos, código correlativo, parsing, stock por variante, facetas, destacados y operaciones masivas. |
| `src/services/category.service.ts` | 325 | Árbol de categorías (máx. 2 niveles), validaciones de jerarquía, conteo y reordenamiento. |
| `src/services/navigation.service.ts` | 294 | Secciones dinámicas, traducción de reglas declarativas a `ListProductsFilter` y definiciones de atributos. |
| `src/services/promotion.service.ts` | 241 | Promociones bancarias (estado calculado vigente/próxima/vencida), duplicación y banners activos del home. |
| `src/services/coupon.service.ts` | 283 | ABM de cupones y validación anti-evasión (normalización de email/teléfono/DNI y redenciones). |
| `src/services/order.service.ts` | 732 | Creación de orden con idempotencia en memoria, descuento/rollback de stock, comprobantes y expiración >24h. |
| `src/services/payment.service.ts` | 309 | Orquestación de métodos habilitados, creación de preferencias (MP real + 4 simulados), webhooks y pago manual. |
| `src/services/claim.service.ts` | 241 | Registro de reclamos/arrepentimiento (validación de identidad) e inspección admin con reposición de stock. |
| `src/services/customer.service.ts` | 381 | Registro, login, perfil, cambio de clave, libreta de direcciones e historial de órdenes de clientes. |
| `src/services/auth.service.ts` | 161 | Login admin con hash PBKDF2, control de fuerza bruta persistido en DB y emisión de token HMAC. |
| `src/services/admin-users.service.ts` | 198 | Alta, listado y suspensión de administradores subordinados (exclusivo `SUPER_ADMIN`). |
| `src/services/password-reset.service.ts` | 183 | Solicitud y confirmación de reset de clave admin vía token hasheado y email. |
| `src/services/backoffice.service.ts` | 75 | Contadores rápidos del backoffice y deshacer/historial de estado de productos. |
| `src/services/analytics.service.ts` | 107 | Registro asíncrono de vistas/clics con debounce (30 min) y exclusión de sesiones admin. |
| `src/services/settings.service.ts` | 1207 | Gestión de `ShowroomSettings` (marca, tema, horarios, navbar, footer, bloques home, pagos, envíos, emails) con caché en memoria. |

---

## 6. Dominio, Infraestructura, Stores, Hooks y Lib (Vista Rápida)

### Dominio (`src/domain/`) — Tipos y Reglas Puras
- `errors.ts` (50L), `index.ts` (15L): Jerarquía `DomainError` y barrel.
- `product/` (`types.ts` 201L, `rules.ts` 143L): Estados, variantes color/talle, umbral stock bajo (`LOW_STOCK_THRESHOLD`), transiciones.
- `category/` (`types.ts` 22L, `rules.ts` 88L): Profundidad máx. 2, slugs y protección de categoría sistema (`sin-clasificar`).
- `order/` (`types.ts` 87L, `rules.ts` 170L): Formato `#ORD-001`, validación de orden, transiciones de estado y sanitización.
- `payment/` (`types.ts` 56L, `rules.ts` 83L, `ports/payment-gateway.port.ts` 32L): Puerto `PaymentGatewayPort` y cálculo de descuentos por método.
- `cart/` (`types.ts` 16L, `rules.ts` 48L), `coupon/types.ts` (52L), `claim/types.ts` (41L), `commerce/types.ts` (22L), `customer/` (`types.ts` 57L, `rules.ts` 73L).
- `auth/` (`types.ts` 46L, `rules.ts` 55L): Roles `SUPER_ADMIN`/`ADMIN`, bloqueo tras 5 intentos fallidos, TTL de sesión.
- `navigation/types.ts` (104L), `promotion/` (`types.ts` 149L, `default-banks.ts` 124L), `email/customization.ts` (226L).
- `ports/` (`repositories.port.ts` 320L, `email.port.ts` 78L, `receipt-storage.port.ts` 24L): Interfaces hexagonales de persistencia, email y comprobantes.

### Infraestructura (`src/infra/`)
- **Auth:** `session.ts` (202L, HMAC admin), `guard.ts` (58L, validación HTTP admin), `dal.ts` (131L, `React.cache` para Server Components), `customer-session.ts` (187L, HMAC cliente), `receipt-signature.ts` (87L) y `receipt-guard.ts` (75L, acceso a comprobantes).
- **DB y Repositorios (`src/infra/db/`):** `schema.ts` (686L, 28 tablas Drizzle/SQLite-D1), `client.ts` (35L), `connection.ts` (704L, factory `getProductServiceDeps` D1/SQLite), `seed.ts` (213L), `setup-local.ts` (587L), más **16 repositorios Drizzle** (`product` 1540L, `promotion` 475L, `navigation` 402L, `order` 297L, `category` 210L, `coupon` 191L, `order-claim` 149L, `admin-user` 106L, `customer` 95L, `customer-address` 90L, `commerce` 79L, `password-reset-token` 65L, `login-attempt` 64L, `settings` 55L, `status-history` 53L, `counter` 33L).
- **Pagos (`src/infra/payments/`):** `payment-adapter.interface.ts` (25L), `whatsapp.adapter.ts` (184L), `mercadopago.adapter.ts` (200L), `bank-transfer.adapter.ts` (49L), `cash-on-delivery.adapter.ts` (48L).
- **Email, Storage y Caché:** `resend.adapter.ts` (384L), `media.storage.ts` (206L, R2/Local/Memory), `r2-receipt.storage.ts` (48L), `local-receipt.storage.ts` (47L), `memory-receipt.storage.ts` (41L), `memory-cache.ts` (73L), `revalidation.ts` (86L).

### Stores, Hooks y Lib
- **Stores (`src/stores/`):** `cart.store.ts` (254L, carrito persistido con límite por stock), `backoffice.store.ts` (191L, selección masiva, tema admin y modales).
- **Hooks (`src/hooks/`):** `useAdminSettingsForm.ts` (88L), `useAutoDismiss.ts` (32L), `useAsyncAction.ts` (51L, *sin uso en `src/`*).
- **Lib (`src/lib/`):** `env.ts` (39L, Zod), `brand.ts` (30L, defaults white-label), `logger.ts` (193L, JSON sanitizado sin PII), `crypto/password.ts` (107L, PBKDF2 WebCrypto), `catalog/load-catalog-panel.ts` (238L), `changelog/releases.ts` (257L), `email/order-templates.ts` (659L), `format/` (`colors.ts` 166L, `currency.ts` 27L), `images/compress.ts` (132L, WebP en navegador), `parser/` (`product-parser.ts` 345L, `import-template.ts` 432L, `sanitize.ts` 24L), `schedule/store-schedule.ts` (498L), `theme/` (`palettes.ts` 166L, `fonts.ts` 78L, `contrast.ts` 104L).
