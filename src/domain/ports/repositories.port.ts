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
import { Coupon, CouponRedemption } from "../coupon/types";

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
  isFeatured?: boolean;
  allowReturn?: boolean;
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
  decrementStock(
    productId: number,
    colorName: string,
    size: string,
    quantity: number,
    now?: number
  ): Promise<{ remainingStock: number; totalProductStock: number; newProductStatus: ProductStatus }>;
  restoreStock(
    productId: number,
    colorName: string,
    size: string,
    quantity: number,
    now?: number
  ): Promise<{ newStock: number; totalProductStock: number; newProductStatus: ProductStatus }>;
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
  getAll?(): Promise<Record<string, string>>;
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

import { Order, OrderItem, OrderStatus } from "../order/types";
import { Customer, CustomerAddress, CustomerStatus } from "../customer/types";
import { Commerce } from "../commerce/types";

export interface CreateOrderRepoData extends Omit<Order, "id" | "items"> {
  items: Array<Omit<OrderItem, "id" | "orderId" | "subtotalCents">>;
}

export interface OrderSummaryCounts {
  total: number;
  pending: number;
}

export interface IOrderRepository {
  create(data: CreateOrderRepoData): Promise<Order>;
  findById(id: number): Promise<Order | null>;
  findByCode(code: number): Promise<Order | null>;
  list(options?: { status?: OrderStatus; limit?: number; offset?: number }): Promise<Order[]>;
  listByCustomer(customerId: number): Promise<Order[]>;
  updateStatus(id: number, status: OrderStatus, updatedAt: number): Promise<Order>;
  getSummaryCounts?(): Promise<OrderSummaryCounts>;
}

export interface ICustomerRepository {
  create(data: Omit<Customer, "id"> | (Omit<Customer, "id" | "createdAt" | "updatedAt"> & { createdAt?: number; updatedAt?: number })): Promise<Customer>;
  findById(id: number): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  updateProfile(id: number, data: { name?: string; phone?: string | null; updatedAt: number }): Promise<Customer>;
  updatePassword(id: number, passwordHash: string, passwordSalt: string, updatedAt: number): Promise<void>;
  updateStatus(id: number, status: CustomerStatus, updatedAt: number): Promise<Customer>;
  count(): Promise<number>;
}

export interface ICustomerAddressRepository {
  create(data: Omit<CustomerAddress, "id"> | (Omit<CustomerAddress, "id" | "createdAt" | "updatedAt"> & { createdAt?: number; updatedAt?: number })): Promise<CustomerAddress>;
  findById(id: number): Promise<CustomerAddress | null>;
  listByCustomer(customerId: number): Promise<CustomerAddress[]>;
  setDefault(customerId: number, addressId: number, updatedAt?: number): Promise<void>;
  delete(id: number): Promise<void>;
}

export interface ICommerceRepository {
  create(data: Omit<Commerce, "id"> | (Omit<Commerce, "id" | "createdAt" | "updatedAt"> & { createdAt?: number; updatedAt?: number })): Promise<Commerce>;
  findById(id: number): Promise<Commerce | null>;
  findBySlug(slug: string): Promise<Commerce | null>;
  getDefault(): Promise<Commerce | null>;
  findDefault(): Promise<Commerce | null>;
  list(): Promise<Commerce[]>;
}

export interface CreateCouponRepoData {
  code: string;
  description?: string | null;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  minOrderCents?: number | null;
  maxDiscountCents?: number | null;
  usageLimit?: number | null;
  maxUsesPerEmail?: number | null;
  isActive?: boolean;
  startsAt?: number | null;
  expiresAt?: number | null;
}

export interface ICouponRepository {
  create(data: CreateCouponRepoData): Promise<Coupon>;
  findById(id: number): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  list(options?: { activeOnly?: boolean }): Promise<Coupon[]>;
  update(id: number, data: Partial<CreateCouponRepoData>): Promise<Coupon>;
  delete(id: number): Promise<void>;
  incrementUsage(id: number): Promise<void>;
  countRedemptions(
    couponId: number,
    identifiers: { email?: string | null; phone?: string | null; dni?: string | null }
  ): Promise<number>;
  countRedemptionsByEmail(couponId: number, email: string): Promise<number>;
  recordRedemption(data: {
    couponId: number;
    orderId?: number | null;
    customerEmail: string;
    customerPhone?: string | null;
    customerDni?: string | null;
    customerId?: number | null;
    discountCents: number;
  }): Promise<CouponRedemption>;
}

export * from "./email.port";

