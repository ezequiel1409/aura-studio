import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  like,
  or,
  sql,
} from "drizzle-orm";
import { parseProductCode } from "../../../domain/product/rules";
import {
  ListProductsFilter,
  PaginatedResult,
  Product,
  ProductColor,
  ProductColorSize,
  ProductPhoto,
  ProductStats,
  ProductStatus,
} from "../../../domain/product/types";
import {
  CreateProductRepoData,
  IProductRepository,
} from "../../../domain/ports/repositories.port";
import { DbClient } from "../client";
import {
  productColorSizes,
  productColors,
  productPhotos,
  productStats,
  products,
} from "../schema";

export class DrizzleProductRepository implements IProductRepository {
  constructor(private readonly db: DbClient) {}

  async create(data: CreateProductRepoData): Promise<Product> {
    const [inserted] = await this.db
      .insert(products)
      .values({
        code: data.code,
        rawText: data.rawText,
        title: data.title,
        priceCents: data.priceCents,
        currency: data.currency,
        size: data.size,
        categoryId: data.categoryId,
        status: data.status,
        soldOutAt: data.soldOutAt,
        reservedUntil: data.reservedUntil,
        manualFields: JSON.stringify(data.manualFields || []),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      .returning();

    // Inserta colores y talles
    const insertedColors: ProductColor[] = [];
    if (data.colors && data.colors.length > 0) {
      for (const col of data.colors) {
        const [c] = await this.db
          .insert(productColors)
          .values({
            productId: inserted.id,
            name: col.name,
            hexCode: col.hexCode || null,
            position: col.position ?? 0,
          })
          .returning();

        const colorSizes: ProductColorSize[] = [];
        if (col.sizes && col.sizes.length > 0) {
          for (const s of col.sizes) {
            const [sizeRow] = await this.db
              .insert(productColorSizes)
              .values({
                productColorId: c.id,
                size: s.size,
                stock: s.stock ?? 0,
                reservedStock: s.reservedStock ?? 0,
              })
              .returning();

            colorSizes.push({
              id: sizeRow.id,
              productColorId: sizeRow.productColorId,
              size: sizeRow.size,
              stock: sizeRow.stock,
              reservedStock: sizeRow.reservedStock,
            });
          }
        }

        insertedColors.push({
          id: c.id,
          productId: c.productId,
          name: c.name,
          hexCode: c.hexCode,
          position: c.position,
          sizes: colorSizes,
        });
      }
    }

    // Inserta fotos si existen
    const insertedPhotos: ProductPhoto[] = [];
    if (data.photos && data.photos.length > 0) {
      for (const photo of data.photos) {
        const [p] = await this.db
          .insert(productPhotos)
          .values({
            productId: inserted.id,
            productColorId: photo.productColorId || null,
            position: photo.position,
            keyThumb: photo.keyThumb,
            keyFull: photo.keyFull,
            createdAt: data.createdAt,
          })
          .returning();

        insertedPhotos.push({
          id: p.id,
          productId: p.productId,
          productColorId: p.productColorId,
          position: p.position,
          keyThumb: p.keyThumb,
          keyFull: p.keyFull,
          createdAt: p.createdAt,
        });
      }
    }

    // Inicializa product_stats (1:1 BR-39)
    await this.db.insert(productStats).values({
      productId: inserted.id,
      viewsCount: 0,
      whatsappClicks: 0,
      lastViewedAt: null,
    });

    return {
      id: inserted.id,
      code: inserted.code,
      rawText: inserted.rawText,
      title: inserted.title,
      priceCents: inserted.priceCents,
      currency: inserted.currency,
      size: inserted.size,
      categoryId: inserted.categoryId,
      status: inserted.status as ProductStatus,
      soldOutAt: inserted.soldOutAt,
      reservedUntil: inserted.reservedUntil,
      manualFields: JSON.parse(inserted.manualFields || "[]"),
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
      colors: insertedColors,
      photos: insertedPhotos,
      stats: {
        productId: inserted.id,
        viewsCount: 0,
        whatsappClicks: 0,
        lastViewedAt: null,
      },
    };
  }

  async findById(id: number): Promise<Product | null> {
    const [row] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!row) return null;

    const photos = await this.getPhotosForProduct(row.id);
    const stats = await this.getStatsForProduct(row.id);
    const colors = await this.getColorsForProduct(row.id);

    return this.mapToEntity(row, photos, stats, colors);
  }

  async findByCode(code: number): Promise<Product | null> {
    const [row] = await this.db
      .select()
      .from(products)
      .where(eq(products.code, code));

    if (!row) return null;

    const photos = await this.getPhotosForProduct(row.id);
    const stats = await this.getStatsForProduct(row.id);
    const colors = await this.getColorsForProduct(row.id);

    return this.mapToEntity(row, photos, stats, colors);
  }

  async update(
    id: number,
    data: Partial<Omit<Product, "id" | "code" | "createdAt">>
  ): Promise<Product> {
    const updateValues: Partial<typeof products.$inferInsert> = {
      updatedAt: data.updatedAt || Date.now(),
    };

    if (data.rawText !== undefined) updateValues.rawText = data.rawText;
    if (data.title !== undefined) updateValues.title = data.title;
    if (data.priceCents !== undefined) updateValues.priceCents = data.priceCents;
    if (data.currency !== undefined) updateValues.currency = data.currency;
    if (data.size !== undefined) updateValues.size = data.size;
    if (data.categoryId !== undefined) updateValues.categoryId = data.categoryId;
    if (data.status !== undefined) updateValues.status = data.status;
    if (data.soldOutAt !== undefined) updateValues.soldOutAt = data.soldOutAt;
    if (data.reservedUntil !== undefined) updateValues.reservedUntil = data.reservedUntil;
    if (data.manualFields !== undefined)
      updateValues.manualFields = JSON.stringify(data.manualFields);

    const [updated] = await this.db
      .update(products)
      .set(updateValues)
      .where(eq(products.id, id))
      .returning();

    const photos = await this.getPhotosForProduct(updated.id);
    const stats = await this.getStatsForProduct(updated.id);

    return this.mapToEntity(updated, photos, stats);
  }

  /**
   * BR-16: Filtrar por categoría incluye hijas si categoryIdsToInclude fue suministrado.
   * BR-21: Disponibles/reservadas van antes que agotadas; orden elegido dentro de cada grupo.
   * BR-23: Prendas sin precio van al final en órdenes por precio.
   * BR-24: Búsqueda por código (#023, 023, 23).
   */
  async list(
    filter: ListProductsFilter,
    categoryIdsToInclude?: number[]
  ): Promise<PaginatedResult<Product>> {
    const conditions = [];

    if (filter.status) {
      conditions.push(eq(products.status, filter.status));
    }

    if (categoryIdsToInclude && categoryIdsToInclude.length > 0) {
      conditions.push(inArray(products.categoryId, categoryIdsToInclude));
    } else if (filter.categoryId) {
      conditions.push(eq(products.categoryId, filter.categoryId));
    }

    if (filter.search && filter.search.trim()) {
      const searchTrimmed = filter.search.trim();
      const codeNumber = parseProductCode(searchTrimmed);

      if (codeNumber !== null) {
        // Búsqueda directa por código BR-24
        conditions.push(eq(products.code, codeNumber));
      } else {
        const pattern = `%${searchTrimmed}%`;
        conditions.push(
          or(like(products.title, pattern), like(products.rawText, pattern))
        );
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Contar total
    const [countResult] = await this.db
      .select({ total: count() })
      .from(products)
      .where(whereClause);

    const total = Number(countResult?.total ?? 0);

    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, filter.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    // Ordenamiento BR-21 y BR-23
    // Grupo 1: Disponibles y Reservadas (0) vs Agotadas (1)
    const statusGroupOrder = sql`CASE WHEN ${products.status} = 'SOLD_OUT' THEN 1 ELSE 0 END ASC`;

    const orderByClauses = [statusGroupOrder];

    if (filter.sortBy === "price_asc") {
      // BR-23: Sin precio al final
      orderByClauses.push(
        sql`CASE WHEN ${products.priceCents} IS NULL THEN 1 ELSE 0 END ASC`
      );
      orderByClauses.push(asc(products.priceCents));
      orderByClauses.push(desc(products.createdAt));
    } else if (filter.sortBy === "price_desc") {
      // BR-23: Sin precio al final
      orderByClauses.push(
        sql`CASE WHEN ${products.priceCents} IS NULL THEN 1 ELSE 0 END ASC`
      );
      orderByClauses.push(desc(products.priceCents));
      orderByClauses.push(desc(products.createdAt));
    } else {
      // 'newest' por defecto
      orderByClauses.push(desc(products.createdAt));
    }

    const rows = await this.db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(...orderByClauses)
      .limit(pageSize)
      .offset(offset);

    // Mapea productos y obtiene sus fotos, estadísticas y colores/talles
    const items: Product[] = [];
    for (const row of rows) {
      const photos = await this.getPhotosForProduct(row.id);
      const stats = await this.getStatsForProduct(row.id);
      const colors = await this.getColorsForProduct(row.id);
      items.push(this.mapToEntity(row, photos, stats, colors));
    }

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async countByCategoryId(categoryId: number): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(products)
      .where(eq(products.categoryId, categoryId));

    return Number(result?.count ?? 0);
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  private async getColorsForProduct(productId: number): Promise<ProductColor[]> {
    const colorRows = await this.db
      .select()
      .from(productColors)
      .where(eq(productColors.productId, productId))
      .orderBy(asc(productColors.position));

    const colors: ProductColor[] = [];
    for (const c of colorRows) {
      const sizeRows = await this.db
        .select()
        .from(productColorSizes)
        .where(eq(productColorSizes.productColorId, c.id))
        .orderBy(asc(productColorSizes.id));

      colors.push({
        id: c.id,
        productId: c.productId,
        name: c.name,
        hexCode: c.hexCode,
        position: c.position,
        sizes: sizeRows.map((s) => ({
          id: s.id,
          productColorId: s.productColorId,
          size: s.size,
          stock: s.stock,
          reservedStock: s.reservedStock,
        })),
      });
    }
    return colors;
  }

  private async getPhotosForProduct(productId: number): Promise<ProductPhoto[]> {
    const rows = await this.db
      .select()
      .from(productPhotos)
      .where(eq(productPhotos.productId, productId))
      .orderBy(asc(productPhotos.position));

    return rows.map((p) => ({
      id: p.id,
      productId: p.productId,
      productColorId: p.productColorId,
      position: p.position,
      keyThumb: p.keyThumb,
      keyFull: p.keyFull,
      createdAt: p.createdAt,
    }));
  }

  private async getStatsForProduct(productId: number): Promise<ProductStats | undefined> {
    const [stats] = await this.db
      .select()
      .from(productStats)
      .where(eq(productStats.productId, productId));

    if (!stats) return undefined;

    return {
      productId: stats.productId,
      viewsCount: stats.viewsCount,
      whatsappClicks: stats.whatsappClicks,
      lastViewedAt: stats.lastViewedAt,
    };
  }

  private mapToEntity(
    row: typeof products.$inferSelect,
    photos?: ProductPhoto[],
    stats?: ProductStats,
    colors?: ProductColor[]
  ): Product {
    // Si row.size no está seteado pero tenemos colors con talles, derivamos la representación resumida
    let sizeDisplay = row.size;
    if (!sizeDisplay && colors && colors.length > 0) {
      const uniqueSizes = new Set<string>();
      for (const col of colors) {
        for (const sz of col.sizes) {
          if (sz.size) uniqueSizes.add(sz.size.trim().toUpperCase());
        }
      }
      if (uniqueSizes.size > 0) {
        sizeDisplay = Array.from(uniqueSizes).join(", ");
      }
    }

    return {
      id: row.id,
      code: row.code,
      rawText: row.rawText,
      title: row.title,
      priceCents: row.priceCents,
      currency: row.currency,
      size: sizeDisplay,
      categoryId: row.categoryId,
      status: row.status as ProductStatus,
      soldOutAt: row.soldOutAt,
      reservedUntil: row.reservedUntil,
      manualFields: JSON.parse(row.manualFields || "[]"),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      colors: colors || [],
      photos: photos || [],
      stats,
    };
  }
}

