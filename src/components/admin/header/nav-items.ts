import {
  Compass,
  CreditCard,
  FileSpreadsheet,
  FolderTree,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  MapPin,
  Package,
  PanelTop,
  PlusCircle,
  Settings,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Truck,
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
  matchPrefix?: string[];
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
    label: "Inicio",
    mobileLabel: "Inicio",
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
    matchPrefix: [
      "/admin/productos",
      "/admin/categorias",
      "/admin/secciones",
      "/admin/promociones",
      "/admin/descuentos",
    ],
    subItems: [
      {
        href: "/admin/productos",
        label: "Productos y stock",
        description: "Listado, precios y estados",
        icon: Package,
        exact: true,
      },
      {
        href: "/admin/productos/nuevo",
        label: "Cargar producto",
        description: "Alta guiada de nueva pieza",
        icon: PlusCircle,
        exact: true,
      },
      {
        href: "/admin/productos/importar",
        label: "Importar desde plantilla",
        description: "Carga masiva por CSV/Excel",
        icon: FileSpreadsheet,
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
        href: "/admin/secciones",
        label: "Secciones, Atributos y Filtros",
        description: "Menú, atributos de rubro y catálogo",
        icon: Compass,
        matchPrefix: ["/admin/secciones"],
      },
      {
        href: "/admin/promociones",
        label: "Promociones bancarias",
        description: "Bancos, beneficios y legales",
        icon: Landmark,
        exact: true,
      },
      {
        href: "/admin/descuentos",
        label: "Cupones y Descuentos",
        description: "Reglas propias de carrito",
        icon: Tag,
        exact: true,
      },
    ],
  },
  {
    id: "store",
    href: "/admin/tienda/negocio",
    label: "Configuración de la Tienda",
    mobileLabel: "Tienda",
    icon: Store,
    matchPrefix: [
      "/admin/tienda",
      "/admin/configuracion",
      "/admin/usuarios",
    ],
    subItems: [
      {
        href: "/admin/tienda/negocio",
        label: "Negocio e Identidad",
        description: "Identidad, rubro y pie de página",
        icon: PanelTop,
        exact: true,
      },
      {
        href: "/admin/tienda/portada",
        label: "Portada y apariencia",
        description: "Banners y paleta con contraste AA",
        icon: LayoutTemplate,
        exact: true,
      },
      {
        href: "/admin/tienda/pagos",
        label: "Medios de pago",
        description: "Mercado Pago, transferencia y efectivo",
        icon: CreditCard,
        exact: true,
      },
      {
        href: "/admin/tienda/envios",
        label: "Envíos y entregas",
        description: "Retiro, correo, moto y zonas de cobertura",
        icon: Truck,
        exact: true,
      },
      {
        href: "/admin/tienda/contacto",
        label: "Contacto y redes",
        description: "Horarios, WhatsApp y ubicación",
        icon: MapPin,
        exact: true,
      },
      {
        href: "/admin/tienda/correos",
        label: "Correos y Notificaciones",
        description: "Plantillas, eventos y diseño de marca",
        icon: Mail,
        exact: true,
      },
      {
        href: "/admin/configuracion?seccion=politicas",
        label: "Políticas de tienda",
        description: "Cambios, devoluciones y términos legales",
        icon: ShieldCheck,
        tabParam: "politicas",
      },
      {
        href: "/admin/usuarios",
        label: "Equipo y permisos",
        description: "Administradores y roles",
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

export function isSubNavItemActive(
  pathname: string,
  searchParamsString: string | null,
  subItem: AdminSubNavItem
): boolean {
  if (subItem.tabParam) {
    const params = new URLSearchParams(searchParamsString || "");
    const currentTab = params.get("seccion");
    if (subItem.tabParam === "politicas") {
      return (
        pathname === "/admin/configuracion" &&
        (!currentTab || currentTab === "politicas" || currentTab === "general")
      );
    }
    return (
      pathname === "/admin/configuracion" && currentTab === subItem.tabParam
    );
  }

  if (subItem.exact) {
    return pathname === subItem.href;
  }

  if (subItem.matchPrefix) {
    return subItem.matchPrefix.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }

  return pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
}

export function getActiveNavGroup(pathname: string): AdminNavItem | undefined {
  return ADMIN_PRIMARY_NAV_ITEMS.find((item) =>
    isAdminNavItemActive(pathname, item)
  );
}
