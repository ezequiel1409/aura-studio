import { asc, eq } from "drizzle-orm";
import {
  NavigationRuleConfig,
  NavigationRuleType,
  NavigationSection,
  ProductAttributeDefinition,
  UpsertAttributeDefinitionInput,
  UpsertNavigationSectionInput,
} from "../../../domain/navigation/types";
import { INavigationRepository } from "../../../domain/ports/repositories.port";
import { DbClient } from "../client";
import { navigationSections, productAttributeDefinitions } from "../schema";
import { memoryCache } from "../../cache/memory-cache";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class DrizzleNavigationRepository implements INavigationRepository {
  constructor(private readonly db: DbClient) {}

  async listSections(options?: { visibleOnly?: boolean }): Promise<NavigationSection[]> {
    const cacheKey = options?.visibleOnly
      ? "store_nav_sections_visible"
      : "store_nav_sections_all";
    const cached = memoryCache.get<NavigationSection[]>(cacheKey);
    if (cached) return cached;

    try {
      const rows = options?.visibleOnly
        ? await this.db
            .select()
            .from(navigationSections)
            .where(eq(navigationSections.isVisible, 1))
            .orderBy(asc(navigationSections.position), asc(navigationSections.id))
        : await this.db
            .select()
            .from(navigationSections)
            .orderBy(asc(navigationSections.position), asc(navigationSections.id));

      const result = rows.map((row) => this.mapSection(row));
      memoryCache.set(cacheKey, result, 300);
      return result;
    } catch {
      return [];
    }
  }

  async findSectionBySlug(slug: string): Promise<NavigationSection | null> {
    try {
      const normalized = slugify(slug);
      const [row] = await this.db
        .select()
        .from(navigationSections)
        .where(eq(navigationSections.slug, normalized));
      return row ? this.mapSection(row) : null;
    } catch {
      return null;
    }
  }

  async findSectionById(id: number): Promise<NavigationSection | null> {
    try {
      const [row] = await this.db
        .select()
        .from(navigationSections)
        .where(eq(navigationSections.id, id));
      return row ? this.mapSection(row) : null;
    } catch {
      return null;
    }
  }

  async upsertSection(input: UpsertNavigationSectionInput): Promise<NavigationSection> {
    const slug = slugify(input.slug || input.name) || `seccion-${Date.now()}`;
    const mergedRuleConfig: NavigationRuleConfig = {
      ...(input.ruleConfig || {}),
      showInHomeMosaic:
        input.showInHomeMosaic !== undefined
          ? input.showInHomeMosaic
          : input.ruleConfig?.showInHomeMosaic ?? true,
    };
    const ruleConfigJson = JSON.stringify(mergedRuleConfig);
    const subcategoriesJson = JSON.stringify(
      input.subcategories && input.subcategories.length > 0
        ? input.subcategories
        : input.subcategoryIds || []
    );
    const resolvedCover =
      input.coverImageUrl !== undefined
        ? input.coverImageUrl
        : input.bannerImageUrl ?? null;

    if (input.id) {
      const [updated] = await this.db
        .update(navigationSections)
        .set({
          name: input.name.trim(),
          slug,
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
          ruleType: input.ruleType,
          ruleConfigJson,
          accentColor: input.accentColor ?? null,
          badgeText: input.badgeText ?? null,
          coverImageUrl: resolvedCover,
          subcategoriesJson,
          position: input.position ?? 0,
          isVisible: input.isVisible === false ? 0 : 1,
        })
        .where(eq(navigationSections.id, input.id))
        .returning();

      memoryCache.deleteMatching("store_nav_sections_");
      return this.mapSection(updated);
    }

    const [inserted] = await this.db
      .insert(navigationSections)
      .values({
        name: input.name.trim(),
        slug,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        ruleType: input.ruleType,
        ruleConfigJson,
        accentColor: input.accentColor ?? null,
        badgeText: input.badgeText ?? null,
        coverImageUrl: resolvedCover,
        subcategoriesJson,
        position: input.position ?? 0,
        isVisible: input.isVisible === false ? 0 : 1,
      })
      .returning();

    memoryCache.deleteMatching("store_nav_sections_");
    return this.mapSection(inserted);
  }

  async deleteSection(id: number): Promise<void> {
    await this.db.delete(navigationSections).where(eq(navigationSections.id, id));
    memoryCache.deleteMatching("store_nav_sections_");
  }

  async reorderSections(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.db
        .update(navigationSections)
        .set({ position: i })
        .where(eq(navigationSections.id, orderedIds[i]));
    }
    memoryCache.deleteMatching("store_nav_sections_");
  }

  async listAttributeDefinitions(options?: {
    filterableOnly?: boolean;
  }): Promise<ProductAttributeDefinition[]> {
    const cacheKey = options?.filterableOnly
      ? "store_attr_definitions_filterable"
      : "store_attr_definitions_all";
    const cached = memoryCache.get<ProductAttributeDefinition[]>(cacheKey);
    if (cached) return cached;

    try {
      const rows = options?.filterableOnly
        ? await this.db
            .select()
            .from(productAttributeDefinitions)
            .where(eq(productAttributeDefinitions.isFilterable, 1))
            .orderBy(
              asc(productAttributeDefinitions.position),
              asc(productAttributeDefinitions.id)
            )
        : await this.db
            .select()
            .from(productAttributeDefinitions)
            .orderBy(
              asc(productAttributeDefinitions.position),
              asc(productAttributeDefinitions.id)
            );

      const result = rows.map((row) => this.mapAttributeDefinition(row));
      memoryCache.set(cacheKey, result, 300);
      return result;
    } catch {
      return [];
    }
  }

  async upsertAttributeDefinition(
    input: UpsertAttributeDefinitionInput
  ): Promise<ProductAttributeDefinition> {
    const resolvedName = (input.name || input.label || "").trim();
    const slug = slugify(input.slug || input.key || resolvedName) || `attr-${Date.now()}`;
    const cleanOptions = Array.from(
      new Set((input.options || []).map((o) => o.trim()).filter(Boolean))
    );
    const optionsJson = JSON.stringify(cleanOptions);

    if (input.id) {
      const [updated] = await this.db
        .update(productAttributeDefinitions)
        .set({
          slug,
          name: resolvedName,
          optionsJson,
          isFilterable: input.isFilterable === false ? 0 : 1,
          position: input.position ?? 0,
        })
        .where(eq(productAttributeDefinitions.id, input.id))
        .returning();

      return this.mapAttributeDefinition(updated);
    }

    const existing = await this.db
      .select()
      .from(productAttributeDefinitions)
      .where(eq(productAttributeDefinitions.slug, slug));

    if (existing.length > 0) {
      const [updated] = await this.db
        .update(productAttributeDefinitions)
        .set({
          name: resolvedName,
          optionsJson,
          isFilterable: input.isFilterable === false ? 0 : 1,
          position: input.position ?? existing[0].position,
        })
        .where(eq(productAttributeDefinitions.id, existing[0].id))
        .returning();

      memoryCache.deleteMatching("store_attr_definitions_");
      return this.mapAttributeDefinition(updated);
    }

    const [inserted] = await this.db
      .insert(productAttributeDefinitions)
      .values({
        slug,
        name: resolvedName,
        optionsJson,
        isFilterable: input.isFilterable === false ? 0 : 1,
        position: input.position ?? 0,
      })
      .returning();

    memoryCache.deleteMatching("store_attr_definitions_");
    return this.mapAttributeDefinition(inserted);
  }

  async deleteAttributeDefinition(id: number): Promise<void> {
    await this.db
      .delete(productAttributeDefinitions)
      .where(eq(productAttributeDefinitions.id, id));
    memoryCache.deleteMatching("store_attr_definitions_");
  }

  private mapSection(row: typeof navigationSections.$inferSelect): NavigationSection {
    let ruleConfig: NavigationRuleConfig = {};
    try {
      ruleConfig = JSON.parse(row.ruleConfigJson || "{}");
    } catch {
      ruleConfig = {};
    }

    if (ruleConfig.attributeSlug && !ruleConfig.attributeKey) {
      ruleConfig.attributeKey = ruleConfig.attributeSlug;
    } else if (ruleConfig.attributeKey && !ruleConfig.attributeSlug) {
      ruleConfig.attributeSlug = ruleConfig.attributeKey;
    }

    if (ruleConfig.days !== undefined && ruleConfig.daysWindow === undefined) {
      ruleConfig.daysWindow = ruleConfig.days;
    } else if (ruleConfig.daysWindow !== undefined && ruleConfig.days === undefined) {
      ruleConfig.days = ruleConfig.daysWindow;
    }

    let subcategoryIds: number[] = [];
    let subcategories: Array<{ label: string; categorySlug?: string; href?: string }> = [];
    try {
      const parsed = JSON.parse(row.subcategoriesJson || "[]");
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === "object" && parsed[0] !== null) {
          subcategories = parsed;
        } else {
          subcategoryIds = parsed.map((n) => Number(n)).filter((n) => !Number.isNaN(n));
        }
      }
    } catch {
      subcategoryIds = [];
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      ruleType: row.ruleType as NavigationRuleType,
      ruleConfig,
      accentColor: row.accentColor,
      badgeText: row.badgeText,
      coverImageUrl: row.coverImageUrl,
      bannerImageUrl: row.coverImageUrl,
      showInHomeMosaic:
        ruleConfig.showInHomeMosaic !== undefined ? Boolean(ruleConfig.showInHomeMosaic) : true,
      subcategoryIds,
      subcategories,
      position: row.position,
      isVisible: Boolean(row.isVisible),
    };
  }

  private mapAttributeDefinition(
    row: typeof productAttributeDefinitions.$inferSelect
  ): ProductAttributeDefinition {
    let options: string[] = [];
    try {
      const parsed = JSON.parse(row.optionsJson || "[]");
      if (Array.isArray(parsed)) {
        options = parsed.map((o) => String(o));
      }
    } catch {
      options = [];
    }

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      key: row.slug,
      label: row.name,
      options,
      isFilterable: Boolean(row.isFilterable),
      position: row.position,
    };
  }
}
