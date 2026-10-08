# Backoffice · Especificación funcional

Panel privado de la administradora. Diseño **mobile-first**: todo debe poder hacerse con una mano desde el celular.

## Mapa de pantallas

| Pantalla | Para qué sirve | Reglas |
|---|---|---|
| **Resumen** | Contadores y alertas: disponibles, reservadas, agotadas, por vencer, sin clasificar, sin precio. Cada contador lleva a la lista ya filtrada. | BR-36 |
| **Prendas** | Lista con foto, código, precio, estado, categoría y métricas (visitas y clics WhatsApp). Búsqueda por código, filtros por estado/categoría, selección múltiple. | BR-27, 29, 31, 39 |
| **Cargar prenda** | Subir fotos + pegar texto → vista previa con datos propuestos → confirmar. | BR-05, 26 |
| **Ficha de prenda** | Editar texto, precio, talle, categoría, fotos; cambiar estado; ver historial y métricas de conversión (visitas vs consultas); eliminar. | BR-27, 28, 33, 34, 39 |
| **Categorías** | Árbol de categorías y subcategorías: crear, renombrar, reordenar, mover, ocultar, eliminar, y ver visitas por sección. | BR-15 a 19, 38, 39 |
| **Barrido** | Vista previa de lo que se purgaría, ejecutar, historial de corridas. | BR-04, 32 |
| **Configuración** | WhatsApp, nombre del showroom, horas de reserva. | BR-35 |

## Flujos clave

### Cargar una prenda (objetivo: menos de 30 segundos)
1. Tocar **+ Cargar**.
2. Elegir fotos (se comprimen en el navegador) y pegar el texto.
3. Ver la **vista previa**: título, precio, talle y categoría propuestos. Los campos no detectados quedan vacíos y marcados.
4. Tocar **Publicar**. Si falta algo, igual publica.
5. Mensaje: "Prenda #024 publicada · Ver · Cargar otra".

### Marcar una prenda como agotada
- Desde la lista: deslizar la fila (o botón de estado) → **Agotada**.
- Aparece un aviso **"Deshacer"** durante unos segundos.
- La prenda queda con la cuenta regresiva "se elimina en 30 días".

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
