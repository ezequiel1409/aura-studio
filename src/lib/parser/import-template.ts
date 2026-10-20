export interface RawImportRow {
  rowNumber: number;
  codigo?: string;
  nombre?: string;
  precio?: string;
  precio_anterior?: string;
  categoria?: string;
  para?: string;
  colores?: string;
  talles?: string;
  stock?: string;
  estado?: string;
  destacado?: string;
  descripcion?: string;
  imagenes?: string;
}

export interface ImportError {
  column: string;
  message: string;
  severity: "ERROR" | "WARNING";
}

export interface ProcessedVariant {
  name: string;
  sizes: Array<{ size: string; stock: number }>;
}

export interface ValidatedImportItem {
  rowNumber: number;
  code?: number;
  title: string;
  priceCents: number | null;
  compareAtPriceCents: number | null;
  categoryName: string;
  categoryId?: number;
  attributes: Record<string, string>;
  colors: ProcessedVariant[];
  status: "AVAILABLE" | "RESERVED";
  isFeatured: boolean;
  description: string;
  photoUrls: string[];
  rowStatus: "VALID" | "WARNING" | "ERROR";
  errors: ImportError[];
}

export const IMPORT_TEMPLATE_COLUMNS = [
  "codigo",
  "nombre",
  "precio",
  "precio_anterior",
  "categoria",
  "para",
  "colores",
  "talles",
  "stock",
  "estado",
  "destacado",
  "descripcion",
  "imagenes",
] as const;

export function generateTemplateCsv(): string {
  const header = IMPORT_TEMPLATE_COLUMNS.join(",");
  const sample1 = [
    "",
    '"Vestido Lino Siena"',
    "48000",
    "56000",
    '"Vestidos"',
    '"Mujer"',
    '"Blanco, Negro"',
    '"S, M, L"',
    '"2, 3, 1"',
    '"Disponible"',
    '"SI"',
    '"Vestido de lino puro con escote halter y calce fluido."',
    '"https://images.unsplash.com/photo-1515372039744-b8f02a3ae446"',
  ].join(",");

  const sample2 = [
    "",
    '"Blazer Milano"',
    "85000",
    "",
    '"Sastrería"',
    '"Unisex"',
    '"Gris"',
    '"M, L, XL"',
    '"1, 2, 1"',
    '"Disponible"',
    '"NO"',
    '"Blazer oversize con solapa clásica y forro interior de satén."',
    '"https://images.unsplash.com/photo-1591047139829-d91aecb6caea"',
  ].join(",");

  const sample3 = [
    "",
    '"Top Satin Noche"',
    "29000",
    "34000",
    '"Tops"',
    '"Mujer"',
    '"Negro"',
    '"ÚNICO"',
    "4",
    '"Disponible"',
    '"NO"',
    '"Top lencero de satén con breteles finos regulables."',
    "",
  ].join(",");

  // Incluir BOM UTF-8 (\uFEFF) para máxima compatibilidad con Microsoft Excel en español
  return `\uFEFF${header}\n${sample1}\n${sample2}\n${sample3}\n`;
}

/**
 * Parsea una línea CSV respetando comillas y delimitadores (coma o punto y coma).
 */
export function parseCsvLine(line: string, delimiter: string = ","): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++; // Saltar escape
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parsea y valida el contenido de la planilla CSV.
 */
export function parseAndValidateImport(
  content: string,
  categories: { id: number; name: string; slug: string }[]
): {
  items: ValidatedImportItem[];
  summary: {
    totalRows: number;
    validCount: number;
    warningCount: number;
    errorCount: number;
  };
} {
  // Limpiar BOM si existe
  const cleanContent = content.startsWith("\uFEFF")
    ? content.slice(1)
    : content;

  const rawLines = cleanContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) {
    return {
      items: [],
      summary: { totalRows: 0, validCount: 0, warningCount: 0, errorCount: 0 },
    };
  }

  // Detectar delimitador (coma o punto y coma) en el encabezado
  const firstLine = rawLines[0];
  const delimiter =
    (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length
      ? ";"
      : ",";

  const headers = parseCsvLine(firstLine, delimiter).map((h) =>
    h.toLowerCase().replace(/[\s_-]/g, "")
  );

  const getColIndex = (colName: string): number => {
    const normalized = colName.toLowerCase().replace(/[\s_-]/g, "");
    return headers.indexOf(normalized);
  };

  const idxMap = {
    codigo: getColIndex("codigo"),
    nombre: getColIndex("nombre"),
    precio: getColIndex("precio"),
    precio_anterior: getColIndex("precioanterior"),
    categoria: getColIndex("categoria"),
    para: getColIndex("para"),
    colores: getColIndex("colores"),
    talles: getColIndex("talles"),
    stock: getColIndex("stock"),
    estado: getColIndex("estado"),
    destacado: getColIndex("destacado"),
    descripcion: getColIndex("descripcion"),
    imagenes: getColIndex("imagenes"),
  };

  const items: ValidatedImportItem[] = [];

  // Limitar a máximo 500 filas de productos
  const dataLines = rawLines.slice(1, 501);

  dataLines.forEach((line, index) => {
    const rowNumber = index + 2; // +2 por 1-based y fila de encabezado
    const cols = parseCsvLine(line, delimiter);
    const getVal = (colIdx: number): string =>
      colIdx >= 0 && colIdx < cols.length ? cols[colIdx] : "";

    const rawCodigo = getVal(idxMap.codigo);
    const rawNombre = getVal(idxMap.nombre);
    const rawPrecio = getVal(idxMap.precio);
    const rawPrecioAnterior = getVal(idxMap.precio_anterior);
    const rawCategoria = getVal(idxMap.categoria);
    const rawPara = getVal(idxMap.para);
    const rawColores = getVal(idxMap.colores);
    const rawTalles = getVal(idxMap.talles);
    const rawStock = getVal(idxMap.stock);
    const rawEstado = getVal(idxMap.estado);
    const rawDestacado = getVal(idxMap.destacado);
    const rawDescripcion = getVal(idxMap.descripcion);
    const rawImagenes = getVal(idxMap.imagenes);

    const errors: ImportError[] = [];

    // 1. Nombre (Obligatorio)
    const title = rawNombre.trim();
    if (!title) {
      errors.push({
        column: "nombre",
        message: "El nombre de la pieza es obligatorio.",
        severity: "ERROR",
      });
    }

    // 2. Precio
    let priceCents: number | null = null;
    const cleanPrice = rawPrecio.replace(/[\$\s]/g, "").replace(/,/g, ".");
    if (!cleanPrice || cleanPrice.toLowerCase() === "consultar") {
      priceCents = null;
    } else {
      const num = parseFloat(cleanPrice);
      if (Number.isNaN(num) || num < 0) {
        errors.push({
          column: "precio",
          message: "El precio debe ser un número positivo.",
          severity: "ERROR",
        });
      } else {
        priceCents = Math.round(num * 100);
      }
    }

    // 3. Precio Anterior
    let compareAtPriceCents: number | null = null;
    if (rawPrecioAnterior) {
      const cleanCompare = rawPrecioAnterior
        .replace(/[\$\s]/g, "")
        .replace(/,/g, ".");
      const num = parseFloat(cleanCompare);
      if (!Number.isNaN(num) && num > 0) {
        compareAtPriceCents = Math.round(num * 100);
      }
    }

    // 4. Categoría
    const catName = rawCategoria.trim() || "Sin clasificar";
    const foundCat = categories.find(
      (c) =>
        c.name.toLowerCase() === catName.toLowerCase() ||
        c.slug.toLowerCase() === catName.toLowerCase()
    );

    let categoryId = foundCat?.id;
    if (!foundCat && catName !== "Sin clasificar") {
      errors.push({
        column: "categoria",
        message: `La categoría "${catName}" se creará automáticamente.`,
        severity: "WARNING",
      });
    }

    // 5. Variantes de Colores, Talles y Stock (Correspondencia posicional - ADM-04)
    const colorsList = rawColores
      ? rawColores
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : ["Único"];

    const tallesList = rawTalles
      ? rawTalles
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : ["ÚNICO"];

    const stockTokens = rawStock
      ? rawStock
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const sizesWithStock: Array<{ size: string; stock: number }> = [];

    if (tallesList.length === 1 && stockTokens.length <= 1) {
      const parsedStock =
        stockTokens.length > 0 ? parseInt(stockTokens[0], 10) : 1;
      sizesWithStock.push({
        size: tallesList[0],
        stock: Number.isNaN(parsedStock) ? 1 : Math.max(0, parsedStock),
      });
    } else {
      // Correspondencia posicional: talles: S, M, L y stock: 2, 3, 1
      tallesList.forEach((sizeName, sIdx) => {
        let parsedStock = 1;
        if (sIdx < stockTokens.length) {
          const val = parseInt(stockTokens[sIdx], 10);
          parsedStock = Number.isNaN(val) ? 0 : Math.max(0, val);
        } else if (stockTokens.length === 1) {
          // Si especificó 1 solo stock pero múltiples talles, distribuye ese valor
          const val = parseInt(stockTokens[0], 10);
          parsedStock = Number.isNaN(val) ? 1 : Math.max(0, val);
        } else {
          errors.push({
            column: "stock",
            message: `Falta stock para el talle "${sizeName}". Se asignará stock 0.`,
            severity: "WARNING",
          });
          parsedStock = 0;
        }

        sizesWithStock.push({
          size: sizeName,
          stock: parsedStock,
        });
      });
    }

    const processedColors: ProcessedVariant[] = colorsList.map((colName) => ({
      name: colName,
      sizes: [...sizesWithStock],
    }));

    // 6. Atributos
    const attributesRecord: Record<string, string> = {};
    if (rawPara.trim()) {
      attributesRecord.para = rawPara.trim();
    }

    // 7. Estado
    const normEstado = rawEstado.trim().toLowerCase();
    const status: "AVAILABLE" | "RESERVED" =
      normEstado === "reservado" || normEstado === "reserved"
        ? "RESERVED"
        : "AVAILABLE";

    // 8. Destacado
    const normDestacado = rawDestacado.trim().toLowerCase();
    const isFeatured =
      normDestacado === "si" ||
      normDestacado === "sí" ||
      normDestacado === "true" ||
      normDestacado === "1";

    // 9. Imágenes
    const photoUrls = rawImagenes
      ? rawImagenes
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url.startsWith("http://") || url.startsWith("https://"))
      : [];

    // Determinación de estado de la fila
    const hasErrors = errors.some((e) => e.severity === "ERROR");
    const hasWarnings = errors.some((e) => e.severity === "WARNING");
    const rowStatus = hasErrors ? "ERROR" : hasWarnings ? "WARNING" : "VALID";

    let codeNum: number | undefined;
    if (rawCodigo.trim()) {
      const parsed = parseInt(rawCodigo.replace(/#/g, "").trim(), 10);
      if (!Number.isNaN(parsed)) codeNum = parsed;
    }

    items.push({
      rowNumber,
      code: codeNum,
      title,
      priceCents,
      compareAtPriceCents,
      categoryName: catName,
      categoryId,
      attributes: attributesRecord,
      colors: processedColors,
      status,
      isFeatured,
      description: rawDescripcion.trim(),
      photoUrls,
      rowStatus,
      errors,
    });
  });

  const validCount = items.filter((i) => i.rowStatus === "VALID").length;
  const warningCount = items.filter((i) => i.rowStatus === "WARNING").length;
  const errorCount = items.filter((i) => i.rowStatus === "ERROR").length;

  return {
    items,
    summary: {
      totalRows: items.length,
      validCount,
      warningCount,
      errorCount,
    },
  };
}

