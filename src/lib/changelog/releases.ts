/**
 * Catálogo Mandatorio de Novedades, Integraciones y Registro de Cambios (What's New)
 * 
 * Regla de Desarrollo Mandatoria:
 * Cada nueva función, refactorización o cambio arquitectónico relevante
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
    title: "Navegación Instantánea SPA y Persistencia del Cascarón de Tienda",
    category: "Diseño y Personalización",
    date: "3 de Noviembre 2026",
    summary:
      "Unificación de la cabecera, pie y bolsa de compras en una cáscara persistente con memoización de slots y aislamiento de reactividad, eliminando rehidrataciones, parpadeos de interfaz y picos de memoria en la navegación del storefront.",
    before: {
      title: "¿Cómo funcionaba anteriormente?",
      description:
        "Cada cambio de página destruía y volvía a montar la cabecera y el pie de página.",
      points: [
        "El Header se re-renderizaba por completo en cada tecla del buscador o cambio de URL, recalculando menús y colecciones completas.",
        "El contador de la bolsa de compras sufría un parpadeo animado (0 a N) en cada navegación.",
        "Los skeletons de carga reemplazaban toda la pantalla provocando saltos bruscos en la experiencia visual de la clienta.",
      ],
    },
    now: {
      title: "¿Cómo se gestiona ahora?",
      description:
        "Cascarón persistente desacoplado de la URL con slots memoizados y navegación fluida.",
      points: [
        "Header, Footer y Carrito permanecen en memoria sin destruirse ni rehidratarse al navegar entre el catálogo y las prendas.",
        "Aislamiento de scroll y estado: La cabecera memoiza secciones y categorías, manteniendo el buscador y menús estables sin re-renderizados innecesarios.",
        "Contador de bolsa sin parpadeos: Mantiene el estado de hidratación activo sin saltos visuales.",
      ],
    },
    actionHref: "/catalogo",
    actionLabel: "Explorar Navegación Fluida",
    badge: "UI/UX & Performance",
  },
  {
    id: "2026-11-product-draft-autosave",
    version: "v2.5.0",
    title: "Auto-guardado y Recuperación de Borrador Local en Carga de Prendas",
    category: "Catálogo y Productos",
    date: "2 de Noviembre 2026",
    summary:
      "Protección continua de datos en el navegador para el formulario de Cargar Nueva Pieza, evitando la pérdida de fotos, variantes, atributos y precios ante recargas, cierres involuntarios o fallos técnicos.",
    before: {
      title: "¿Cómo funcionaba anteriormente?",
      description:
        "Los datos ingresados existían únicamente en la memoria RAM temporal del navegador.",
      points: [
        "Si la administradora recargaba la página, cerraba la pestaña por error o sufría un microcorte de red, se perdían todos los campos completados.",
        "Si el servidor devolvía un error inesperado al intentar publicar, salir de la pantalla requería volver a cargar fotos y talles desde cero.",
      ],
    },
    now: {
      title: "¿Cómo se gestiona ahora?",
      description:
        "Persistencia local automática en el navegador con restauración transparente y opción de descarte.",
      points: [
        "Auto-guardado reactivo en segundo plano: Título, precios, variantes, fotos cargadas y atributos se respaldan localmente en tiempo real.",
        "Restauración inmediata con aviso: Al reabrir el formulario, se recupera el borrador previo y se ofrece un botón para descartarlo en un solo clic si ya no se necesita.",
        "Limpieza garantizada: Al publicarse la prenda exitosamente en el catálogo, el borrador local se purga de forma atómica.",
      ],
    },
    actionHref: "/admin/productos/nuevo",
    actionLabel: "Probar Cargar Pieza",
    badge: "UX y Resiliencia",
  },
  {
    id: "2026-10-sections-and-nav-dedicated-endpoints",
    version: "v2.4.1",
    title: "Endpoints Dedicados por Responsabilidad y Corrección de Ancho Completo en Secciones",
    category: "Diseño y Personalización",
    date: "29 de Octubre 2026",
    summary:
      "Arquitectura desacoplada con endpoints dedicados exclusivos para Secciones (/api/admin/sections) y Barra de Navegación (/api/admin/nav), junto con la corrección definitiva de persistencia para secciones de ancho completo en portada.",
    before: {
      title: "¿Cómo funcionaba anteriormente?",
      description:
        "Las secciones y la barra de navegación compartían endpoints sobrecargados y formularios anidados en el cliente.",
      points: [
        "El formulario de edición de secciones estaba anidado dentro del formulario general de apariencia, causando interferencias en el submit.",
        "Al editar una sección para pasarla a '1 Columna (Ancho Completo)', el repositorio reseteaba su posición a 0 y podía pisar la regla original.",
        "No existían rutas dedicadas para cada responsabilidad: tanto secciones como navbar dependían de endpoints compartidos.",
      ],
    },
    now: {
      title: "¿Cómo se gestiona ahora?",
      description:
        "Se aplicó el principio de responsabilidad única (Single Responsibility) a nivel backend y frontend con persistencia atómica.",
      points: [
        "Ruta dedicada '/api/admin/sections': Exclusiva para el ciclo de vida de secciones (GET, POST, PUT, DELETE y reordenamiento).",
        "Ruta dedicada '/api/admin/nav': Exclusiva para consultar y guardar la barra de navegación (alineación, visibilidad, colores de 2da fila y subítems).",
        "Edición perfecta de Ancho Completo: Al modificar una sección a 1 columna (1_col), el repositorio preserva su orden (position), sus reglas existentes y aplica el ancho completo col-span-12 en la vidriera de inicio.",
        "Formularios desanidados: Los editores de secciones y cabecera ya no colisionan con el contenedor superior y operan de forma 100% independiente.",
      ],
    },
    actionHref: "/admin/tienda/portada",
    actionLabel: "Gestionar Secciones y Navbar",
    badge: "Arquitectura",
  },
  {
    id: "2026-10-navbar-and-home-sections",
    version: "v2.4.0",
    title: "Nueva división de Navegación: Navbar configurable y Secciones Home de 1 a 4 columnas",
    category: "Diseño y Personalización",
    date: "29 de Octubre 2026",
    summary:
      "Separación completa entre la Barra de Navegación (Navbar), las Secciones destacadas de la portada y los Atributos y Filtros del catálogo.",
    before: {
      title: "¿Cómo funcionaba anteriormente?",
      description:
        "Toda la configuración estaba agrupada de forma rígida bajo 'Productos > Secciones, Atributos y Filtros'.",
      points: [
        "La Navbar estaba siempre encendida sin opción de apagarla ni cambiar su alineación.",
        "El switch de activación no tenía indicación visual clara de estado (verde activo / rojo apagado).",
        "No se podía personalizar el color de fondo ni del texto al elegir una segunda fila horizontal.",
        "Los menús desplegables (dropdown) como 'MUJER' se perdían o no permitían explorar las secciones destacadas.",
        "Los ítems de la barra de navegación no permitían configurar ni mapear subsecciones o subcategorías personalizadas.",
        "Las secciones de la Home tenían diseños fijos y no permitían elegir formatos de 1 a 4 columnas.",
        "Las secciones en portada mostraban de forma obligatoria el texto con el contador de piezas/productos, sin opción de ocultarlo.",
        "Los atributos del rubro y filtros de búsqueda estaban mezclados en la misma pantalla de navegación.",
      ],
    },
    now: {
      title: "¿Cómo se gestiona ahora?",
      description:
        "Se dividió en módulos independientes y altamente configurables bajo un hub unificado de diseño.",
      points: [
        "Switch con semáforo cromático: verde esmeralda cuando la Navbar está visible y rojo cuando está apagada.",
        "Navbar independiente: podés activarla o desactivarla (ON/OFF), elegir alineación (izquierda, centro, derecha o 2da fila) y ordenar los enlaces.",
        "Segunda fila dedicada con colores propios: selector de fondo y texto con combinaciones rápidas (Blanco y Carbón, Ébano, Lino, Ámbar) y soporte multi-dispositivo.",
        "Nuevo Dropdown Dual Inteligente: los menús como 'MUJER' nunca se pierden y muestran tanto las Secciones y Colecciones destacadas como las Prendas por Categoría (escritorio y celular).",
        "Mapeo de Subsecciones con 1 clic: cada enlace de la Navbar cuenta con un panel expandible de subsecciones para mapear al instante categorías existentes de la tienda o secciones destacadas, o cargar subenlaces a medida con ordenamiento y etiquetas de Sale.",
        "Previsualización estructural en vivo: diagrama interactivo en tiempo real en el panel que muestra cómo se reorganizan el logo, los enlaces, los colores y el buscador.",
        "Estado pausado/grisado: al apagar la Navbar, las opciones dependientes (alineación, colores y lista de enlaces) se muestran en gris para no confundir la vista previa.",
        "Secciones Home personalizables: elegí formato de 1, 2, 3 o 4 columnas con imagen, título, subtítulo y enlace propio.",
        "Portada sin mención obligatoria de productos: las tarjetas de sección en la home ocultan por defecto el texto de 'X piezas / productos' para un diseño editorial mucho más limpio, manteniendo un interruptor opcional en el panel para activarlo si se prefiere.",
        "Atributos y Filtros en su lugar: ahora están en 'Productos > Atributos' con gestión independiente.",
      ],
    },
    actionHref: "/admin/tienda/portada",
    actionLabel: "Explorar Portada y Diseño",
    badge: "Nuevo Módulo",
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

