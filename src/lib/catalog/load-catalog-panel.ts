import { getProductServiceDeps } from "../../infra/db/connection";
import { NavigationService } from "../../services/navigation.service";
import { ProductService } from "../../services/product.service";
import { PromotionService } from "../../services/promotion.service";
import { SettingsService } from "../../services/settings.service";
import {
  ListProductsFilter,
  ProductSortOption,
} from "../../domain/product/types";
import { NavigationSection } from "../../domain/navigation/types";
import { ActiveCatalogFilters } from "../../components/catalog/CatalogPanelView";

export type RawCatalogSearchParams = Record<
  string,
  string | string[] | undefined
>;

function pickFirstString(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val;
}

export async function loadCatalogPanelData(options: {
  rawSearchParams: RawCatalogSearchParams;
  section?: NavigationSection | null;
}) {
  const { rawSearchParams, section } = options;
  const deps = getProductServiceDeps();

  const productService = new ProductService({
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
    statusHistoryRepo: deps.statusHistoryRepo,
    counterRepo: deps.counterRepo,
  });
  const navService = new NavigationService({
    navigationRepo: deps.navigationRepo,
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
    statusHistoryRepo: deps.statusHistoryRepo,
    counterRepo: deps.counterRepo,
  });
  const settingsService = new SettingsService(deps.settingsRepo);
  const promotionService = new PromotionService(deps.promotionRepo);

  const [
    settings,
    categories,
    publicSections,
    attributeDefinitions,
    activePromotions,
  ] = await Promise.all([
    settingsService.getSettings(),
    deps.categoryRepo.listAll(),
    navService.listPublicNavigationSections(),
    navService.listAttributeDefinitions(),
    promotionService.listActivePublicPromotions(),
  ]);

  const pageSize = settings.catalogConfig?.pageSize || 12;
  const enabledFilters = settings.catalogConfig?.enabledFilters || [
    "categories",
    "size",
    "color",
    "price",
    "availability",
    "sale",
    "para",
    "material",
  ];

  // Parsear parámetros de URL (?talle=m&orden=precio-asc&pagina=2)
  const q = pickFirstString(rawSearchParams.q)?.trim() || undefined;
  const categoria =
    pickFirstString(rawSearchParams.categoria)?.trim() ||
    pickFirstString(rawSearchParams.cat)?.trim() ||
    undefined;

  const talleRaw = pickFirstString(rawSearchParams.talle);
  const talles = talleRaw
    ? talleRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const colorRaw = pickFirstString(rawSearchParams.color);
  const colores = colorRaw
    ? colorRaw
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  const minPrecio = pickFirstString(rawSearchParams.min)?.trim() || undefined;
  const maxPrecio = pickFirstString(rawSearchParams.max)?.trim() || undefined;
  const disponible = pickFirstString(rawSearchParams.disponible) === "1";
  const oferta =
    pickFirstString(rawSearchParams.oferta) === "1" ||
    section?.ruleType === "SALE" ||
    section?.ruleType === "DISCOUNT";

  const atributos: Record<string, string[]> = {};
  for (const def of attributeDefinitions) {
    const rawAttr =
      pickFirstString(rawSearchParams[`attr_${def.key}`]) ||
      pickFirstString(rawSearchParams[def.key]);
    if (rawAttr) {
      const vals = rawAttr
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      if (vals.length > 0) {
        atributos[def.key] = vals;
      }
    }
  }

  // Orden por defecto: Relevancia si hay búsqueda de texto, Recién llegados en esa sección, Destacados en el resto
  const defaultSort: ProductSortOption = q
    ? "relevance"
    : section?.ruleType === "RECENCY" || section?.ruleType === "RECENT"
    ? "newest"
    : "featured";

  const rawOrden = pickFirstString(rawSearchParams.orden);
  const ordenMap: Record<string, ProductSortOption> = {
    featured: "featured",
    destacados: "featured",
    newest: "newest",
    "recien-llegados": "newest",
    price_asc: "price_asc",
    "precio-asc": "price_asc",
    price_desc: "price_desc",
    "precio-desc": "price_desc",
    relevance: "relevance",
    relevancia: "relevance",
  };
  const orden: ProductSortOption =
    (rawOrden && ordenMap[rawOrden]) || defaultSort;

  const rawPagina = Number(pickFirstString(rawSearchParams.pagina) || "1");
  const currentPage =
    Number.isFinite(rawPagina) && rawPagina >= 1 ? Math.floor(rawPagina) : 1;

  // Base filter de la sección (si aplica)
  let baseSectionFilter: ListProductsFilter = {};
  if (section) {
    baseSectionFilter = await navService.resolveSectionFilter(section);
  }

  // Resolver categoría seleccionada si existe
  let selectedCategoryId: number | undefined = baseSectionFilter.categoryId;
  if (categoria) {
    const catObj = categories.find(
      (c) => c.slug.toLowerCase() === categoria.toLowerCase()
    );
    if (catObj) {
      selectedCategoryId = catObj.id;
    }
  }

  // Combinar atributos de la sección con filtros de usuario
  const mergedAttributes: Record<string, string[]> = {
    ...(baseSectionFilter.attributes || {}),
  };
  for (const [k, vals] of Object.entries(atributos)) {
    mergedAttributes[k] = vals;
  }

  const parsedMinCents =
    minPrecio && !Number.isNaN(Number(minPrecio))
      ? Math.round(Number(minPrecio) * 100)
      : undefined;
  const parsedMaxCents =
    maxPrecio && !Number.isNaN(Number(maxPrecio))
      ? Math.round(Number(maxPrecio) * 100)
      : undefined;

  const finalFilter: ListProductsFilter = {
    ...baseSectionFilter,
    categoryId: selectedCategoryId,
    search: q,
    sizes: talles.length > 0 ? talles : undefined,
    colors: colores.length > 0 ? colores : undefined,
    minPriceCents: parsedMinCents,
    maxPriceCents: parsedMaxCents,
    onlyAvailable: disponible || undefined,
    onlyOnSale: oferta || baseSectionFilter.onlyOnSale || undefined,
    attributes:
      Object.keys(mergedAttributes).length > 0 ? mergedAttributes : undefined,
    sortBy: orden,
    page: 1,
    pageSize: currentPage * pageSize,
  };

  // Facets se calculan sobre la sección base (para que los contadores permitan cambiar de filtro sin quedar en cero)
  const facetBaseFilter: ListProductsFilter = {
    ...baseSectionFilter,
    search: q,
  };

  const [listResult, facets] = await Promise.all([
    productService.listProducts(finalFilter),
    productService.getCatalogFacets(facetBaseFilter),
  ]);

  const activeFilters: ActiveCatalogFilters = {
    q,
    categoria,
    talles,
    colores,
    minPrecio,
    maxPrecio,
    disponible,
    oferta,
    atributos,
    orden,
    pagina: currentPage,
  };

  return {
    settings,
    categories,
    publicSections,
    attributeDefinitions,
    activePromotions,
    pageSize,
    currentPage,
    enabledFilters,
    defaultSort,
    activeFilters,
    products: listResult.items,
    totalCount: listResult.total,
    facets,
  };
}
