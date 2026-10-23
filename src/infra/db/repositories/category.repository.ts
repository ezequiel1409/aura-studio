import { eq } from "drizzle-orm";
import { Category } from "../../../domain/category/types";
import { ICategoryRepository } from "../../../domain/ports/repositories.port";
import { DbClient } from "../client";
import { categories, categoryStats } from "../schema";
import { memoryCache } from "../../cache/memory-cache";

const CACHE_KEY_ALL = "store_categories_all";
const CACHE_TTL_SECONDS = 300; // 5 minutos

export class DrizzleCategoryRepository implements ICategoryRepository {
  constructor(private readonly db: DbClient) {}

  async create(category: Omit<Category, "id" | "stats" | "children">): Promise<Category> {
    const [inserted] = await this.db
      .insert(categories)
      .values({
        parentId: category.parentId,
        name: category.name,
        slug: category.slug,
        position: category.position,
        isHidden: category.isHidden ? 1 : 0,
        isSystem: category.isSystem ? 1 : 0,
      })
      .returning();

    // Inicializa category_stats (1:1 según BR-39)
    await this.db.insert(categoryStats).values({
      categoryId: inserted.id,
      viewsCount: 0,
      lastViewedAt: null,
    });

    memoryCache.deleteMatching("store_categories_");

    return {
      id: inserted.id,
      parentId: inserted.parentId,
      name: inserted.name,
      slug: inserted.slug,
      position: inserted.position,
      isHidden: Boolean(inserted.isHidden),
      isSystem: Boolean(inserted.isSystem),
    };
  }

  async findById(id: number): Promise<Category | null> {
    const cachedList = memoryCache.get<Category[]>(CACHE_KEY_ALL);
    if (cachedList) {
      const found = cachedList.find((c) => c.id === id);
      if (found) return found;
    }

    const [row] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (!row) return null;

    return {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      slug: row.slug,
      position: row.position,
      isHidden: Boolean(row.isHidden),
      isSystem: Boolean(row.isSystem),
    };
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const cachedList = memoryCache.get<Category[]>(CACHE_KEY_ALL);
    if (cachedList) {
      const found = cachedList.find((c) => c.slug === slug);
      if (found) return found;
    }

    const [row] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));

    if (!row) return null;

    return {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      slug: row.slug,
      position: row.position,
      isHidden: Boolean(row.isHidden),
      isSystem: Boolean(row.isSystem),
    };
  }

  async listAll(): Promise<Category[]> {
    const cached = memoryCache.get<Category[]>(CACHE_KEY_ALL);
    if (cached) {
      return cached;
    }

    const rows = await this.db
      .select()
      .from(categories)
      .orderBy(categories.position, categories.name);

    const result = rows.map((row) => ({
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      slug: row.slug,
      position: row.position,
      isHidden: Boolean(row.isHidden),
      isSystem: Boolean(row.isSystem),
    }));

    memoryCache.set(CACHE_KEY_ALL, result, CACHE_TTL_SECONDS);
    return result;
  }

  async listAllWithStats(): Promise<Category[]> {
    const rows = await this.db
      .select({
        category: categories,
        stats: categoryStats,
      })
      .from(categories)
      .leftJoin(categoryStats, eq(categories.id, categoryStats.categoryId))
      .orderBy(categories.position, categories.name);

    return rows.map(({ category: row, stats }) => ({
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      slug: row.slug,
      position: row.position,
      isHidden: Boolean(row.isHidden),
      isSystem: Boolean(row.isSystem),
      stats: stats
        ? {
            categoryId: stats.categoryId,
            viewsCount: stats.viewsCount,
            lastViewedAt: stats.lastViewedAt,
          }
        : {
            categoryId: row.id,
            viewsCount: 0,
            lastViewedAt: null,
          },
    }));
  }

  async findSubcategories(parentId: number): Promise<Category[]> {
    const cachedList = memoryCache.get<Category[]>(CACHE_KEY_ALL);
    if (cachedList) {
      return cachedList.filter((c) => c.parentId === parentId);
    }

    const rows = await this.db
      .select()
      .from(categories)
      .where(eq(categories.parentId, parentId))
      .orderBy(categories.position, categories.name);

    return rows.map((row) => ({
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      slug: row.slug,
      position: row.position,
      isHidden: Boolean(row.isHidden),
      isSystem: Boolean(row.isSystem),
    }));
  }

  async update(id: number, data: Partial<Omit<Category, "id">>): Promise<Category> {
    const updateData: Partial<typeof categories.$inferInsert> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.isHidden !== undefined) updateData.isHidden = data.isHidden ? 1 : 0;
    if (data.isSystem !== undefined) updateData.isSystem = data.isSystem ? 1 : 0;

    const [updated] = await this.db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    memoryCache.deleteMatching("store_categories_");

    return {
      id: updated.id,
      parentId: updated.parentId,
      name: updated.name,
      slug: updated.slug,
      position: updated.position,
      isHidden: Boolean(updated.isHidden),
      isSystem: Boolean(updated.isSystem),
    };
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(categories).where(eq(categories.id, id));
    memoryCache.deleteMatching("store_categories_");
  }
}
