import { Category } from "../category/types";
import {
  ListProductsFilter,
  PaginatedResult,
  Product,
  ProductStatus,
  StatusHistoryEntry,
} from "../product/types";

export interface CreateProductColorRepoData {
  name: string;
  hexCode?: string | null;
  position: number;
  sizes: Array<{
    size: string;
    stock: number;
    reservedStock?: number;
  }>;
}

export interface CreateProductRepoData {
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
  colors?: CreateProductColorRepoData[];
  photos?: Array<{
    keyThumb: string;
    keyFull: string;
    position: number;
    productColorId?: number | null;
  }>;
}

export interface IProductRepository {
  create(data: CreateProductRepoData): Promise<Product>;
  findById(id: number): Promise<Product | null>;
  findByCode(code: number): Promise<Product | null>;
  update(
    id: number,
    data: Partial<Omit<Product, "id" | "code" | "createdAt">>
  ): Promise<Product>;
  list(filter: ListProductsFilter, categoryIdsToInclude?: number[]): Promise<PaginatedResult<Product>>;
  countByCategoryId(categoryId: number): Promise<number>;
  delete(id: number): Promise<void>;
}

export interface ICategoryRepository {
  create(category: Omit<Category, "id" | "stats" | "children">): Promise<Category>;
  findById(id: number): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  listAll(): Promise<Category[]>;
  findSubcategories(parentId: number): Promise<Category[]>;
  update(id: number, data: Partial<Omit<Category, "id">>): Promise<Category>;
  delete(id: number): Promise<void>;
}

export interface IStatusHistoryRepository {
  record(entry: Omit<StatusHistoryEntry, "id">): Promise<StatusHistoryEntry>;
  listByProductId(productId: number): Promise<StatusHistoryEntry[]>;
}

export interface ICounterRepository {
  getNextSequence(counterName: string): Promise<number>;
}

export interface ISettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
