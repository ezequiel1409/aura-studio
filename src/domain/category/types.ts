export interface CategoryStats {
  categoryId: number;
  viewsCount: number;
  lastViewedAt: number | null;
}

export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  position: number;
  isHidden: boolean;
  isSystem: boolean;
  stats?: CategoryStats;
  children?: Category[];
}

export const SYSTEM_UNCATEGORIZED_SLUG = "sin-clasificar";
export const SYSTEM_UNCATEGORIZED_NAME = "Sin clasificar";

