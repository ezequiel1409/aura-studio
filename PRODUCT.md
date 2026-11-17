# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Compradores minoristas (público mobile-first en Argentina):** Navegan catálogos de emprendimientos (moda, accesorios, decoración y rubros afines) principalmente desde el celular, seleccionan variantes reales de color y talle, aplican cupones, eligen envío o retiro y pagan por Mercado Pago Checkout Pro, transferencia bancaria directa, efectivo o WhatsApp, consultando luego sus pedidos en `/cuenta`.
2. **Emprendedores y administradoras de tienda (`SUPER_ADMIN` / `ADMIN`):** Gestionan productos, stock y pedidos desde el celular (incluyendo carga rápida en bloque por texto y fotos), personalizan identidad visual y reglas de negocio sin deploy desde el panel (`/admin`), concilian pagos/reembolsos y atienden postventa.
3. **Orquestador / Operador de plataforma:** Forkea este motor base neutro para cada comercio cliente e inyecta identidad, variables de entorno y credenciales aisladas por despliegue.

## Product Purpose

Proveer un motor de comercio electrónico white-label completo, listo para desplegar tiendas online independientes para emprendimientos minoristas argentinos, maximizando la conversión móvil del comprador y simplificando al máximo la operación diaria del dueño desde el celular sin intermediarios ni comisiones por venta.

## Positioning

Frente a plataformas SaaS cerradas con comisiones por transacción o límites rígidos de plantilla (como Tiendanube o Empretienda), este motor otorga **soberanía total white-label** sobre un despliegue propio por comercio (Next.js + Cloudflare Workers + D1/R2), combinando backoffice mobile-first con carga asistida de catálogo, multi-pasarela real (Checkout Pro con SDK oficial y transferencia directa bonificada) y postventa integrada transparente (`/cuenta`, timeline cronológico de orden y botón de arrepentimiento legal Res. 424/2020).

## Operating Context

- **Mercado y moneda:** Argentina, precios expresados en pesos argentinos (**ARS**) almacenados en centavos enteros para evitar errores de redondeo, con logística local (envío a domicilio por correo/encomienda, motomensajería express y retiro en showroom/local).
- **Voz y copy:** Español rioplatense (**`vos`**), claro, directo y cercano en storefront, checkout, mensajes de error y correos transaccionales.
- **Infraestructura por comercio:** Cada tienda se aprovisiona mediante un fork gestionado por un orquestador sobre Next.js 16 (App Router), Cloudflare Workers (`@opennextjs/cloudflare`), D1/SQLite (Drizzle ORM) y R2, con identidad y credenciales resueltas dinámicamente vía `env`, secrets del servidor y base de datos.

## Capabilities and Constraints

- **Neutralidad absoluta white-label:** Queda estrictamente prohibido codificar a fuego nombres de marca, slugs, dominios, teléfonos, correos o identidades fijas de un comercio específico. Toda interfaz debe convivir armónicamente con las paletas de color, logotipos y fuentes tipográficas dinámicas configuradas por cada comercio en `/admin/tienda/portada`.
- **Control físico de stock y flujo atómico:** Topes estrictos por variante (color/talle) en carrito (`/carrito`), descuento de stock únicamente al confirmarse el pago/orden y restauración automática idempotente en cancelaciones o reembolsos.
- **Pagos desacoplados (`PaymentGatewayPort`):** Mercado Pago Checkout Pro (con Wallet Brick / SDK V2, persistencia de cuotas y tarjeta, webhooks verificados por HMAC, cancelación y reembolso real vía API), transferencia bancaria directa (CBU/CVU/Alias con carga segura de comprobante), efectivo y WhatsApp.
- **Postventa y marco legal:** Portal `/cuenta` con historial y libreta de direcciones, línea de tiempo cronológica en `/admin/ordenes/[id]`, mesa de reclamos y flujo legal de arrepentimiento (Resolución 424/2020).
- **Backoffice mobile-first:** Carga asistida por parser de texto libre sin bloquear publicación (`BR-05` / `BR-26`), acciones en lote, historial con deshacer, vencimiento automático de reservas y purga a 30 días de agotados.
- **Líneas evolutivas abiertas en Roadmap (`docs/roadmap.md`):** Onboarding guiado de pagos en `/admin/tienda/pagos` (copia en un clic de URL de webhook y checklist), evolución opcional a OAuth Marketplace vía Orquestador en Fase 10, conectores fiscales (`InvoicingPort`) y operadores logísticos (`ShippingCarrierPort`).

## Brand Commitments

- **Plantilla neutra multi-rubro:** Sin marca fija ni sesgo visual exclusivo hacia una sola tienda piloto; los estilos base funcionan como lienzo adaptable para moda, accesorios, decoración y otros emprendimientos minoristas.
- **Tono y microcopy:** Español rioplatense (`vos`), directo y libre de jerga técnica hacia compradores y comerciantes.
- **Identidad de terceros:** Respetar los íconos y componentes oficiales de Mercado Pago (`@mercadopago/sdk-react` y branding oficial) dentro de checkout y panel de órdenes.

## Evidence on Hand

- Especificación funcional y arquitectónica documentada en `docs/roadmap.md`, `docs/business-rules.md`, `docs/architecture.md`, `AGENTS.md` y `GEMINI.md`.
- Implementación funcional y verificada con tests automatizados (`tests/`) en catálogo (`/`, `/catalogo`, `/p/[code]`), carrito (`/carrito`), portal `/cuenta`, `/arrepentimiento`, backoffice (`/admin/**`) y correos transaccionales (`src/lib/email/order-templates.ts`).
- **Ausencias que nunca deben inventarse:** No existen ni deben fabricarse testimonios de clientes, métricas de ventas ficticias, reseñas simuladas ni logos de comercios falsos en la interfaz.

## Product Principles

1. **Cero fricción móvil de punta a punta:** Desde descubrir una prenda/producto en segundos hasta publicar stock o cobrar desde el teléfono sin pasos innecesarios.
2. **Elasticidad white-label real:** Ninguna mejora de UX puede depender de un único color de marca, logo o rubro rígido; debe lucir consistente bajo cualquier tema dinámico del comercio.
3. **Claridad financiera y postventa:** Descuentos, cuotas, costos de envío, estados del pedido y mecanismos de cancelación/reembolso visibles sin ambigüedades antes y después de pagar.
4. **Simplicidad modular y honesta:** Sin datos falsos, sin abstracciones prematuras y con estados vacíos o de error útiles y accionables.

## Accessibility & Inclusion

- Cumplimiento de **WCAG 2.1 AA** (y AAA en jerarquías de lectura críticas), respaldado por pruebas automatizadas (`tests/backoffice-a11y.test.ts`, `tests/navigation-a11y.test.ts`).
- Navegación por teclado con `:focus-visible` nítido, anuncios accesibles (`aria-live="polite"`, `aria-busy`), respeto estricto a `prefers-reduced-motion`, objetivos táctiles cómodos para mobile y tamaño de fuente mínimo de `16px` en campos móviles para evitar zoom automático en iOS Safari.
