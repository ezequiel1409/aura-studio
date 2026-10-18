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
  Store,
  Tag,
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
  badge?: string | number;
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
    label: "Productos",
    mobileLabel: "Productos",
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
        href: "/admin/categorias",
        label: "Categorías",
        description: "Árbol de rubros y orden",
        icon: FolderTree,
        exact: true,
      },
      {
        href: "/admin/productos/nuevo",
        label: "+ Cargar Producto",
        description: "Alta rápida de nueva pieza",
        icon: PlusCircle,
        exact: true,
      },
    ],
  },
  {
    id: "discounts",
    href: "/admin/descuentos",
    label: "Descuentos",
    mobileLabel: "Descuentos",
    icon: Tag,
    matchPrefix: ["/admin/descuentos"],
  },
  {
    id: "store",
    href: "/admin/configuracion",
    label: "Tienda",
    mobileLabel: "Tienda",
    icon: Store,
    matchPrefix: ["/admin/configuracion"],
    subItems: [
      {
        href: "/admin/configuracion?seccion=top",
        label: "Identidad y Rubro",
        description: "Nombre, logo y tipo de negocio",
        icon: PanelTop,
        tabParam: "top",
      },
      {
        href: "/admin/configuracion?seccion=main",
        label: "Portada y Colores",
        description: "Banners y paleta con contraste AA",
        icon: LayoutTemplate,
        tabParam: "main",
      },
      {
        href: "/admin/configuracion?seccion=footer",
        label: "Contacto y Redes",
        description: "WhatsApp, dirección y datos fiscales",
        icon: MapPin,
        tabParam: "footer",
      },
      {
        href: "/admin/configuracion?seccion=general",
        label: "Políticas e Inventario",
        description: "Reglas de reserva y cambios",
        icon: Settings2,
        tabParam: "general",
      },
    ],
  },
  {
    id: "settings",
    href: "/admin/usuarios",
    label: "Configuración",
    mobileLabel: "Ajustes",
    icon: Settings,
    matchPrefix: ["/admin/usuarios"],
    subItems: [
      {
        href: "/admin/usuarios",
        label: "Equipo y Accesos",
        description: "Administradores y roles",
        icon: Users,
        exact: true,
      },
      {
        href: "/admin/configuracion?seccion=general",
        label: "Reservas e Inventario",
        description: "Tiempos de reserva automática",
        icon: Settings2,
        tabParam: "general",
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
