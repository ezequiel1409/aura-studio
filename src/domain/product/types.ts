export type ProductStatus = "AVAILABLE" | "RESERVED" | "SOLD_OUT";

export interface ProductColorSize {
  id: number;
  productColorId: number;
  size: string;
  stock: number;
  reservedStock: number;
}

export interface ProductColor {
  id: number;
  productId: number;
  name: string;
  hexCode?: string | null;
  position: number;
  sizes: ProductColorSize[];
}

export interface ProductPhoto {
  id: number;
  productId: number;
  productColorId?: number | null;
  position: number;
  keyThumb: string;
  keyFull: string;
  createdAt: number;
}

export interface ProductStats {
  productId: number;
  viewsCount: number;
  whatsappClicks: number;
  lastViewedAt: number | null;
}

export interface Product {
  id: number;
  code: number;
  rawText: string;
  title: string | null;
  priceCents: number | null;
  currency: string;
  size?: string | null;
  categoryId: number;
  status: ProductStatus;
  soldOutAt: number | null;
  reservedUntil: number | null;
  manualFields: string[];
  createdAt: number;
  updatedAt: number;
  colors?: ProductColor[];
  photos?: ProductPhoto[];
  stats?: ProductStats;
}

export type StatusSource = "web" | "telegram" | "system";

export interface StatusHistoryEntry {
  id: number;
  productId: number;
  productCode: number;
  fromStatus: ProductStatus | null;
  toStatus: ProductStatus;
  at: number;
  source: StatusSource;
}

export interface CreateColorSizeInput {
  size: string;
  stock: number;
  reservedStock?: number;
}

export interface CreateColorInput {
  name: string;
  hexCode?: string | null;
  position?: number;
  sizes?: CreateColorSizeInput[];
}

export interface CreateProductInput {
  rawText: string;
  title?: string | null;
  priceCents?: number | null;
  currency?: string;
  size?: string | null;
  categoryId?: number;
  colors?: CreateColorInput[];
  photos?: Array<{
    keyThumb: string;
    keyFull: string;
    position?: number;
    productColorId?: number | null;
  }>;
  source?: StatusSource;
}

export interface UpdateProductInput {
  rawText?: string;
  title?: string | null;
  priceCents?: number | null;
  currency?: string;
  size?: string | null;
  categoryId?: number;
  status?: ProductStatus;
  colors?: CreateColorInput[];
  photos?: Array<{
    keyThumb: string;
    keyFull: string;
    position?: number;
    productColorId?: number | null;
  }>;
  source?: StatusSource;
}

export type ProductSortOption = "newest" | "price_asc" | "price_desc";

export interface ListProductsFilter {
  status?: ProductStatus;
  categoryId?: number;
  search?: string;
  sortBy?: ProductSortOption;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

