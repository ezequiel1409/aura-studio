import {
  FolderTree,
  LayoutDashboard,
  LayoutTemplate,
  MapPin,
  Package,
  PanelTop,
  PlusCircle,
  Settings,
  Settings2,
  ShoppingBag,
  Users,
  LucideIcon,
} from "lucide-react";

export interface AdminSubNavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
  tabParam?: string;
}

export interface AdminNavItem {
  id: string;
  href: string;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
  matchPrefix?: string[];
  subItems?: AdminSubNavItem[];
}

export const ADMIN_PRIMARY_NAV_ITEMS: AdminNavItem[] = [
  {
    id: "dashboard",
    href: "/admin",
    label: "Resumen",
    mobileLabel: "Resumen",
    icon: LayoutDashboard,
  },
  {
    id: "orders",
    href: "/admin/ordenes",
    label: "Pedidos",
    mobileLabel: "Pedidos",
    icon: ShoppingBag,
    matchPrefix: ["/admin/ordenes"],
  },
  {
    id: "catalog",
    href: "/admin/productos",
    label: "Catálogo",
    mobileLabel: "Catálogo",
    icon: Package,
    matchPrefix: ["/admin/productos", "/admin/categorias"],
    subItems: [
      {
        href: "/admin/productos",
        label: "Productos y Stock",
        description: "Listado, precios y estados",
        icon: Package,
        exact: true,
      },
      {
        href: "/admin/productos/nuevo",
        label: "+ Cargar Producto",
        description: "Alta rápida de nueva prenda",
        icon: PlusCircle,
        exact: true,
      },
      {
        href: "/admin/categorias",
        label: "Categorías",
        description: "Árbol de rubros y orden",
        icon: FolderTree,
        exact: true,
      },
    ],
  },
  {
    id: "settings",
    href: "/admin/configuracion",
    label: "Tienda y Ajustes",
    mobileLabel: "Ajustes",
    icon: Settings,
    matchPrefix: ["/admin/configuracion", "/admin/usuarios"],
    subItems: [
      {
        href: "/admin/configuracion?seccion=top",
        label: "Parte Superior",
        description: "Logo y nombre de marca",
        icon: PanelTop,
        tabParam: "top",
      },
      {
        href: "/admin/configuracion?seccion=main",
        label: "Contenido Principal",
        description: "Portada Hero y colores",
        icon: LayoutTemplate,
        tabParam: "main",
      },
      {
        href: "/admin/configuracion?seccion=footer",
        label: "Pie de Página",
        description: "WhatsApp, redes y AFIP",
        icon: MapPin,
        tabParam: "footer",
      },
      {
        href: "/admin/configuracion?seccion=general",
        label: "Configuraciones",
        description: "Reglas de reserva",
        icon: Settings2,
        tabParam: "general",
      },
      {
        href: "/admin/usuarios",
        label: "Equipo Admin",
        description: "Usuarios y permisos",
        icon: Users,
        exact: true,
      },
    ],
  },
];

export const ADMIN_QUICK_CREATE_ITEM = {
  href: "/admin/productos/nuevo",
  label: "+ Cargar",
  mobileLabel: "Cargar Producto",
  icon: PlusCircle,
};

export function isAdminNavItemActive(pathname: string, item: AdminNavItem): boolean {
  if (item.href === "/admin") {
    return pathname === "/admin";
  }
  if (item.matchPrefix) {
    return item.matchPrefix.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }
  return pathname === item.href;
}

export function getActiveNavGroup(pathname: string): AdminNavItem | undefined {
  return ADMIN_PRIMARY_NAV_ITEMS.find((item) => isAdminNavItemActive(pathname, item));
}
