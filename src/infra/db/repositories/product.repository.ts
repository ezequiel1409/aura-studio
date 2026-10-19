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
import { calculateTotalStock, parseProductCode } from "../../../domain/product/rules";
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
  BackofficeSummaryCounts,
  CreateProductColorRepoData,
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
  statusHistory,
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
        isFeatured: data.isFeatured ? 1 : 0,
        allowReturn: data.allowReturn === false ? 0 : 1,
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
      isFeatured: Boolean(inserted.isFeatured),
      allowReturn: Boolean(inserted.allowReturn),
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

    const [photos, stats, colors] = await Promise.all([
      this.getPhotosForProduct(row.id),
      this.getStatsForProduct(row.id),
      this.getColorsForProduct(row.id),
    ]);

    return this.mapToEntity(row, photos, stats, colors);
  }

  async findByCode(code: number): Promise<Product | null> {
    const [row] = await this.db
      .select()
      .from(products)
      .where(eq(products.code, code));

    if (!row) return null;

    const [photos, stats, colors] = await Promise.all([
      this.getPhotosForProduct(row.id),
      this.getStatsForProduct(row.id),
      this.getColorsForProduct(row.id),
    ]);

    return this.mapToEntity(row, photos, stats, colors);
  }

  async update(
    id: number,
    data: Partial<Omit<Product, "id" | "code" | "createdAt" | "colors" | "photos">> & {
      colors?: CreateProductColorRepoData[];
      photos?: Array<{
        keyThumb: string;
        keyFull: string;
        position: number;
        productColorId?: number | null;
      }>;
    }
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
    if (data.isFeatured !== undefined) updateValues.isFeatured = data.isFeatured ? 1 : 0;
    if (data.allowReturn !== undefined) updateValues.allowReturn = data.allowReturn ? 1 : 0;
    if (data.soldOutAt !== undefined) updateValues.soldOutAt = data.soldOutAt;
    if (data.reservedUntil !== undefined) updateValues.reservedUntil = data.reservedUntil;
    if (data.manualFields !== undefined)
      updateValues.manualFields = JSON.stringify(data.manualFields);

    const [updated] = await this.db
      .update(products)
      .set(updateValues)
      .where(eq(products.id, id))
      .returning();

    // Actualiza colores si se especifican
    if (data.colors !== undefined) {
      await this.db.delete(productColors).where(eq(productColors.productId, id));
      for (const col of data.colors) {
        const [c] = await this.db
          .insert(productColors)
          .values({
            productId: id,
            name: col.name,
            hexCode: col.hexCode || null,
            position: col.position ?? 0,
          })
          .returning();

        if (col.sizes && col.sizes.length > 0) {
          for (const s of col.sizes) {
            await this.db.insert(productColorSizes).values({
              productColorId: c.id,
              size: s.size,
              stock: s.stock ?? 0,
              reservedStock: s.reservedStock ?? 0,
            });
          }
        }
      }
    }

    // Actualiza fotos si se especifican
    if (data.photos !== undefined) {
      await this.db.delete(productPhotos).where(eq(productPhotos.productId, id));
      for (const photo of data.photos) {
        await this.db.insert(productPhotos).values({
          productId: id,
          productColorId: photo.productColorId || null,
          position: photo.position,
          keyThumb: photo.keyThumb,
          keyFull: photo.keyFull,
          createdAt: Date.now(),
        });
      }
    }

    const photos = await this.getPhotosForProduct(updated.id);
    const stats = await this.getStatsForProduct(updated.id);
    const colors = await this.getColorsForProduct(updated.id);

    return this.mapToEntity(updated, photos, stats, colors);
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

    if (filter.isFeatured !== undefined) {
      conditions.push(eq(products.isFeatured, filter.isFeatured ? 1 : 0));
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
      // 'newest' por defecto: destacados primero entre disponibles
      orderByClauses.push(
        sql`CASE WHEN ${products.isFeatured} = 1 THEN 0 ELSE 1 END ASC`
      );
      orderByClauses.push(desc(products.createdAt));
    }

    const rows = await this.db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(...orderByClauses)
      .limit(pageSize)
      .offset(offset);

    if (rows.length === 0) {
      return {
        items: [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const productIds = rows.map((r) => r.id);

    // 1. Fotos para todos los productos en una sola consulta por lote
    const allPhotos = await this.db
      .select()
      .from(productPhotos)
      .where(inArray(productPhotos.productId, productIds))
      .orderBy(asc(productPhotos.position));

    const photosByProductId = new Map<number, ProductPhoto[]>();
    for (const p of allPhotos) {
      const list = photosByProductId.get(p.productId) || [];
      list.push({
        id: p.id,
        productId: p.productId,
        productColorId: p.productColorId,
        position: p.position,
        keyThumb: p.keyThumb,
        keyFull: p.keyFull,
        createdAt: p.createdAt,
      });
      photosByProductId.set(p.productId, list);
    }

    // 2. Estadísticas para todos los productos en una sola consulta por lote
    const allStats = await this.db
      .select()
      .from(productStats)
      .where(inArray(productStats.productId, productIds));

    const statsByProductId = new Map<number, ProductStats>();
    for (const s of allStats) {
      statsByProductId.set(s.productId, {
        productId: s.productId,
        viewsCount: s.viewsCount,
        whatsappClicks: s.whatsappClicks,
        lastViewedAt: s.lastViewedAt,
      });
    }

    // 3. Colores para todos los productos en una sola consulta por lote
    const allColors = await this.db
      .select()
      .from(productColors)
      .where(inArray(productColors.productId, productIds))
      .orderBy(asc(productColors.position));

    // 4. Talles para todos los colores obtenidos
    const colorIds = allColors.map((c) => c.id);
    const sizesByColorId = new Map<number, ProductColorSize[]>();
    if (colorIds.length > 0) {
      const allSizes = await this.db
        .select()
        .from(productColorSizes)
        .where(inArray(productColorSizes.productColorId, colorIds));

      for (const s of allSizes) {
        const list = sizesByColorId.get(s.productColorId) || [];
        list.push({
          id: s.id,
          productColorId: s.productColorId,
          size: s.size,
          stock: s.stock,
          reservedStock: s.reservedStock,
        });
        sizesByColorId.set(s.productColorId, list);
      }
    }

    const colorsByProductId = new Map<number, ProductColor[]>();
    for (const c of allColors) {
      const list = colorsByProductId.get(c.productId) || [];
      list.push({
        id: c.id,
        productId: c.productId,
        name: c.name,
        hexCode: c.hexCode,
        position: c.position,
        sizes: sizesByColorId.get(c.id) || [],
      });
      colorsByProductId.set(c.productId, list);
    }

    // Mapea productos en memoria instantáneamente
    const items = rows.map((row) =>
      this.mapToEntity(
        row,
        photosByProductId.get(row.id),
        statsByProductId.get(row.id),
        colorsByProductId.get(row.id)
      )
    );

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

  async reassignCategory(fromCategoryId: number, toCategoryId: number): Promise<number> {
    const updated = await this.db
      .update(products)
      .set({ categoryId: toCategoryId, updatedAt: Date.now() })
      .where(eq(products.categoryId, fromCategoryId))
      .returning();

    return updated.length;
  }

  async bulkUpdateStatus(
    ids: number[],
    newStatus: ProductStatus,
    soldOutAt: number | null,
    reservedUntil: number | null,
    now: number
  ): Promise<void> {
    if (ids.length === 0) return;
    await this.db
      .update(products)
      .set({
        status: newStatus,
        soldOutAt,
        reservedUntil,
        updatedAt: now,
      })
      .where(inArray(products.id, ids));
  }

  async bulkUpdateCategory(ids: number[], categoryId: number, now: number): Promise<void> {
    if (ids.length === 0) return;
    await this.db
      .update(products)
      .set({
        categoryId,
        updatedAt: now,
      })
      .where(inArray(products.id, ids));
  }

  async bulkDelete(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db.delete(products).where(inArray(products.id, ids));
  }

  async getSummaryCounts(
    uncategorizedCategoryId: number,
    now: number = Date.now()
  ): Promise<BackofficeSummaryCounts> {
    // BR-31: prendas que llevan >= 23 dias en SOLD_OUT (les quedan <= 7 dias para purga a los 30 dias)
    const twentyThreeDaysAgo = now - 23 * 24 * 60 * 60 * 1000;

    const [row] = await this.db
      .select({
        available: sql<number>`COALESCE(SUM(CASE WHEN ${products.status} = 'AVAILABLE' THEN 1 ELSE 0 END), 0)`,
        reserved: sql<number>`COALESCE(SUM(CASE WHEN ${products.status} = 'RESERVED' THEN 1 ELSE 0 END), 0)`,
        soldOut: sql<number>`COALESCE(SUM(CASE WHEN ${products.status} = 'SOLD_OUT' THEN 1 ELSE 0 END), 0)`,
        expiringSoon: sql<number>`COALESCE(SUM(CASE WHEN ${products.status} = 'SOLD_OUT' AND ${products.soldOutAt} IS NOT NULL AND ${products.soldOutAt} <= ${twentyThreeDaysAgo} THEN 1 ELSE 0 END), 0)`,
        uncategorized: sql<number>`COALESCE(SUM(CASE WHEN ${products.categoryId} = ${uncategorizedCategoryId} THEN 1 ELSE 0 END), 0)`,
        noPrice: sql<number>`COALESCE(SUM(CASE WHEN ${products.priceCents} IS NULL THEN 1 ELSE 0 END), 0)`,
      })
      .from(products);

    return {
      available: Number(row?.available ?? 0),
      reserved: Number(row?.reserved ?? 0),
      soldOut: Number(row?.soldOut ?? 0),
      expiringSoon: Number(row?.expiringSoon ?? 0),
      uncategorized: Number(row?.uncategorized ?? 0),
      noPrice: Number(row?.noPrice ?? 0),
    };
  }

  /**
   * BR-02, BR-40: Descuenta el stock físico de una variante de color y talle al confirmarse una orden.
   * Si el stock total de la prenda llega a 0, transiciona automáticamente a SOLD_OUT.
   */
  async decrementStock(
    productId: number,
    colorName: string,
    size: string,
    quantity: number,
    now: number = Date.now()
  ): Promise<{ remainingStock: number; totalProductStock: number; newProductStatus: ProductStatus }> {
    const colors = await this.getColorsForProduct(productId);
    const matchingColor = colors.find(
      (c) => c.name.trim().toLowerCase() === colorName.trim().toLowerCase()
    );

    let remainingStock = 0;
    if (matchingColor) {
      const matchingSize = matchingColor.sizes.find(
        (s) => s.size.trim().toUpperCase() === size.trim().toUpperCase()
      );
      if (matchingSize) {
        remainingStock = Math.max(0, matchingSize.stock - quantity);
        await this.db
          .update(productColorSizes)
          .set({ stock: remainingStock })
          .where(eq(productColorSizes.id, matchingSize.id));
      }
    }

    const updatedColors = await this.getColorsForProduct(productId);
    const totalProductStock = calculateTotalStock(updatedColors);

    const [prodRow] = await this.db.select().from(products).where(eq(products.id, productId));
    const currentStatus = (prodRow?.status || "AVAILABLE") as ProductStatus;
    let newProductStatus = currentStatus;

    if (totalProductStock <= 0 && currentStatus !== "SOLD_OUT") {
      newProductStatus = "SOLD_OUT";
      await this.db
        .update(products)
        .set({
          status: "SOLD_OUT",
          soldOutAt: now,
          updatedAt: now,
        })
        .where(eq(products.id, productId));

      if (prodRow) {
        await this.db.insert(statusHistory).values({
          productId: prodRow.id,
          productCode: prodRow.code,
          fromStatus: currentStatus,
          toStatus: "SOLD_OUT",
          at: now,
          source: "system",
        });
      }
    }

    return { remainingStock, totalProductStock, newProductStatus };
  }

  /**
   * BR-02: Restaura el stock físico de una variante de color y talle (ej. por cancelación de orden).
   * Si la prenda estaba en SOLD_OUT y ahora tiene stock > 0, se reactiva a AVAILABLE.
   */
  async restoreStock(
    productId: number,
    colorName: string,
    size: string,
    quantity: number,
    now: number = Date.now()
  ): Promise<{ newStock: number; totalProductStock: number; newProductStatus: ProductStatus }> {
    const colors = await this.getColorsForProduct(productId);
    const matchingColor = colors.find(
      (c) => c.name.trim().toLowerCase() === colorName.trim().toLowerCase()
    );

    let newStock = 0;
    if (matchingColor) {
      const matchingSize = matchingColor.sizes.find(
        (s) => s.size.trim().toUpperCase() === size.trim().toUpperCase()
      );
      if (matchingSize) {
        newStock = matchingSize.stock + quantity;
        await this.db
          .update(productColorSizes)
          .set({ stock: newStock })
          .where(eq(productColorSizes.id, matchingSize.id));
      }
    }

    const updatedColors = await this.getColorsForProduct(productId);
    const totalProductStock = calculateTotalStock(updatedColors);

    const [prodRow] = await this.db.select().from(products).where(eq(products.id, productId));
    const currentStatus = (prodRow?.status || "AVAILABLE") as ProductStatus;
    let newProductStatus = currentStatus;

    if (currentStatus === "SOLD_OUT" && totalProductStock > 0) {
      newProductStatus = "AVAILABLE";
      await this.db
        .update(products)
        .set({
          status: "AVAILABLE",
          soldOutAt: null,
          updatedAt: now,
        })
        .where(eq(products.id, productId));

      if (prodRow) {
        await this.db.insert(statusHistory).values({
          productId: prodRow.id,
          productCode: prodRow.code,
          fromStatus: "SOLD_OUT",
          toStatus: "AVAILABLE",
          at: now,
          source: "system",
        });
      }
    }

    return { newStock, totalProductStock, newProductStatus };
  }

  private async getColorsForProduct(productId: number): Promise<ProductColor[]> {
    const colorRows = await this.db
      .select()
      .from(productColors)
      .where(eq(productColors.productId, productId))
      .orderBy(asc(productColors.position));

    if (colorRows.length === 0) return [];

    const colorIds = colorRows.map((c) => c.id);
    const sizeRows = await this.db
      .select()
      .from(productColorSizes)
      .where(inArray(productColorSizes.productColorId, colorIds))
      .orderBy(asc(productColorSizes.id));

    const sizesByColorId = new Map<number, ProductColorSize[]>();
    for (const s of sizeRows) {
      const list = sizesByColorId.get(s.productColorId) || [];
      list.push({
        id: s.id,
        productColorId: s.productColorId,
        size: s.size,
        stock: s.stock,
        reservedStock: s.reservedStock,
      });
      sizesByColorId.set(s.productColorId, list);
    }

    return colorRows.map((c) => ({
      id: c.id,
      productId: c.productId,
      name: c.name,
      hexCode: c.hexCode,
      position: c.position,
      sizes: sizesByColorId.get(c.id) || [],
    }));
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
      isFeatured: Boolean(row.isFeatured),
      allowReturn: row.allowReturn === undefined || row.allowReturn === null ? true : Boolean(row.allowReturn),
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

