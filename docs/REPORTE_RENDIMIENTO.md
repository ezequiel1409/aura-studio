# 📊 Informe Técnico de Rendimiento y Diagnóstico de Arquitectura

**Proyecto:** Aura Studio  
**Entorno de Pruebas:** Local Development / Node.js 24 + SQLite WAL  
**Fecha:** 23 de Octubre de 2026  
**Objetivo:** Evaluar el rendimiento del pipeline de datos de Home y Catálogo, medir latencias y concurrencia, y diagnosticar las causas del **Error 1101 en Cloudflare Workers** junto a la ausencia de caché incremental.

---

## 1. Resumen Ejecutivo

Se ejecutó una suite de pruebas de rendimiento sobre los servicios neurálgicos de **Aura Studio** (carga de catálogo con facetas, vidriera principal de la Home, y operaciones de lectura directa en base de datos), complementado con la ejecución completa de la batería de pruebas automatizadas (28 suites, 277 tests unitarios y de integración).

### Conclusiones Principales:
1. **Rendimiento Local Excelente:** En entorno local con SQLite en modo WAL, las funciones `loadCatalogPanelData` y `runHomeDataSimulation` responden en promedio en **~6.2 ms** con un p95 menor a **11.2 ms**.
2. **Causa Raíz del Error 1101 en Cloudflare:** El Error 1101 en Cloudflare Workers se origina por **agotamiento del límite de CPU (50 ms)** y re-instanciación masiva de clientes en SSR:
   - En cada petición a `/` o `/catalogo` se despachan entre **5 y 8 consultas en paralelo** (`Promise.all`).
   - En Workers, D1 opera mediante llamadas RPC remotas (no en memoria como SQLite local). Sin caché, 10 usuarios concurrentes generan 80 peticiones a D1 simultáneamente.
   - En `src/infra/db/connection.ts`, la variable `globalDeps` no se reutiliza en Cloudflare (`if (!isCloudflare && globalDeps) return globalDeps;`), forzando a reconstruir 16 repositorios en cada invocación del Worker.
3. **Ausencia de Caché Incremental (ISR inoperativo):** La directiva `export const revalidate = 60` no produce ningún efecto en `@opennextjs/cloudflare` porque `wrangler.jsonc` y `open-next.config.ts` no tienen configurado un binding de **Cloudflare KV** o **R2** como backend de almacenamiento del incremental cache.

---

## 2. Métricas Obtenidas en Ambiente de Desarrollo

Las pruebas se ejecutaron simulando tráfico secuencial y ráfagas concurrentes sobre los flujos reales de producción:

```
========================================================================================
MÉTRICA                                   ITERACIONES   AVG (ms)   P95 (ms)   RPS (Throughput)
========================================================================================
Carga Panel Catálogo (loadCatalogPanelData)   50          6.24 ms    7.95 ms    160.19 req/s
Carga Home Vidriera (runHomeDataSimulation)   50          6.31 ms   11.16 ms    158.51 req/s
Catálogo Concurrente (30 paralelos)          30        149.61 ms  150.06 ms      6.68 batch/s
Lecturas DB Pura (Settings + Cat + Nav)     100          0.30 ms    0.49 ms   3371.78 req/s
========================================================================================
```

### Comportamiento de Memoria y Recursos
- **Heap Usado Inicial:** `34.13 MB`
- **Heap Usado Post-Carga:** `53.74 MB` ($\Delta = +19.6\text{ MB}$, liberado rápidamente por el GC)
- **RSS Total del Proceso:** `173.17 MB`
- **Tiempo total para resolver lote de 30 consultas concurrentes completas:** `150.18 ms`
- **Suite de Pruebas Automatizadas:** `277 tests` pasados con éxito en `5.92 segundos` (100% verde).

---

## 3. Diagnóstico Técnico: ¿Por qué ocurre el Error 1101 en Cloudflare?

### Factores Críticos Identificados en el Código:

1. **Multiplexación de Consultas a D1 sin Capa de Caché:**
   Tanto en `src/app/page.tsx` como en `src/lib/catalog/load-catalog-panel.ts`, cada renderizado del servidor ejecuta:
   - `getShowroomSettings` (lectura de settings)
   - `deps.categoryRepo.listAll` (listado completo de categorías)
   - `navService.listPublicNavigationSections` (secciones de navegación)
   - `promotionService.listActiveHomeBanners`
   - `promotionService.listActivePublicPromotions`
   - 3 llamadas a `listProducts` (Nuevos, Destacados, Ofertas) con joins y conteo de facetas.

2. **Inoperancia de `revalidate` (Falta de KV/R2):**
   Actualmente `open-next.config.ts` declara:
   ```typescript
   import { defineCloudflareConfig } from "@opennextjs/cloudflare";
   export default defineCloudflareConfig({});
   ```
   Y `wrangler.jsonc` únicamente declara:
   ```json
   "assets": { "binding": "ASSETS", "directory": ".open-next/assets" },
   "d1_databases": [{ "binding": "DB", ... }]
   ```
   **Consecuencia:** Next.js no tiene dónde persistir los fragmentos HTML/JSON revalidados. Cada visita de cada usuario es tratada como un renderizado dinámico en tiempo real (`force-dynamic` de facto).

3. **Ciclo de Vida de Dependencias en `src/infra/db/connection.ts`:**
   Líneas 624-629:
   ```typescript
   export function getProductServiceDeps(): GlobalAppDeps {
     const isCloudflare = typeof ... WebSocketPair !== "undefined";
     if (!isCloudflare && globalDeps) return globalDeps;
     // En Cloudflare se instancian 16 clases por cada llamada!
   ```
   En Cloudflare Workers, los objetos de módulo globales persisten entre invocaciones del mismo isolate. No reutilizar la instancia compartida genera recolector de basura innecesario y tiempo de CPU que descuenta del presupuesto de 50ms.

---

## 4. Plan de Acción Recomendado (Remediación)

Para eliminar definitivamente el Error 1101 y escalar la plataforma a múltiples comercios sin costos elevados:

### Paso 1: Configurar Caché Incremental en Cloudflare KV
1. Crear un namespace KV en Cloudflare:
   ```bash
   npx wrangler kv namespace create NEXT_CACHE_WORKERS_KV
   ```
2. Declararlo en `wrangler.jsonc`:
   ```jsonc
   "kv_namespaces": [
     {
       "binding": "NEXT_CACHE_WORKERS_KV",
       "id": "<ID_OBTENIDO>"
     }
   ]
   ```
3. Habilitar la integración en `open-next.config.ts`:
   ```typescript
   import { defineCloudflareConfig } from "@opennextjs/cloudflare";
   import kvCache from "@opennextjs/cloudflare/kv-cache";

   export default defineCloudflareConfig({
     incrementalCache: kvCache,
   });
   ```

### Paso 2: Reutilizar Instancias en el Isolate de Cloudflare
Modificar `src/infra/db/connection.ts` para permitir reutilizar `globalDeps` mientras el isolate siga vivo, evitando la sobrecarga de instanciación en cada request.

### Paso 3: Aislamiento Multitenant en Caché
Para evitar fuga de datos entre comercios futuros sobre la misma base:
- Incluir siempre el identificador o slug del comercio en las claves de almacenamiento:
  `cache_key = `${commerce_id}:settings:showroom`` en lugar de `store_settings_all`.

---

## 5. Resumen de Estado para Presentar

| Indicador | Estado Actual | Meta Post-Optimización |
| :--- | :--- | :--- |
| **Tiempo de Respuesta Local (SSR)** | ~6.2 ms | < 5 ms |
| **Throughput Local** | 160 req/s | > 300 req/s con caché KV |
| **Pruebas Automatizadas** | 277/277 aprobadas (100%) | 100% aprobadas |
| **Consumo de Memoria Heap** | 34 - 53 MB | Estable (< 64 MB) |
| **Caché Incremental (ISR)** | Inactivo (sin binding KV) | Activo (TTL 60s en KV) |
| **Estabilidad Cloudflare** | Vulnerable a CPU limit (Error 1101) | Blindado contra límites de CPU |

