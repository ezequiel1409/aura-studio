/**
 * Catálogo Mandatorio de Novedades, Integraciones y Registro de Cambios (What's New)
 *
 * Regla de Desarrollo Mandatoria:
 * Cada nueva función, refactorización o cambio relevante
 * DEBE registrarse en este archivo dentro del array `ADMIN_CHANGELOG_RELEASES`.
 */

export interface ChangelogComparison {
  title: string;
  description: string;
  points?: string[];
}

export interface AdminReleaseItem {
  id: string;
  version: string;
  title: string;
  category:
    | "Diseño y Personalización"
    | "Catálogo y Productos"
    | "Ventas y Pagos"
    | "Seguridad y Accesos"
    | "Integraciones";
  date: string;
  summary: string;
  before: ChangelogComparison;
  now: ChangelogComparison;
  actionHref?: string;
  actionLabel?: string;
  badge?: string;
}

export const ADMIN_CHANGELOG_RELEASES: AdminReleaseItem[] = [
  {
    id: "2026-11-storefront-shell-and-instant-navigation",
    version: "v2.5.1",
    title: "Navegación instantánea y tienda más fluida",
    category: "Diseño y Personalización",
    date: "3 de Noviembre 2026",
    summary:
      "La cabecera, el pie de página y la bolsa de compras ahora se mantienen estables al recorrer tu catálogo, evitando recargas innecesarias y parpadeos visuales desde el celular.",
    before: {
      title: "¿Cómo funcionaba antes?",
      description:
        "Al pasar de una sección a otra, toda la parte superior e inferior de la página volvía a cargarse de cero.",
      points: [
        "El buscador y los menús parpadeaban cada vez que se cambiaba de vista.",
        "El contador del carrito volvía a cero por un instante al abrir una ficha.",
        "Las pantallas de carga provocaban saltos molestos en teléfonos.",
      ],
    },
    now: {
      title: "¿Cómo funciona ahora?",
      description:
        "Navegación continua sin cortes mientras tus clientes recorren productos y categorías.",
      points: [
        "La barra superior, el pie de página y el carrito permanecen estables al instante.",
        "Los menús y el buscador responden rápido sin recargar toda la pantalla.",
        "El número de productos en la bolsa se mantiene siempre visible y sin saltos.",
      ],
    },
    actionHref: "/catalogo",
    actionLabel: "Ver tienda pública",
    badge: "Experiencia de compra",
  },
  {
    id: "2026-11-product-draft-autosave",
    version: "v2.5.0",
    title: "Auto-guardado al cargar nuevos productos",
    category: "Catálogo y Productos",
    date: "2 de Noviembre 2026",
    summary:
      "Todo lo que vas cargando en Cargar Nuevo Producto se respalda automáticamente en tu navegador para no perder fotos, precios ni stock si recargás o se corta internet.",
    before: {
      title: "¿Cómo funcionaba antes?",
      description:
        "Si cerrabas sin querer la pestaña o fallaba tu conexión, tenías que empezar de nuevo.",
      points: [
        "Una recarga accidental borraba título, precios y variantes ya cargadas.",
        "Ante un corte de señal desde el celular había que volver a subir las fotos.",
      ],
    },
    now: {
      title: "¿Cómo funciona ahora?",
      description:
        "Respaldo automático en segundo plano y recuperación en un toque al volver.",
      points: [
        "Cada cambio en título, precio, variantes y fotos se guarda al instante mientras escribís.",
        "Si salís y volvés a entrar, podés continuar donde dejaste o descartar el borrador en un clic.",
        "Al publicar el producto, el respaldo temporal se limpia automáticamente.",
      ],
    },
    actionHref: "/admin/productos/nuevo",
    actionLabel: "Ir a Cargar Producto",
    badge: "Respaldo automático",
  },
  {
    id: "2026-10-sections-and-nav-dedicated-endpoints",
    version: "v2.4.1",
    title: "Guardado independiente entre Secciones, Menú y Estilos",
    category: "Diseño y Personalización",
    date: "29 de Octubre 2026",
    summary:
      "Cada parte de la portada (barra de menú, bloques destacados y diseño general) ahora guarda sus cambios de manera ordenada sin pisar ni reiniciar el resto.",
    before: {
      title: "¿Cómo funcionaba antes?",
      description:
        "Al editar varias partes de la portada en simultáneo, algunos guardados podían interferirse.",
      points: [
        "Cambiar una sección a 1 columna de ancho completo podía desordenar su posición.",
        "Editar la barra de menú y los bloques de portada compartía el mismo envío.",
      ],
    },
    now: {
      title: "¿Cómo funciona ahora?",
      description:
        "Cada editor administra lo suyo de forma ordenada y sin pérdida de orden.",
      points: [
        "Las secciones de portada conservan exactamente su orden al cambiar de formato.",
        "El menú superior y las secciones destacadas se editan y guardan sin interferencias.",
      ],
    },
    actionHref: "/admin/tienda/portada",
    actionLabel: "Configurar Portada",
    badge: "Diseño",
  },
  {
    id: "2026-10-navbar-and-home-sections",
    version: "v2.4.0",
    title: "Menú superior personalizable y bloques Home de 1 a 4 columnas",
    category: "Diseño y Personalización",
    date: "29 de Octubre 2026",
    summary:
      "Ahora podés organizar por separado la barra superior de navegación, las colecciones destacadas de la portada y los filtros del catálogo.",
    before: {
      title: "¿Cómo funcionaba antes?",
      description:
        "Todas las opciones de menú, bloques de inicio y atributos estaban mezcladas en una sola pantalla.",
      points: [
        "No se podía apagar o cambiar la posición de la barra superior.",
        "No era posible personalizar colores de la segunda fila del menú.",
        "Los bloques destacados mostraban siempre el contador numérico de artículos.",
      ],
    },
    now: {
      title: "¿Cómo funciona ahora?",
      description:
        "Controles separados, visuales y pensados para adaptarse al rubro de tu tienda.",
      points: [
        "Podés activar o pausar el menú superior, alinear enlaces e incluir colores propios.",
        "Submenús inteligentes que combinan colecciones destacadas y categorías de productos.",
        "Bloques de inicio en 1, 2, 3 o 4 columnas con opción para ocultar o mostrar contadores.",
        "Atributos y filtros gestionados aparte dentro de Productos › Atributos.",
      ],
    },
    actionHref: "/admin/tienda/portada",
    actionLabel: "Explorar Portada y Diseño",
    badge: "Personalización",
  },
];

const STORAGE_PREFIX = "app_ack_releases_";

function getStorageKey(userId?: number | string | null): string {
  const safeId = userId ? String(userId) : "default";
  return `${STORAGE_PREFIX}${safeId}`;
}

export function getAcknowledgedReleaseIds(userId?: number | string | null): string[] {
  if (typeof window === "undefined") return [];
  try {
    const userKey = getStorageKey(userId);
    const rawUser = window.localStorage.getItem(userKey);
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      return Array.isArray(parsedUser) ? parsedUser : [];
    }

    // Si aún no se registró en este usuario pero se marcó en sesión sin resolver (default)
    if (userId && userId !== "default") {
      const rawDefault = window.localStorage.getItem(`${STORAGE_PREFIX}default`);
      if (rawDefault) {
        const parsedDefault = JSON.parse(rawDefault);
        if (Array.isArray(parsedDefault) && parsedDefault.length > 0) {
          window.localStorage.setItem(userKey, JSON.stringify(parsedDefault));
          return parsedDefault;
        }
      }
    }

    return [];
  } catch {
    return [];
  }
}

export function acknowledgeRelease(
  releaseId: string,
  userId?: number | string | null
): void {
  if (typeof window === "undefined") return;
  try {
    const current = getAcknowledgedReleaseIds(userId);
    if (!current.includes(releaseId)) {
      const updated = [...current, releaseId];
      const json = JSON.stringify(updated);
      window.localStorage.setItem(getStorageKey(userId), json);
      if (!userId || userId === "default") {
        window.localStorage.setItem(`${STORAGE_PREFIX}default`, json);
      }
      window.dispatchEvent(new CustomEvent("app_changelog_updated", { detail: { userId, releaseId } }));
    }
  } catch {
    // Manejo seguro en caso de cuota excedida de localStorage
  }
}

export function acknowledgeAllReleases(userId?: number | string | null): void {
  if (typeof window === "undefined") return;
  try {
    const allIds = ADMIN_CHANGELOG_RELEASES.map((r) => r.id);
    const json = JSON.stringify(allIds);
    window.localStorage.setItem(getStorageKey(userId), json);
    if (!userId || userId === "default") {
      window.localStorage.setItem(`${STORAGE_PREFIX}default`, json);
    }
    window.dispatchEvent(new CustomEvent("app_changelog_updated", { detail: { userId, all: true } }));
  } catch {
    // Manejo seguro
  }
}

export function getUnreadReleasesCount(userId?: number | string | null): number {
  const acknowledged = getAcknowledgedReleaseIds(userId);
  return ADMIN_CHANGELOG_RELEASES.filter((r) => !acknowledged.includes(r.id)).length;
}

export function hasUnreadReleases(userId?: number | string | null): boolean {
  return getUnreadReleasesCount(userId) > 0;
}
