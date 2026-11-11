import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
} from "lucide-react";
import {
  NavbarAlignment,
  NavbarItemConfig,
  NavbarSubItemConfig,
} from "../../../../services/settings.service";
import { Category } from "../../../../domain/category/types";
import { NavigationSection } from "../../../../domain/navigation/types";

export interface AlignmentOption {
  id: NavbarAlignment;
  label: string;
  description: string;
  icon: typeof AlignLeft;
}

export const ALIGNMENT_OPTIONS: AlignmentOption[] = [
  {
    id: "left",
    label: "Junto al Logo (Izquierda)",
    description: "Enlaces agrupados a la izquierda al lado de la marca.",
    icon: AlignLeft,
  },
  {
    id: "center",
    label: "Centrado",
    description: "Enlaces alineados en el centro de la barra principal.",
    icon: AlignCenter,
  },
  {
    id: "right",
    label: "A la Derecha",
    description: "Enlaces empujados a la derecha contiguos a la búsqueda y bolsa.",
    icon: AlignRight,
  },
  {
    id: "second_row",
    label: "Segunda Fila Dedicada",
    description: "Barra completa exclusiva horizontal debajo del logo y buscador.",
    icon: Layers,
  },
];

export function reorderNavbarItems(
  items: NavbarItemConfig[],
  fromIndex: number,
  toIndex: number
): NavbarItemConfig[] {
  if (toIndex < 0 || toIndex >= items.length) return items;
  const updated = [...items];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  return updated.map((item, idx) => ({
    ...item,
    position: idx + 1,
  }));
}

export function toggleCategoryMapping(
  subItems: NavbarSubItemConfig[],
  parentHref: string,
  category: Category
): NavbarSubItemConfig[] {
  const existingIndex = subItems.findIndex(
    (s) =>
      s.categorySlug === category.slug ||
      s.href.includes(`categoria=${category.slug}`)
  );

  if (existingIndex >= 0) {
    return subItems.filter((_, idx) => idx !== existingIndex);
  }

  const cleanParent = parentHref.split("?")[0];
  const targetHref = `${cleanParent}?categoria=${encodeURIComponent(category.slug)}`;
  const newSub: NavbarSubItemConfig = {
    id: `sub-cat-${category.slug}-${Date.now()}`,
    label: category.name.toUpperCase(),
    href: targetHref,
    categorySlug: category.slug,
  };
  return [...subItems, newSub];
}

export function toggleSectionMapping(
  subItems: NavbarSubItemConfig[],
  section: NavigationSection
): NavbarSubItemConfig[] {
  const targetHref = section.targetUrl || `/${section.slug}`;
  const existingIndex = subItems.findIndex(
    (s) =>
      s.href === targetHref ||
      s.label.toLowerCase() === section.name.toLowerCase()
  );

  if (existingIndex >= 0) {
    return subItems.filter((_, idx) => idx !== existingIndex);
  }

  const newSub: NavbarSubItemConfig = {
    id: `sub-sec-${section.slug}-${Date.now()}`,
    label: section.name.toUpperCase(),
    href: targetHref,
  };
  return [...subItems, newSub];
}

