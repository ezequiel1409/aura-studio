export type ProductStatus = "AVAILABLE" | "RESERVED" | "SOLD_OUT";

export interface ProductPhoto {
  id: number;
  productId: number;
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
  size: string | null;
  categoryId: number;
  status: ProductStatus;
  soldOutAt: number | null;
  reservedUntil: number | null;
  manualFields: string[];
  createdAt: number;
  updatedAt: number;
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

export interface CreateProductInput {
  rawText: string;
  title?: string | null;
  priceCents?: number | null;
  currency?: string;
  size?: string | null;
  categoryId?: number;
  photos?: Array<{
    keyThumb: string;
    keyFull: string;
    position?: number;
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

