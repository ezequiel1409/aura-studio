# Reglas de negocio

Fuente de verdad del dominio. Cada regla tiene un ID estable para referenciarla en commits, PRs y tests.
Ejemplo de commit: `feat(garments): código correlativo atómico (BR-01)`.
Los IDs **no se renumeran**: si una regla deja de aplicar se marca como *derogada*, no se reutiliza su número.

---

## 1. Prendas y ciclo de vida

- **BR-01 · Código correlativo.** Cada prenda recibe un código único y correlativo (`#001`, `#002`...). Lo genera la base de datos de forma atómica (no `MAX()+1`). **Nunca se reutiliza**, ni siquiera tras una purga o eliminación manual.
- **BR-02 · Estados y stock.** `AVAILABLE`, `RESERVED`, `SOLD_OUT`.
  - Un producto está `AVAILABLE` mientras la suma total de `stock` de todas sus combinaciones de color y talle sea mayor a 0.
  - Pasa a `SOLD_OUT` automáticamente cuando el stock total llega a 0, o por decisión manual de la administradora.
  - Transiciones permitidas:
    - `AVAILABLE ↔ RESERVED`
    - `AVAILABLE | RESERVED → SOLD_OUT`
    - `SOLD_OUT → AVAILABLE` (reactivación / ingreso de nuevo stock)
- **BR-03 · Fecha de agotado.** Al pasar a `SOLD_OUT` (por agotamiento de stock de todas sus variantes o manual) se guarda `sold_out_at = ahora`. Al ingresar nuevo stock o reactivar, se limpia (`NULL`) y la cuenta de los 30 días se reinicia si vuelve a agotarse.
- **BR-04 · Purga a los 30 días.** Las prendas en `SOLD_OUT` hace más de 30 días se eliminan junto con sus fotos. El proceso es idempotente, deja registro (log) y tiene modo *dry-run*. Si falla el borrado de una foto, se registra y se reintenta en la siguiente corrida, sin dejar la prenda a medias.
- **BR-05 · Carga en bloque único.** La admin sube fotos + un texto libre. Siempre se guarda el **texto crudo original**. El parseo (título, colores, talles con stock sugerido, precio) es un enriquecimiento y **nunca bloquea la publicación**; si no se especifica color o talle, se asigna por defecto Color: "Único", Talle: "ÚNICO", Stock: 1.
- **BR-06 · Texto seguro.** Todo texto se trata como texto plano con UTF-8 completo (emojis incluidos). Nunca se renderiza como HTML.
- **BR-07 · Fotos.** Se comprimen y redimensionan en el navegador antes de subir (WebP, versión miniatura y completa, sin EXIF/geolocalización, con tope de tamaño). Pueden asociarse al producto general o a un color específico. El Worker no procesa imágenes.
- **BR-08 · Solo la admin escribe y jerarquía de roles.** Únicamente administradoras activas autenticadas (o el canal Telegram autorizado) pueden crear, editar o eliminar. El catálogo público es de solo lectura. Existen roles `SUPER_ADMIN` y `ADMIN`: solo el `SUPER_ADMIN` puede crear, listar, dar de baja (`SUSPENDED`) o reactivar administradores delegados. Un administrador suspendido tiene el acceso revocado de inmediato.
- **BR-09 · URL estable.** Cada prenda tiene una URL compartible y estable (`/p/001`). Si fue purgada o eliminada, se muestra una página amable de "pieza ya no disponible" con sugerencias, no un 404 seco.

## 2. Seguridad

- **BR-10 · Login y contraseñas seguras.** La verificación de contraseña es siempre en el servidor. Las contraseñas se protegen con hashing salado PBKDF2-HMAC-SHA512 (100.000 iteraciones, salt de 16 bytes). Ningún hash ni salt llega al cliente. Se provee recuperación de contraseña vía correo electrónico (adaptador Resend) mediante tokens de un solo uso con expiración de 1 hora.
- **BR-11 · Fuerza bruta.** Tras 5 intentos fallidos consecutivos, bloqueo de 60 segundos. El contador se persiste en base de datos / KV (no en memoria ni en el navegador).
- **BR-12 · Telegram.** Solo se procesan mensajes del `ADMIN_CHAT_ID` autorizado y con `secret_token` válido en el webhook.
- **BR-37 · Sesión y acciones destructivas.** La sesión expira por inactividad. Eliminar prendas, eliminar categorías, dar de baja administradores y ejecutar el barrido piden confirmación explícita.

## 3. Compras

- **BR-13 · Fase 1 de pagos.** El botón "Consultar / Reservar" abre WhatsApp con un mensaje pre-armado y codificado con el código y título de la prenda, incluyendo además el **color y talle seleccionados** por el usuario en la ficha.
- **BR-14 · Pagos desacoplados.** El botón interactúa con una interfaz `PaymentAdapter` (`whatsapp` hoy; `mercadopago` después), sin tocar catálogo ni base de datos.

## 4. Categorías (administrables)

- **BR-15 · Dos niveles.** Jerarquía **Categoría → Subcategoría**, sin más profundidad. Cada prenda pertenece a exactamente un nodo "hoja": una subcategoría, o una categoría que no tiene subcategorías.
- **BR-16 · Filtrar por padre incluye hijas.** Elegir una categoría muestra las prendas de todas sus subcategorías.
- **BR-17 · Gestión por la admin.** La admin puede crear, renombrar, reordenar, mover una subcategoría a otro padre y ocultar categorías. El orden manual define el orden del menú público.
- **BR-18 · Eliminación protegida.** No se puede eliminar una categoría que tenga prendas o subcategorías. El sistema ofrece "mover las prendas a..." y luego permite eliminar. Una categoría con prendas directas no puede recibir subcategorías hasta reasignar esas prendas.
- **BR-19 · "Sin clasificar".** Existe una categoría de sistema "Sin clasificar" que no se puede borrar ni renombrar. Recibe las prendas publicadas sin categoría.
- **BR-38 · Visibilidad.** El menú público solo muestra categorías con al menos una prenda visible. Una categoría oculta no aparece en menú ni filtros, pero sus prendas siguen apareciendo en "Todo". El slug se genera al crear y **no cambia al renombrar** (links estables).

## 5. Catálogo público

- **BR-20 · Datos estructurados y variantes.** El precio se guarda como entero (centavos) con moneda. Un producto posee 1 o varios colores (`product_colors`), y cada color posee 1 o varios talles con stock asignado (`product_color_sizes`). Los talles se guardan normalizados.
- **BR-21 · Orden.** Opciones: *Recién llegados* (por defecto), *Precio: menor a mayor*, *Precio: mayor a menor*. En todo listado las disponibles van antes que las agotadas; el orden elegido se aplica dentro de cada grupo.
- **BR-22 · Estado en la URL.** Filtros, orden y página viven en la URL (links compartibles, botón "atrás" funcional).
- **BR-23 · Sin precio.** Una prenda sin precio muestra "Consultar precio" y va al final en los órdenes por precio.
- **BR-24 · Búsqueda por código.** Escribir `#023` (o `023`) lleva directo a esa prenda.

## 6. Backoffice (panel de la administradora)

- **BR-25 · Privado y mobile-first.** El backoffice solo es accesible autenticada y está pensado para usarse desde el celular.
- **BR-26 · Alta con confirmación.** Al cargar, el parser propone título, precio, categoría, colores y talles con stock sugerido; la admin ve una vista previa táctil y confirma o corrige con botones rápidos `+` / `-`. Puede publicar igual con datos incompletos (BR-05): la prenda queda en "Sin clasificar" y/o "Consultar precio".
- **BR-27 · Estado en un toque.** Desde la lista y desde la ficha, la admin cambia el estado: *Disponible*, *Reservada*, *Agotada*, y reactiva las agotadas o ajusta el stock.
- **BR-28 · Deshacer e historial.** Todo cambio de estado se puede deshacer durante unos segundos y queda en un historial (de, a, cuándo, origen: web / telegram / sistema).
- **BR-29 · Acciones en lote.** Selección múltiple para: marcar estado, mover de categoría, eliminar (con confirmación).
- **BR-30 · Reservas con vencimiento.** Una reserva vence automáticamente tras `reservation_hours` (configurable) y la prenda vuelve a `AVAILABLE`, registrado con origen "sistema".
- **BR-31 · Cuenta regresiva de purga.** Las prendas agotadas muestran "se elimina en N días". Hay una vista "por vencer" (7 días o menos). Reactivar o reponer stock reinicia el ciclo (BR-03).
- **BR-32 · Barrido manual.** Botón con vista previa (*dry-run*) de lo que se borraría y confirmación. Cada corrida, manual o automática, queda registrada.
- **BR-33 · Edición sin pérdida.** La admin puede editar texto, categoría, precio, colores, talles, stock y fotos (orden, borrar, agregar, asignar a color). Al editar el texto crudo se vuelve a interpretar, pero **no se pisan los datos que ella corrigió a mano**.
- **BR-34 · Eliminación manual.** Elimina la prenda y sus fotos de inmediato, con confirmación. El código no se reutiliza (BR-01).
- **BR-35 · Configuración sin deploy.** Número de WhatsApp, nombre del showroom y horas de reserva se editan desde el panel y se guardan en base de datos. Las variables de entorno solo son el valor inicial por defecto.
- **BR-36 · Resumen.** La pantalla de inicio muestra contadores: disponibles, reservadas, agotadas, por vencer, sin clasificar y sin precio.

## 7. Métricas y analítica

- **BR-39 · Métricas de interés y conversión.**
  - **Alcance**: El sistema registra:
    1. *Visitas a secciones/categorías* (`category_stats.views_count`): cada vez que un usuario explora o filtra una categoría.
    2. *Visitas a prendas* (`garment_stats.views_count`): cada vez que un usuario entra a ver la ficha (`/p/001`).
    3. *Intención de compra* (`garment_stats.whatsapp_clicks`): cada vez que un usuario pulsa "Consultar / Reservar por WhatsApp".
  - **Anti-duplicación (debounce)**: Visitas repetidas al mismo recurso desde una misma sesión de navegación en una ventana de 30 minutos no vuelven a incrementar el contador.
  - **Exclusión de admin**: La actividad de la administradora autenticada nunca suma a los contadores de visitas ni clics.
  - **Privacidad**: Las estadísticas son internas y privadas. Solo se visualizan en el Backoffice; no se exponen en el catálogo público ni en APIs abiertas.

---

## Decisiones pendientes

- [ ] ¿Cuántas horas dura una reserva antes de vencer? (propuesta: 48 h)
- [ ] Árbol real de categorías y subcategorías iniciales (para el seed).
- [ ] Sistema de talles: letras (S/M/L), numérico (38/40) o mixto. Cómo se normaliza "Talle único".
- [ ] Convención del texto libre para el parser (necesitamos 3 o 4 ejemplos reales).
- [ ] Moneda y formato de precios (propuesta: ARS, locale `es-AR`).
