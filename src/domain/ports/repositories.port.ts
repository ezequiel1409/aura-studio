import { Category } from "../category/types";
import {
  ListProductsFilter,
  PaginatedResult,
  Product,
  ProductStatus,
  StatusHistoryEntry,
} from "../product/types";
import {
  AdminRole,
  AdminStatus,
  AdminUser,
  PasswordResetToken,
} from "../auth/types";

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
    data: Partial<Omit<Product, "id" | "code" | "createdAt" | "colors" | "photos">> & {
      colors?: CreateProductColorRepoData[];
      photos?: Array<{
        keyThumb: string;
        keyFull: string;
        position: number;
        productColorId?: number | null;
      }>;
    }
  ): Promise<Product>;
  list(filter: ListProductsFilter, categoryIdsToInclude?: number[]): Promise<PaginatedResult<Product>>;
  countByCategoryId(categoryId: number): Promise<number>;
  getSummaryCounts(uncategorizedCategoryId: number, now?: number): Promise<BackofficeSummaryCounts>;
  delete(id: number): Promise<void>;
  reassignCategory(fromCategoryId: number, toCategoryId: number): Promise<number>;
  bulkUpdateStatus(ids: number[], newStatus: ProductStatus, soldOutAt: number | null, reservedUntil: number | null, now: number): Promise<void>;
  bulkUpdateCategory(ids: number[], categoryId: number, now: number): Promise<void>;
  bulkDelete(ids: number[]): Promise<void>;
}

export interface ICategoryRepository {
  create(category: Omit<Category, "id" | "stats" | "children">): Promise<Category>;
  findById(id: number): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  listAll(): Promise<Category[]>;
  listAllWithStats(): Promise<Category[]>;
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

export interface LoginAttemptRecord {
  key: string;
  failedCount: number;
  lockedUntil: number | null;
}

export interface ILoginAttemptRepository {
  get(key: string): Promise<LoginAttemptRecord | null>;
  incrementFailed(key: string, now?: number): Promise<{ failedCount: number; lockedUntil: number | null; isLocked: boolean }>;
  reset(key: string): Promise<void>;
}

export interface BackofficeSummaryCounts {
  available: number;
  reserved: number;
  soldOut: number;
  expiringSoon: number;
  uncategorized: number;
  noPrice: number;
}

export interface CreateAdminUserData {
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  role?: AdminRole;
  status?: AdminStatus;
  createdAt: number;
  updatedAt: number;
}

export interface IAdminUserRepository {
  create(data: CreateAdminUserData): Promise<AdminUser>;
  findById(id: number): Promise<AdminUser | null>;
  findByEmail(email: string): Promise<AdminUser | null>;
  listAll(): Promise<AdminUser[]>;
  updateStatus(id: number, status: AdminStatus, updatedAt: number): Promise<AdminUser>;
  updatePassword(id: number, passwordHash: string, passwordSalt: string, updatedAt: number): Promise<void>;
  count(): Promise<number>;
}

export interface IPasswordResetTokenRepository {
  createToken(userId: number, tokenHash: string, expiresAt: number, createdAt: number): Promise<PasswordResetToken>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markAsUsed(id: number, usedAt: number): Promise<void>;
}

export * from "./email.port";

