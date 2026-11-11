"use client";

import { useEffect, useState } from "react";
import { Check, Hash, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";

export interface ColorState {
  id: string;
  name: string;
  hexCode?: string | null;
  sizes: Array<{
    id: string;
    size: string;
    stock: number;
  }>;
}

export type SizeSystemId =
  | "clothing_adult"
  | "clothing_kids"
  | "pants"
  | "numeric"
  | "shoes_adult"
  | "shoes_kids"
  | "single"
  | "range_generator"
  | "custom";

export interface SizeSystem {
  id: SizeSystemId;
  label: string;
  icon: string;
  sizes: string[];
}

export const EXTENDED_SIZE_SYSTEMS: SizeSystem[] = [
  {
    id: "clothing_adult",
    label: "Ropa Adulto (XS-3XL)",
    icon: "👚",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  },
  {
    id: "clothing_kids",
    label: "Ropa Niños (2 al 16)",
    icon: "🧸",
    sizes: ["2", "4", "6", "8", "10", "12", "14", "16"],
  },
  {
    id: "pants",
    label: "Pantalones / Jeans (34 a 54)",
    icon: "👖",
    sizes: ["34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54"],
  },
  {
    id: "numeric",
    label: "Talles 1 al 8 (o 1 a 5)",
    icon: "🔢",
    sizes: ["1", "2", "3", "4", "5", "6", "7", "8"],
  },
  {
    id: "shoes_adult",
    label: "Calzado Adulto (34 a 45)",
    icon: "👟",
    sizes: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  },
  {
    id: "shoes_kids",
    label: "Calzado Niños (18 a 34)",
    icon: "👶",
    sizes: [
      "18", "19", "20", "21", "22", "23", "24", "25",
      "26", "27", "28", "29", "30", "31", "32", "33", "34"
    ],
  },
  {
    id: "single",
    label: "Talle Único",
    icon: "✨",
    sizes: ["ÚNICO"],
  },
];

const COLOR_PRESETS = [
  { name: "Negro", hex: "#111111" },
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Borgoña", hex: "#670020" },
  { name: "Rosa Pastel", hex: "#FFC2E7" },
  { name: "Gris Melange", hex: "#9E9E9E" },
  { name: "Fucsia", hex: "#D81B60" },
  { name: "Azul Marino", hex: "#0F172A" },
  { name: "Verde Militar", hex: "#4B5320" },
  { name: "Lila", hex: "#C084FC" },
  { name: "Nude", hex: "#D7C4B7" },
];

interface StockVariantsStepProps {
  isSinglePiece: boolean;
  onToggleSinglePiece: (isSingle: boolean) => void;
  colors: ColorState[];
  onColorsChange: (colors: ColorState[]) => void;
  categoryName?: string;
}

export function StockVariantsStep({
  isSinglePiece,
  onToggleSinglePiece,
  colors,
  onColorsChange,
  categoryName = "",
}: StockVariantsStepProps) {
  const [selectedSystem, setSelectedSystem] = useState<SizeSystemId>(() => {
    const cat = categoryName.toLowerCase();
    if (cat.includes("niño") || cat.includes("bebe") || cat.includes("infantil") || cat.includes("chicos")) {
      if (cat.includes("calzado") || cat.includes("zapatilla") || cat.includes("zapato")) return "shoes_kids";
      return "clothing_kids";
    }
    if (cat.includes("calzado") || cat.includes("zapatilla") || cat.includes("zapato") || cat.includes("bota") || cat.includes("sandalia")) {
      return "shoes_adult";
    }
    if (cat.includes("pantalon") || cat.includes("jean") || cat.includes("denim") || cat.includes("short") || cat.includes("bermuda")) {
      return "pants";
    }
    return "clothing_adult";
  });

  // Generador de Rangos Numéricos libres (ej: de 1 a 5, de 20 a 30, etc.)
  const [rangeFrom, setRangeFrom] = useState("1");
  const [rangeTo, setRangeTo] = useState("5");
  const [rangeStep, setRangeStep] = useState<"1" | "2">("1");

  // Entrada libre rápida (separada por comas o espacios)
  const [quickPasteInput, setQuickPasteInput] = useState("");
  const [bulkStockVal, setBulkStockVal] = useState("1");

  // Input de talle libre por color
  const [addingCustomSizeForColorId, setAddingCustomSizeForColorId] = useState<string | null>(null);
  const [newCustomSizeValue, setNewCustomSizeValue] = useState("");

  // Sugerir sistema de talles si cambia la categoría
  useEffect(() => {
    const cat = categoryName.toLowerCase();
    if (cat.includes("niño") || cat.includes("bebe") || cat.includes("infantil") || cat.includes("chicos")) {
      if (cat.includes("calzado") || cat.includes("zapatilla") || cat.includes("zapato")) {
        setSelectedSystem("shoes_kids");
      } else {
        setSelectedSystem("clothing_kids");
      }
    } else if (cat.includes("calzado") || cat.includes("zapatilla") || cat.includes("zapato") || cat.includes("bota") || cat.includes("sandalia")) {
      setSelectedSystem("shoes_adult");
    } else if (cat.includes("pantalon") || cat.includes("jean") || cat.includes("denim") || cat.includes("short") || cat.includes("bermuda")) {
      setSelectedSystem("pants");
    }
  }, [categoryName]);

  // Talle actual en modo Pieza Única (80% de los casos)
  const currentSingleSize =
    colors[0]?.sizes[0]?.size?.trim().toUpperCase() || "ÚNICO";

  const handleSelectSingleSize = (sz: string) => {
    onColorsChange([
      {
        id: colors[0]?.id || "col-default",
        name: colors[0]?.name || "Único",
        hexCode: colors[0]?.hexCode || null,
        sizes: [{ id: "sz-single", size: sz.trim().toUpperCase(), stock: 1 }],
      },
    ]);
  };

  // Generar rango de talles numéricos (ej: 1 al 5, o 20 a 34 de niños)
  const handleGenerateNumericRange = (targetColorId?: string) => {
    const from = parseInt(rangeFrom, 10);
    const to = parseInt(rangeTo, 10);
    const step = parseInt(rangeStep, 10) || 1;

    if (isNaN(from) || isNaN(to) || from > to) {
      alert("Por favor ingresá un rango numérico válido (ej: Desde 1 Hasta 5)");
      return;
    }

    const generatedSizes: string[] = [];
    for (let i = from; i <= to; i += step) {
      generatedSizes.push(String(i));
    }

    if (isSinglePiece) {
      // En pieza única seleccionamos el primero del rango como default
      handleSelectSingleSize(generatedSizes[0] || "1");
    } else if (targetColorId) {
      // Agregar al color específico
      onColorsChange(
        colors.map((c) => {
          if (c.id !== targetColorId) return c;
          const existing = new Set(c.sizes.map((s) => s.size.toUpperCase()));
          const newOnes = generatedSizes
            .filter((s) => !existing.has(s.toUpperCase()))
            .map((s) => ({
              id: `sz_${s}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
              size: s,
              stock: 1,
            }));
          return { ...c, sizes: [...c.sizes, ...newOnes] };
        })
      );
    } else {
      // Aplicar a todos los colores
      onColorsChange(
        colors.map((c) => {
          const existing = new Set(c.sizes.map((s) => s.size.toUpperCase()));
          const newOnes = generatedSizes
            .filter((s) => !existing.has(s.toUpperCase()))
            .map((s) => ({
              id: `sz_${s}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
              size: s,
              stock: 1,
            }));
          return { ...c, sizes: [...c.sizes, ...newOnes] };
        })
      );
    }
  };

  // Parsear texto rápido pegado (ej: "36, 37, 38, 39" o "1 2 3 4 5")
  const handleApplyQuickPaste = (targetColorId?: string) => {
    const tokens = quickPasteInput
      .split(/[\s,]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    if (tokens.length === 0) return;

    if (isSinglePiece) {
      handleSelectSingleSize(tokens[0]);
      setQuickPasteInput("");
    } else if (targetColorId) {
      onColorsChange(
        colors.map((c) => {
          if (c.id !== targetColorId) return c;
          const existing = new Set(c.sizes.map((s) => s.size.toUpperCase()));
          const newOnes = tokens
            .filter((s) => !existing.has(s))
            .map((s) => ({
              id: `sz_${s}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
              size: s,
              stock: 1,
            }));
          return { ...c, sizes: [...c.sizes, ...newOnes] };
        })
      );
      setQuickPasteInput("");
    } else {
      onColorsChange(
        colors.map((c) => {
          const existing = new Set(c.sizes.map((s) => s.size.toUpperCase()));
          const newOnes = tokens
            .filter((s) => !existing.has(s))
            .map((s) => ({
              id: `sz_${s}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
              size: s,
              stock: 1,
            }));
          return { ...c, sizes: [...c.sizes, ...newOnes] };
        })
      );
      setQuickPasteInput("");
    }
  };

  // Al agregar un nuevo color, clona automáticamente los talles del primer color
  const handleAddColor = (presetName?: string, presetHex?: string) => {
    const baseSizes =
      colors[0]?.sizes.length > 0
        ? colors[0].sizes.map((s) => ({
            id: `sz_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            size: s.size,
            stock: 1,
          }))
        : [
            { id: `sz_s_${Date.now()}`, size: "S", stock: 1 },
            { id: `sz_m_${Date.now()}`, size: "M", stock: 1 },
            { id: `sz_l_${Date.now()}`, size: "L", stock: 1 },
          ];

    const newColor: ColorState = {
      id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: presetName || `Color ${colors.length + 1}`,
      hexCode: presetHex || "#111111",
      sizes: baseSizes,
    };
    onColorsChange([...colors, newColor]);
  };

  const handleRemoveColor = (colId: string) => {
    if (colors.length <= 1) return;
    onColorsChange(colors.filter((c) => c.id !== colId));
  };

  const handleColorNameChange = (colId: string, name: string) => {
    onColorsChange(colors.map((c) => (c.id === colId ? { ...c, name } : c)));
  };

  const handleColorHexChange = (colId: string, hexCode: string) => {
    onColorsChange(colors.map((c) => (c.id === colId ? { ...c, hexCode } : c)));
  };

  const handleAddSizeToColor = (colId: string, sizeName: string) => {
    const trimmed = sizeName.trim().toUpperCase();
    if (!trimmed) return;

    onColorsChange(
      colors.map((c) => {
        if (c.id !== colId) return c;
        if (c.sizes.some((s) => s.size.trim().toUpperCase() === trimmed)) {
          return c;
        }
        return {
          ...c,
          sizes: [
            ...c.sizes,
            {
              id: `sz_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              size: trimmed,
              stock: 1,
            },
          ],
        };
      })
    );
  };

  const handleRemoveSize = (colId: string, sizeId: string) => {
    onColorsChange(
      colors.map((c) => {
        if (c.id !== colId) return c;
        if (c.sizes.length <= 1) return c;
        return { ...c, sizes: c.sizes.filter((s) => s.id !== sizeId) };
      })
    );
  };

  const handleSizeNameChange = (colId: string, sizeId: string, newSizeName: string) => {
    onColorsChange(
      colors.map((c) => {
        if (c.id !== colId) return c;
        return {
          ...c,
          sizes: c.sizes.map((s) => (s.id === sizeId ? { ...s, size: newSizeName } : s)),
        };
      })
    );
  };

  const handleStockInputChange = (colId: string, sizeId: string, val: string) => {
    const num = val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0);
    onColorsChange(
      colors.map((c) => {
        if (c.id !== colId) return c;
        return {
          ...c,
          sizes: c.sizes.map((s) => (s.id === sizeId ? { ...s, stock: num } : s)),
        };
      })
    );
  };

  const handleApplyBulkStock = () => {
    const num = Math.max(0, parseInt(bulkStockVal, 10) || 1);
    onColorsChange(
      colors.map((c) => ({
        ...c,
        sizes: c.sizes.map((s) => ({ ...s, stock: num })),
      }))
    );
  };

  const currentSystemObj = EXTENDED_SIZE_SYSTEMS.find((s) => s.id === selectedSystem);
  const activeSizesList = currentSystemObj?.sizes || [];

  const totalStock = colors.reduce(
    (acc, c) => acc + c.sizes.reduce((sAcc, s) => sAcc + (s.stock || 0), 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* 1. SELECTOR DE SISTEMAS EXPANDIDOS + GENERADOR DE RANGOS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-zinc-300">
            Sistema de talles para este producto:
          </label>
          <span className="text-[10px] text-zinc-500">
            Tocá el rubro o generá un rango libre
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EXTENDED_SIZE_SYSTEMS.map((sys) => {
            const isSysActive = selectedSystem === sys.id;
            return (
              <button
                key={sys.id}
                type="button"
                onClick={() => setSelectedSystem(sys.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                  isSysActive
                    ? "bg-amber-400 text-zinc-950 border-amber-400 shadow-xs font-bold"
                    : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                <span>{sys.icon}</span>
                <span>{sys.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSelectedSystem("range_generator")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              selectedSystem === "range_generator"
                ? "bg-amber-400 text-zinc-950 border-amber-400 shadow-xs font-bold"
                : "bg-zinc-950 text-amber-300 border-amber-500/40 hover:bg-zinc-900"
            }`}
          >
            <Wand2 size={13} />
            <span>Generador de Rango</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSystem("custom")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              selectedSystem === "custom"
                ? "bg-amber-400 text-zinc-950 border-amber-400 shadow-xs font-bold"
                : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
            }`}
          >
            <Hash size={13} />
            <span>Pegar lista / Libre</span>
          </button>
        </div>
      </div>

      {/* MINI-PANEL: GENERADOR DE RANGO LIBRE (Ej: de 1 a 5, o 20 a 30) */}
      {selectedSystem === "range_generator" && (
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-amber-500/40 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Wand2 size={15} />
            <span>Generar rango numérico correlativo (Niños, Adultos o Talles 1 al 5):</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
            <span>Desde:</span>
            <input
              type="number"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              className="w-16 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-center font-mono font-bold text-zinc-100 focus:outline-none focus:border-amber-400"
            />
            <span>Hasta:</span>
            <input
              type="number"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              className="w-16 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-center font-mono font-bold text-zinc-100 focus:outline-none focus:border-amber-400"
            />
            <span>Salto:</span>
            <select
              value={rangeStep}
              onChange={(e) => setRangeStep(e.target.value as "1" | "2")}
              className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
            >
              <option value="1">De a 1 (1, 2, 3, 4, 5...)</option>
              <option value="2">De a 2 (36, 38, 40, 42...)</option>
            </select>

            <button
              type="button"
              onClick={() => handleGenerateNumericRange()}
              className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold transition-colors cursor-pointer shadow-xs"
            >
              Generar talles
            </button>
          </div>
        </div>
      )}

      {/* MINI-PANEL: PEGAR LISTA RÁPIDA (Ej: "35, 36, 37, 38" o "1 2 3 4 5") */}
      {selectedSystem === "custom" && (
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 animate-in fade-in duration-150">
          <label className="block text-xs font-bold text-zinc-200">
            Pegá o escribí varios talles separados por coma o espacio:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={quickPasteInput}
              onChange={(e) => setQuickPasteInput(e.target.value)}
              placeholder="Ej: 36, 37, 38, 39, 40  o  1 2 3 4 5  o  S, M, L..."
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyQuickPaste();
                }
              }}
            />
            <button
              type="button"
              onClick={() => handleApplyQuickPaste()}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs cursor-pointer"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* 2. MODO PIEZA ÚNICA (80% DEL INVENTARIO) */}
      {isSinglePiece ? (
        <div className="space-y-3 pt-1">
          <div>
            <span className="block text-xs font-bold text-zinc-200 mb-1">
              Seleccioná el talle de la prenda:
            </span>
            <p className="text-[11px] text-zinc-400">
              Modo 1 sola unidad en inventario. Tocá el talle para asignarlo en 1 segundo.
            </p>
          </div>

          {/* Grilla de Chips con Touch Target >= 44px */}
          {selectedSystem !== "range_generator" && selectedSystem !== "custom" && (
            <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {activeSizesList.map((sz) => {
                const isSelected = currentSingleSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSelectSingleSize(sz)}
                    className={`min-h-[46px] rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center border cursor-pointer ${
                      isSelected
                        ? "bg-amber-400 text-zinc-950 border-amber-400 shadow-md ring-2 ring-amber-400/40"
                        : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <Check size={15} />
              <span>
                Pieza lista: <strong>Talle {currentSingleSize}</strong> · 1 unidad en stock
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onToggleSinglePiece(false);
                if (
                  colors[0]?.sizes.length === 1 &&
                  colors[0].sizes[0].size === "ÚNICO" &&
                  activeSizesList.length > 0
                ) {
                  onColorsChange([
                    {
                      ...colors[0],
                      sizes: activeSizesList.slice(0, 4).map((s) => ({
                        id: `sz_${s}_${Date.now()}`,
                        size: s,
                        stock: 1,
                      })),
                    },
                  ]);
                }
              }}
              className="text-xs font-medium text-amber-300 hover:underline self-start sm:self-auto cursor-pointer"
            >
              + ¿Tiene múltiples colores o talles?
            </button>
          </div>
        </div>
      ) : (
        /* 3. MODO VARIANTES Y STOCK MULTI-UNIDAD (20% DEL INVENTARIO) */
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div>
              <p className="text-xs font-bold text-zinc-200">
                Variantes de Color y Talle
              </p>
              <p className="text-[11px] text-zinc-400">
                Total acumulado: <strong className="text-amber-400 font-mono">{totalStock}</strong> unidades
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggleSinglePiece(true)}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              Volver a pieza única
            </button>
          </div>

          {/* Colores Rápidos */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 block">
              Agregar color frecuente:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleAddColor(p.name, p.hex)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-[11px] text-zinc-200 hover:text-white transition-colors cursor-pointer"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: p.hex }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Asignación Masiva de Stock */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" />
              <span className="text-xs text-zinc-300 font-medium">
                Asignar stock igual a todos los talles:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={bulkStockVal}
                onChange={(e) => setBulkStockVal(e.target.value)}
                className="w-14 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-center font-mono text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleApplyBulkStock}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Lista de Colores con Matriz de Talles Dinámicos */}
          <div className="space-y-3 pt-1">
            {colors.map((color) => (
              <div
                key={color.id}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1">
                    <input
                      type="color"
                      value={color.hexCode || "#111111"}
                      onChange={(e) => handleColorHexChange(color.id, e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      title="Muestra de color"
                    />
                    <input
                      type="text"
                      value={color.name}
                      onChange={(e) => handleColorNameChange(color.id, e.target.value)}
                      placeholder="Nombre del color..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-semibold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {colors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(color.id)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Eliminar este color"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Talles del Color: Chips Rápidos según el sistema activo */}
                <div className="space-y-2.5 pt-1 border-t border-zinc-900">
                  {activeSizesList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-zinc-400 mr-1">
                        + Talles:
                      </span>
                      {activeSizesList.map((szPreset) => (
                        <button
                          key={szPreset}
                          type="button"
                          onClick={() => handleAddSizeToColor(color.id, szPreset)}
                          className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400 text-zinc-300 hover:text-amber-300 font-mono text-[11px] font-bold transition-all cursor-pointer"
                          title={`Agregar talle ${szPreset}`}
                        >
                          +{szPreset}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          setAddingCustomSizeForColorId(
                            addingCustomSizeForColorId === color.id ? null : color.id
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-300 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        {addingCustomSizeForColorId === color.id ? "Cancelar" : "+ Otro talle"}
                      </button>
                    </div>
                  )}

                  {/* Input libre para agregar talle no convencional */}
                  {addingCustomSizeForColorId === color.id && (
                    <div className="flex gap-2 max-w-xs pt-1">
                      <input
                        type="text"
                        value={newCustomSizeValue}
                        onChange={(e) => setNewCustomSizeValue(e.target.value)}
                        placeholder="Talle (ej: 21, 38.5, Talle 2)..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 uppercase font-mono"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newCustomSizeValue.trim()) {
                              handleAddSizeToColor(color.id, newCustomSizeValue.trim());
                              setNewCustomSizeValue("");
                              setAddingCustomSizeForColorId(null);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCustomSizeValue.trim()) {
                            handleAddSizeToColor(color.id, newCustomSizeValue.trim());
                            setNewCustomSizeValue("");
                            setAddingCustomSizeForColorId(null);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 cursor-pointer"
                      >
                        Añadir
                      </button>
                    </div>
                  )}

                  {/* Grilla de Talles (Nombre EDITABLE en cada fila) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-1">
                    {color.sizes.map((sz) => (
                      <div
                        key={sz.id}
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-1.5"
                      >
                        {/* Nombre del talle EDITABLE */}
                        <input
                          type="text"
                          value={sz.size}
                          onChange={(e) =>
                            handleSizeNameChange(color.id, sz.id, e.target.value)
                          }
                          placeholder="Talle"
                          className="w-16 px-1.5 py-1 rounded bg-zinc-950 border border-zinc-700 text-center font-mono text-xs font-bold text-zinc-100 uppercase focus:outline-none focus:border-amber-400"
                          title="Clic para renombrar este talle"
                        />

                        {/* Unidades y Borrado */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-500 uppercase">Cant:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={sz.stock}
                            onChange={(e) =>
                              handleStockInputChange(color.id, sz.id, e.target.value)
                            }
                            className="w-12 px-1.5 py-1 rounded bg-zinc-950 border border-zinc-700 text-center font-mono text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                          />
                          {color.sizes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSize(color.id, sz.id)}
                              className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                              title="Quitar este talle"
                              aria-label={`Eliminar talle ${sz.size}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => handleAddColor()}
              className="w-full py-2.5 rounded-xl border border-dashed border-zinc-700 hover:border-amber-400 text-zinc-300 hover:text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Agregar otro color (hereda los talles actuales)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
