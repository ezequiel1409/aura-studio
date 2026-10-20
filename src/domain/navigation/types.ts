export interface ProductAttributeDefinition {
  id: number;
  slug: string;
  name: string;
  key: string;
  label: string;
  options: string[];
  isFilterable: boolean;
  position: number;
}

export type NavigationRuleType =
  | "ATTRIBUTE"
  | "CATEGORY"
  | "DISCOUNT"
  | "SALE"
  | "RECENT"
  | "RECENCY"
  | "FEATURED"
  | "MANUAL";

export interface NavigationRuleConfig {
  attributeSlug?: string;
  attributeKey?: string;
  attributeValue?: string;
  categoryIds?: number[];
  categorySlugs?: string[];
  days?: number;
  daysWindow?: number;
  productIds?: number[];
  showInHomeMosaic?: boolean;
}

export interface NavigationSubcategoryItem {
  label: string;
  categorySlug?: string;
  href?: string;
}

export interface NavigationSection {
  id: number;
  name: string;
  slug: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ruleType: NavigationRuleType;
  ruleConfig: NavigationRuleConfig;
  accentColor: string | null;
  badgeText?: string | null;
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  showInHomeMosaic?: boolean;
  subcategoryIds?: number[];
  subcategories?: NavigationSubcategoryItem[];
  position: number;
  isVisible: boolean;
  productCount?: number;
}

export interface UpsertNavigationSectionInput {
  id?: number;
  name: string;
  slug?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ruleType: NavigationRuleType;
  ruleConfig: NavigationRuleConfig;
  accentColor?: string | null;
  badgeText?: string | null;
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  showInHomeMosaic?: boolean;
  subcategoryIds?: number[];
  subcategories?: NavigationSubcategoryItem[];
  position?: number;
  isVisible?: boolean;
}

export interface UpsertAttributeDefinitionInput {
  id?: number;
  slug?: string;
  key?: string;
  name?: string;
  label?: string;
  options: string[];
  isFilterable?: boolean;
  position?: number;
}

