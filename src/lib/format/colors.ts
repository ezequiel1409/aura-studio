const TEXTILE_COLOR_HEX_MAP: Record<string, string> = {
  // Neutros y oscuros
  negro: "#18181b",
  black: "#18181b",
  carbon: "#27272a",
  carbón: "#27272a",
  grafito: "#374151",
  blanco: "#ffffff",
  white: "#ffffff",
  gris: "#71717a",
  grey: "#71717a",
  gray: "#71717a",
  "gris topo": "#4b4846",
  "gris melange": "#9ca3af",
  "gris claro": "#d1d5db",
  "gris oscuro": "#374151",
  plomo: "#4b5563",
  cemento: "#94a3b8",

  // Tierras, chocolates y nudes
  chocolate: "#3d2314",
  marron: "#45220c",
  marrón: "#45220c",
  brown: "#45220c",
  cafe: "#4a2c11",
  café: "#4a2c11",
  habano: "#6f4e37",
  camel: "#c19a6b",
  suela: "#9a6237",
  canela: "#9e5b32",
  terracota: "#b45309",
  ladrillo: "#9a3412",
  teja: "#a04000",
  tierra: "#785338",
  beige: "#d8c4b6",
  nude: "#e8c5b0",
  arena: "#d6c5ad",
  crema: "#fffdd0",
  crudo: "#f5f0e6",
  hueso: "#f2ebd9",
  marfil: "#fffff0",
  vison: "#8b7e74",
  visón: "#8b7e74",
  taupe: "#7d6b63",

  // Rosas, morados y rojos
  rosa: "#f472b6",
  "rosa pastel": "#fbcfe8",
  "rosa chicle": "#f43f5e",
  "rosa viejo": "#b56576",
  "palo de rosa": "#b56576",
  fucsia: "#db2777",
  magenta: "#be185d",
  lila: "#c084fc",
  lavanda: "#d8b4fe",
  violeta: "#7c3aed",
  purpura: "#6b21a8",
  púrpura: "#6b21a8",
  morado: "#581c87",
  uva: "#4a044e",
  ciruela: "#581c87",
  bordo: "#701a35",
  bordó: "#701a35",
  borgoña: "#6b1426",
  vino: "#5b1220",
  rojo: "#dc2626",
  red: "#dc2626",
  carmesi: "#be123c",
  carmesí: "#be123c",
  coral: "#f87171",
  salmon: "#fb923c",
  salmón: "#fb923c",
  naranja: "#ea580c",
  orange: "#ea580c",
  durazno: "#fed7aa",

  // Amarillos y ocres
  mostaza: "#d97706",
  amarillo: "#eab308",
  yellow: "#eab308",
  vainilla: "#fef08a",
  maiz: "#fcd34d",
  maíz: "#fcd34d",
  dorado: "#eab308",
  gold: "#eab308",
  plateado: "#cbd5e1",
  silver: "#cbd5e1",
  cobre: "#b45309",
  bronce: "#a16207",

  // Verdes
  verde: "#16a34a",
  green: "#16a34a",
  "verde musgo": "#4d5b3d",
  "verde oliva": "#556b2f",
  "verde militar": "#4a5335",
  "verde botella": "#1a4329",
  "verde menta": "#86efac",
  "verde esmeralda": "#059669",
  "verde seco": "#606c38",
  "verde pino": "#14532d",
  "verde manzana": "#4ade80",
  oliva: "#556b2f",
  musgo: "#4d5b3d",
  militar: "#4a5335",
  esmeralda: "#059669",
  menta: "#86efac",
  sage: "#84a98c",
  palta: "#556b2f",

  // Azules y celestes
  azul: "#2563eb",
  blue: "#2563eb",
  "azul marino": "#0f172a",
  "azul noche": "#0a1128",
  "azul francia": "#1d4ed8",
  "azul aero": "#38bdf8",
  "azul petroleo": "#164e63",
  "azul petróleo": "#164e63",
  marino: "#0f172a",
  navy: "#0f172a",
  celeste: "#38bdf8",
  "celeste cielo": "#7dd3fc",
  turquesa: "#06b6d4",
  petroleo: "#164e63",
  petróleo: "#164e63",
  aqua: "#2dd4bf",
  cian: "#06b6d4",
  cobalto: "#1e40af",
  indigo: "#4338ca",
  índigo: "#4338ca",
  denim: "#2563eb",
};

/**
 * Resuelve el color hexadecimal real para un producto textil.
 * Si el comercio configuró un hex válido (ej: #4d5b3d), lo respeta.
 * Si vino null o vacío, busca en el diccionario de colores textiles comunes por nombre.
 */
export function resolveColorHex(name: string, hexCode?: string | null): string {
  if (hexCode && /^#[0-9a-f]{3,8}$/i.test(hexCode.trim())) {
    return hexCode.trim();
  }
  const cleanName = (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!cleanName) return "#78716c";

  // Coincidencia exacta
  if (TEXTILE_COLOR_HEX_MAP[cleanName]) {
    return TEXTILE_COLOR_HEX_MAP[cleanName];
  }

  // Coincidencia por palabra clave contenida
  for (const [key, val] of Object.entries(TEXTILE_COLOR_HEX_MAP)) {
    if (cleanName.includes(key)) {
      return val;
    }
  }

  return "#78716c";
}
