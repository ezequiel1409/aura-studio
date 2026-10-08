# Reglas de Arquitectura

## Estructura de Directorios

```text
src/
  app/              → rutas y UI (solo presentación)
  components/       → componentes reutilizables
  domain/           → entidades, estados, reglas puras (sin dependencias de framework)
  services/         → casos de uso: createGarment, markSoldOut, purgeExpired
  infra/
    db/             → schema Drizzle, repositorios
    storage/        → adaptador R2 (interfaz StoragePort)
    payments/       → adaptadores ( mercadopago después)
    auth/
  lib/              → utilidades (parser de texto, sanitización, formato ARS)
```

## Reglas de Arquitectura

- **AR-01**: `domain` no importa nada de `infra` ni de Next. Es lógica pura y testeable.
- **AR-02**: Toda entrada (panel web, Telegram, cron) pasa por los mismos services. Nunca hay lógica de negocio en un route handler.
- **AR-03**: Acceso a DB y storage solo mediante interfaces (puertos), para poder cambiar el proveedor.
- **AR-04**: Variables de entorno validadas con Zod al arrancar. Sin secretos en el repo.
- **AR-05**: Todo cambio de schema va con migración versionada.
- **AR-06**: Toda regla `BR-xx` crítica tiene al menos un test.
- **AR-07**: Telemetría y analítica desacopladas de la lectura. El registro de métricas públicas (vistas de ficha, vistas de categoría, clics en WhatsApp) nunca bloquea el renderizado ni la entrega de páginas cacheadas. Se procesa de forma asíncrona mediante un endpoint ligero (`/api/analytics/track` o `navigator.sendBeacon`) con debouncing para no saturar escrituras en D1.
- **AR-08**: Agregado de Producto: `Product` es la raíz del agregado (Aggregate Root) y encapsula sus colores (`ProductColor`) y los talles con stock de cada color (`ProductColorSize`). El estado general del producto y su ciclo de vida (`AVAILABLE`, `SOLD_OUT`) se calculan a partir de la disponibilidad agregada de su stock.

