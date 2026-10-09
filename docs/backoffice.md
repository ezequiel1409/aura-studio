# Backoffice · Especificación funcional

Panel privado de la administradora. Diseño **mobile-first**: todo debe poder hacerse con una mano desde el celular.

## Mapa de pantallas

| Pantalla | Para qué sirve | Reglas |
|---|---|---|
| **Login seguro** | Acceso privado con contraseña, bloqueo tras 5 intentos fallidos por 60s persistido en DB y sesión por inactividad. | BR-10, BR-11, BR-37 |
| **Resumen** | Contadores y alertas: disponibles, reservadas, agotadas, por vencer, sin clasificar, sin precio. Cada contador lleva a la lista ya filtrada. | BR-36 |
| **Prendas** | Lista con foto, código, precio, estado, categoría y métricas (visitas y clics WhatsApp). Búsqueda por código, filtros por estado/categoría, selección múltiple. | BR-27, 29, 31, 39 |
| **Cargar prenda** | Subir fotos + pegar texto → vista previa con datos propuestos (título, precio, categoría, colores y talles con stock) → confirmar o ajustar. | BR-05, 20, 26 |
| **Ficha de prenda** | Editar texto, precio, colores, talles, stock por talle (+/-), categoría, fotos (asignables a color); cambiar estado; ver historial y métricas; eliminar. | BR-27, 28, 33, 34, 39 |
| **Categorías** | Árbol de categorías y subcategorías: crear, renombrar, reordenar, mover, ocultar, eliminar, y ver visitas por sección. | BR-15 a 19, 38, 39 |
| **Barrido** | Vista previa de lo que se purgaría, ejecutar, historial de corridas. | BR-04, 32 |
| **Configuración** | WhatsApp, nombre del showroom, horas de reserva. | BR-35 |

## Flujos clave

### Acceso seguro al panel (BR-10, BR-11, BR-37)
1. Ingresar a `/admin` (redirige automáticamente a `/admin/login` si no hay sesión activa).
2. Ingresar la contraseña de administradora.
3. Tras 5 intentos fallidos consecutivos, el sistema bloquea el acceso durante 60 segundos registrando el bloqueo en base de datos.
4. Con credenciales válidas, se emite una cookie segura `httpOnly` con token de sesión que expira por inactividad.

### Cargar una prenda (objetivo: menos de 30 segundos)
1. Tocar **+ Cargar**.
2. Elegir fotos (se comprimen en el navegador a WebP sin EXIF) y pegar el texto.
3. Ver la **vista previa**: título, precio, categoría propuestos y matriz rápida de **Colores y Talles** (ej: Color Negro → S: 2, M: 1). Si no se detectan variantes, se asigna Color: "Único", Talle: "ÚNICO", Stock: 1 con opción de editarlo con un toque.
4. Tocar **Publicar**. Si falta algo, igual publica.
5. Mensaje: "Prenda #024 publicada · Ver · Cargar otra".

### Marcar una prenda o cambiar estado con deshacer (BR-27, BR-28)
- Desde la lista o ficha: botón rápido de estado → **Disponible**, **Reservada** o **Agotada**.
- Aparece un aviso flotante interactivo con botón **"Deshacer"** durante unos segundos.
- Si se pulsa "Deshacer", se revierte de inmediato al estado anterior y se audita el evento.
- La prenda en estado `Agotada` muestra la cuenta regresiva "se elimina en N días" (BR-31).
- Toda transición queda registrada en el historial accesible desde la prenda (BR-28).

### Gestionar categorías
- Vista de árbol con arrastrar y soltar para reordenar.
- Cada categoría muestra cuántas prendas tiene y cuántas visitas acumuló su sección.
- Al intentar eliminar una con prendas: "Tiene 8 prendas. ¿Moverlas a otra categoría?" → elegir destino → eliminar.
- Mover una categoría a otra solo si no rompe BR-15/BR-18 (el sistema guía y explica).

## Principios de diseño
- Una acción principal por pantalla, botones grandes y zonas táctiles cómodas.
- Acciones destructivas siempre con confirmación (BR-37); las reversibles, con "Deshacer".
- Nunca mostrar errores técnicos: mensajes en español claro.
- Estados con color y texto (no solo color), por accesibilidad.
- El backoffice no se indexa en buscadores (`noindex`) y vive bajo `/admin`.

## Fuera de alcance por ahora
- Múltiples usuarios/roles (se diseña con un solo rol `admin`, dejando la puerta abierta).
- Estadísticas complejas de facturación/contabilidad (las métricas de interés por prenda/categoría sí se incluyen vía BR-39).
- Gestión de pedidos y pagos (llega con Fase de pagos).
