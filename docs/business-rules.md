# Reglas de Negocio (Business Rules)

Las dejamos escritas como reglas numeradas, para poder referenciarlas en commits y tests.

- **BR-01**: Cada prenda tiene un código correlativo único, generado por la DB y nunca reutilizado, ni siquiera después de una purga.
- **BR-02**: Estados: `AVAILABLE`, `RESERVED`, `SOLD_OUT`. Transiciones permitidas: `AVAILABLE` ↔ `RESERVED`, `AVAILABLE`/`RESERVED` → `SOLD_OUT`, `SOLD_OUT` → `AVAILABLE` (reactivación).
- **BR-03**: Al pasar a `SOLD_OUT` se guarda `sold_out_at`. Al reactivar, se limpia.
- **BR-04**: Purga: prendas con `SOLD_OUT` hace más de 30 días se eliminan junto con sus fotos. Es idempotente, registra un log y tiene modo dry-run.
- **BR-05**: El texto de carga es libre. Se guarda siempre el texto crudo original; el parseo (título, precio, talle) es un enriquecimiento opcional y nunca bloquea la publicación.
- **BR-06**: Todo texto se trata como texto plano, UTF-8 completo. Nunca se renderiza como HTML.
- **BR-07**: Las fotos se procesan al subir: WebP, versión thumb y full, sin EXIF, con límite de tamaño.
- **BR-08**: Solo el admin autenticado muta datos. El catálogo público es solo lectura.
- **BR-09**: Cada prenda tiene URL compartible estable (`/p/001`).
