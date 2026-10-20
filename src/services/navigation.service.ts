import { ValidationError } from "../domain/errors";
import {
  NavigationSection,
  ProductAttributeDefinition,
  UpsertAttributeDefinitionInput,
  UpsertNavigationSectionInput,
} from "../domain/navigation/types";
import {
  ICategoryRepository,
  ICounterRepository,
  INavigationRepository,
  IProductRepository,
  IStatusHistoryRepository,
} from "../domain/ports/repositories.port";
import { ListProductsFilter } from "../domain/product/types";
import { listProducts } from "./product.service";

export interface NavigationServiceDeps {
  navigationRepo: INavigationRepository;
  productRepo: IProductRepository;
  categoryRepo: ICategoryRepository;
  statusHistoryRepo?: IStatusHistoryRepository;
  counterRepo?: ICounterRepository;
}

/**
 * Convierte la regla declarativa de una sección de navegación en un filtro de servidor ListProductsFilter.
 */
export function buildSectionProductFilter(
  section: NavigationSection,
  now: number = Date.now()
): ListProductsFilter {
  const { ruleType, ruleConfig } = section;

  switch (ruleType) {
    case "ATTRIBUTE": {
      const slug = (
        ruleConfig.attributeSlug ||
        ruleConfig.attributeKey ||
        "para"
      )
        .trim()
        .toLowerCase();
      const val = (ruleConfig.attributeValue || "").trim();
      return {
        attributes: val ? { [slug]: [val] } : undefined,
        sortBy: "featured",
      };
    }
    case "CATEGORY": {
      const catIds = (ruleConfig.categoryIds || []).filter((id) => Number.isInteger(id));
      return {
        categoryIds: catIds.length > 0 ? catIds : undefined,
        sortBy: "featured",
      };
    }
    case "DISCOUNT":
    case "SALE": {
      return {
        onlyOnSale: true,
        sortBy: "featured",
      };
    }
    case "RECENT":
    case "RECENCY": {
      const rawDays = ruleConfig.days ?? ruleConfig.daysWindow;
      const days = rawDays && rawDays > 0 ? rawDays : 30;
      const publishedAfter = now - days * 24 * 60 * 60 * 1000;
      return {
        publishedAfter,
        sortBy: "newest",
      };
    }
    case "FEATURED": {
      return {
        isFeatured: true,
        sortBy: "featured",
      };
    }
    case "MANUAL": {
      return {
        productIds: ruleConfig.productIds || [],
        sortBy: "featured",
      };
    }
    default:
      return { sortBy: "featured" };
  }
}

function asProductDeps(deps: NavigationServiceDeps) {
  return {
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
    statusHistoryRepo: (deps.statusHistoryRepo || {}) as IStatusHistoryRepository,
    counterRepo: (deps.counterRepo || {}) as ICounterRepository,
  };
}

/**
 * Lista las secciones públicas visibles que tienen al menos 1 producto.
 * Regla de diseño: una sección vacía se oculta sola para que nunca aparezca un menú hacia una página vacía.
 */
export async function listPublicNavigationSections(
  deps: NavigationServiceDeps,
  now: number = Date.now()
): Promise<NavigationSection[]> {
  const visibleSections = await deps.navigationRepo.listSections({ visibleOnly: true });
  const enriched = await Promise.all(
    visibleSections.map(async (section) => {
      const filter = buildSectionProductFilter(section, now);
      const res = await listProducts({ ...filter, page: 1, pageSize: 1 }, asProductDeps(deps));
      return {
        ...section,
        productCount: res.total,
      };
    })
  );

  return enriched.filter((s) => (s.productCount ?? 0) > 0);
}

/**
 * Lista todas las secciones para el Backoffice con su conteo actual de productos.
 */
export async function listAdminNavigationSections(
  deps: NavigationServiceDeps,
  now: number = Date.now()
): Promise<NavigationSection[]> {
  const sections = await deps.navigationRepo.listSections({ visibleOnly: false });
  return Promise.all(
    sections.map(async (section) => {
      const filter = buildSectionProductFilter(section, now);
      const res = await listProducts({ ...filter, page: 1, pageSize: 1 }, asProductDeps(deps));
      return {
        ...section,
        productCount: res.total,
      };
    })
  );
}

export async function resolveNavigationSectionBySlug(
  slug: string,
  deps: NavigationServiceDeps,
  now: number = Date.now()
): Promise<{ section: NavigationSection; baseFilter: ListProductsFilter } | null> {
  const section = await deps.navigationRepo.findSectionBySlug(slug);
  if (!section || !section.isVisible) return null;

  const baseFilter = buildSectionProductFilter(section, now);
  return { section, baseFilter };
}

export async function upsertNavigationSection(
  input: UpsertNavigationSectionInput,
  deps: Pick<NavigationServiceDeps, "navigationRepo">
): Promise<NavigationSection> {
  if (!input.name || !input.name.trim()) {
    throw new ValidationError("El nombre de la sección es obligatorio.");
  }

  return deps.navigationRepo.upsertSection(input);
}

export async function deleteNavigationSection(
  id: number,
  deps: Pick<NavigationServiceDeps, "navigationRepo">
): Promise<void> {
  return deps.navigationRepo.deleteSection(id);
}

export async function reorderNavigationSections(
  orderedIds: number[],
  deps: Pick<NavigationServiceDeps, "navigationRepo">
): Promise<void> {
  return deps.navigationRepo.reorderSections(orderedIds);
}

export async function listAttributeDefinitions(
  deps: Pick<NavigationServiceDeps, "navigationRepo">,
  options?: { filterableOnly?: boolean }
): Promise<ProductAttributeDefinition[]> {
  return deps.navigationRepo.listAttributeDefinitions(options);
}

export async function upsertAttributeDefinition(
  input: UpsertAttributeDefinitionInput,
  deps: Pick<NavigationServiceDeps, "navigationRepo">
): Promise<ProductAttributeDefinition> {
  const resolvedName = (input.name || input.label || "").trim();
  if (!resolvedName) {
    throw new ValidationError("El nombre del atributo es obligatorio.");
  }
  return deps.navigationRepo.upsertAttributeDefinition({
    ...input,
    name: resolvedName,
    slug: input.slug || input.key,
  });
}

export async function deleteAttributeDefinition(
  id: number,
  deps: Pick<NavigationServiceDeps, "navigationRepo">
): Promise<void> {
  return deps.navigationRepo.deleteAttributeDefinition(id);
}

export class NavigationService {
  constructor(private readonly deps: NavigationServiceDeps) {}

  async listPublicNavigationSections(now?: number): Promise<NavigationSection[]> {
    return listPublicNavigationSections(this.deps, now);
  }

  async listAdminSectionsWithCounts(now?: number): Promise<NavigationSection[]> {
    return listAdminNavigationSections(this.deps, now);
  }

  async listAttributeDefinitions(options?: {
    filterableOnly?: boolean;
  }): Promise<ProductAttributeDefinition[]> {
    return listAttributeDefinitions(this.deps, options);
  }

  async listFilterableAttributes(): Promise<ProductAttributeDefinition[]> {
    return listAttributeDefinitions(this.deps, { filterableOnly: true });
  }

  async resolveSectionFilter(section: NavigationSection, now: number = Date.now()): Promise<ListProductsFilter> {
    if (
      section.ruleType === "CATEGORY" &&
      (!section.ruleConfig.categoryIds || section.ruleConfig.categoryIds.length === 0) &&
      section.ruleConfig.categorySlugs &&
      section.ruleConfig.categorySlugs.length > 0
    ) {
      const allCats = await this.deps.categoryRepo.listAll();
      const ids = allCats
        .filter((c) => section.ruleConfig.categorySlugs!.includes(c.slug))
        .map((c) => c.id);
      return buildSectionProductFilter(
        {
          ...section,
          ruleConfig: { ...section.ruleConfig, categoryIds: ids },
        },
        now
      );
    }
    return buildSectionProductFilter(section, now);
  }
}

