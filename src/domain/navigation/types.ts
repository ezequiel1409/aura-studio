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

export type HomeSectionLayout = "1_col" | "2_col" | "3_col" | "4_col";

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
  layout?: HomeSectionLayout;
  targetUrl?: string | null;
  subtitle?: string | null;
  showProductCount?: boolean;
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
  layout?: HomeSectionLayout;
  targetUrl?: string | null;
  subtitle?: string | null;
  subcategoryIds?: number[];
  subcategories?: NavigationSubcategoryItem[];
  position: number;
  isVisible: boolean;
  productCount?: number;
  showProductCount?: boolean;
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
  layout?: HomeSectionLayout;
  targetUrl?: string | null;
  subtitle?: string | null;
  showProductCount?: boolean;
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

