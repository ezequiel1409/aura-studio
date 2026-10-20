import { describe, expect, it } from "vitest";
import {
  generateTemplateCsv,
  parseAndValidateImport,
  parseCsvLine,
} from "../src/lib/parser/import-template";

describe("ADM-04: Plantilla e Importación Masiva de Productos", () => {
  const mockCategories = [
    { id: 1, name: "Vestidos", slug: "vestidos" },
    { id: 2, name: "Sastrería", slug: "sastreria" },
    { id: 3, name: "Sin clasificar", slug: "sin-clasificar" },
  ];

  it("genera plantilla CSV con UTF-8 BOM y columnas idénticas al formulario", () => {
    const csv = generateTemplateCsv();
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("codigo,nombre,precio,precio_anterior,categoria,para,colores,talles,stock,estado,destacado,descripcion,imagenes");
    expect(csv).toContain("Vestido Lino Siena");
    expect(csv).toContain("S, M, L");
    expect(csv).toContain("2, 3, 1");
  });

  it("parsea líneas CSV respetando comillas y delimitadores", () => {
    const line = ',"Vestido Lino",48000,,"Vestidos","Mujer","Blanco, Negro","S, M","2, 3"';
    const cols = parseCsvLine(line);
    expect(cols[1]).toBe("Vestido Lino");
    expect(cols[2]).toBe("48000");
    expect(cols[6]).toBe("Blanco, Negro");
    expect(cols[7]).toBe("S, M");
    expect(cols[8]).toBe("2, 3");
  });

  it("valida correspondencia posicional exacta de talles y stock (ADM-04)", () => {
    const csv = `codigo,nombre,precio,precio_anterior,categoria,para,colores,talles,stock,estado,destacado,descripcion,imagenes
,"Pantalón Sastrero",52000,,"Sastrería","Mujer","Negro, Beige","S, M, L","2, 3, 1","Disponible","SI","Pantalón tiro alto",`;

    const { items, summary } = parseAndValidateImport(csv, mockCategories);
    expect(summary.totalRows).toBe(1);
    expect(summary.validCount).toBe(1);
    expect(summary.errorCount).toBe(0);

    const item = items[0];
    expect(item.title).toBe("Pantalón Sastrero");
    expect(item.priceCents).toBe(5200000);
    expect(item.colors).toHaveLength(2);
    expect(item.colors[0].name).toBe("Negro");
    expect(item.colors[0].sizes).toEqual([
      { size: "S", stock: 2 },
      { size: "M", stock: 3 },
      { size: "L", stock: 1 },
    ]);
    expect(item.colors[1].name).toBe("Beige");
    expect(item.colors[1].sizes).toEqual([
      { size: "S", stock: 2 },
      { size: "M", stock: 3 },
      { size: "L", stock: 1 },
    ]);
    expect(item.isFeatured).toBe(true);
    expect(item.status).toBe("AVAILABLE");
    expect(item.attributes.para).toBe("Mujer");
  });

  it("detecta errores por fila y columna ante campos obligatorios faltantes", () => {
    const csv = `codigo,nombre,precio,precio_anterior,categoria,para,colores,talles,stock,estado,destacado,descripcion,imagenes
,"",invalido,,"Vestidos",,,,,,,,`;

    const { items, summary } = parseAndValidateImport(csv, mockCategories);
    expect(summary.totalRows).toBe(1);
    expect(summary.errorCount).toBe(1);

    const item = items[0];
    expect(item.rowStatus).toBe("ERROR");
    expect(item.errors.some((e) => e.column === "nombre")).toBe(true);
    expect(item.errors.some((e) => e.column === "precio")).toBe(true);
  });

  it("emite advertencia cuando una categoría no existe para auto-crearla", () => {
    const csv = `codigo,nombre,precio,precio_anterior,categoria,para,colores,talles,stock,estado,destacado,descripcion,imagenes
,"Camisa Poplin",38000,,"Camisería",,,,,,,,`;

    const { items, summary } = parseAndValidateImport(csv, mockCategories);
    expect(summary.warningCount).toBe(1);
    const item = items[0];
    expect(item.rowStatus).toBe("WARNING");
    expect(item.errors.some((e) => e.column === "categoria" && e.severity === "WARNING")).toBe(true);
  });
});

