import { performance } from "node:perf_hooks";
import { getProductServiceDeps } from "../src/infra/db/connection";
import { loadCatalogPanelData } from "../src/lib/catalog/load-catalog-panel";
import { getShowroomSettings } from "../src/services/settings.service";
import { NavigationService } from "../src/services/navigation.service";
import { PromotionService } from "../src/services/promotion.service";
import { listProducts } from "../src/services/product.service";

interface MetricSummary {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  throughputRps: number;
}

function calculateMetrics(name: string, times: number[]): MetricSummary {
  times.sort((a, b) => a - b);
  const total = times.reduce((acc, t) => acc + t, 0);
  const avg = total / times.length;
  const min = times[0];
  const max = times[times.length - 1];
  const p95 = times[Math.floor(times.length * 0.95)];
  const throughput = (times.length / total) * 1000;

  return {
    name,
    iterations: times.length,
    totalMs: Number(total.toFixed(2)),
    avgMs: Number(avg.toFixed(2)),
    minMs: Number(min.toFixed(2)),
    maxMs: Number(max.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    throughputRps: Number(throughput.toFixed(2)),
  };
}

async function runHomeDataSimulation() {
  const deps = getProductServiceDeps();
  const navService = new NavigationService({
    navigationRepo: deps.navigationRepo,
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
  });
  const promotionService = new PromotionService(deps.promotionRepo);
  const thirtyDaysAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  return await Promise.all([
    getShowroomSettings(deps),
    deps.categoryRepo.listAll(),
    navService.listPublicNavigationSections(),
    promotionService.listActiveHomeBanners(),
    promotionService.listActivePublicPromotions(),
    listProducts(
      {
        publishedAfter: thirtyDaysAgoMs,
        onlyAvailable: true,
        sortBy: "newest",
        pageSize: 8,
      },
      deps
    ),
    listProducts(
      {
        isFeatured: true,
        onlyAvailable: true,
        sortBy: "featured",
        pageSize: 8,
      },
      deps
    ),
    listProducts(
      {
        onlyOnSale: true,
        onlyAvailable: true,
        sortBy: "featured",
        pageSize: 4,
      },
      deps
    ),
  ]);
}

async function benchmark() {
  console.log("=================================================");
  console.log("🚀 INICIANDO BENCHMARK DE RENDIMIENTO (AURA STUDIO)");
  console.log("=================================================\n");

  const memoryBefore = process.memoryUsage();

  // 1. Warm-up
  console.log("⏳ Calentando motor y cargando cachés en memoria...");
  await loadCatalogPanelData({ rawSearchParams: {}, section: null });
  await runHomeDataSimulation();
  console.log("✅ Warm-up completado.\n");

  // 2. Benchmark Catalog Loading (Sequential - 50 iterations)
  console.log("📊 1. Evaluando Carga de Catálogo (Secuencial - 50 llamadas)...");
  const catalogTimes: number[] = [];
  for (let i = 0; i < 50; i++) {
    const start = performance.now();
    await loadCatalogPanelData({
      rawSearchParams: {
        categoria: i % 2 === 0 ? "remeras" : undefined,
        orden: i % 3 === 0 ? "precio-asc" : "newest",
        pagina: "1",
      },
      section: null,
    });
    const end = performance.now();
    catalogTimes.push(end - start);
  }
  const catalogSummary = calculateMetrics("Carga Panel Catálogo (loadCatalogPanelData)", catalogTimes);

  // 3. Benchmark Catalog Loading (Concurrency - 30 llamadas en paralelo)
  console.log("📊 2. Evaluando Carga de Catálogo en Concurrencia (30 peticiones paralelas)...");
  const concurrentStart = performance.now();
  const concurrentPromises = Array.from({ length: 30 }, (_, i) => {
    const tStart = performance.now();
    return loadCatalogPanelData({
      rawSearchParams: { q: i % 2 === 0 ? "lino" : undefined },
      section: null,
    }).then(() => performance.now() - tStart);
  });
  const concurrentTimes = await Promise.all(concurrentPromises);
  const concurrentTotal = performance.now() - concurrentStart;
  const concurrentSummary = calculateMetrics("Catálogo Concurrente (30 paralelos)", concurrentTimes);

  // 4. Benchmark Home Page Payload (Sequential - 50 iterations)
  console.log("📊 3. Evaluando Carga Completa de Home Page (50 llamadas)...");
  const homeTimes: number[] = [];
  for (let i = 0; i < 50; i++) {
    const start = performance.now();
    await runHomeDataSimulation();
    const end = performance.now();
    homeTimes.push(end - start);
  }
  const homeSummary = calculateMetrics("Carga Home Vidriera (runHomeDataSimulation)", homeTimes);

  // 5. Benchmark Raw DB Read Operations
  console.log("📊 4. Evaluando Lecturas de Base de Datos Pura (100 iteraciones)...");
  const deps = getProductServiceDeps();
  const dbReadTimes: number[] = [];
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    await Promise.all([
      deps.settingsRepo ? (deps.settingsRepo as any).getAll() : Promise.resolve({}),
      deps.categoryRepo.listAll(),
      deps.navigationRepo.listSections({ visibleOnly: true }),
    ]);
    const end = performance.now();
    dbReadTimes.push(end - start);
  }
  const dbReadSummary = calculateMetrics("Lecturas DB (Settings + Categorías + Nav)", dbReadTimes);

  const memoryAfter = process.memoryUsage();

  console.log("\n=================================================");
  console.log("📈 RESULTADOS DEL BENCHMARK");
  console.log("=================================================");
  console.table([
    catalogSummary,
    concurrentSummary,
    homeSummary,
    dbReadSummary,
  ]);

  console.log("\n💾 CONSUMO DE MEMORIA:");
  console.log(`Heap Usado Previo:  ${(memoryBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Heap Usado Final:   ${(memoryAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`RSS Total:          ${(memoryAfter.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Tiempo total concurrencia (30 reqs): ${concurrentTotal.toFixed(2)} ms`);
}

benchmark().catch(console.error);

