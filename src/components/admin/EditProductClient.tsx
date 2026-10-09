"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Category } from "../../domain/category/types";
import { Product, ProductStatus } from "../../domain/product/types";
import { compressImageInBrowser } from "../../lib/images/compress";
import { parseProductText } from "../../lib/parser/product-parser";

interface EditProductClientProps {
  product: Product;
  categories: Category[];
}

interface ColorState {
  id: string;
  name: string;
  hexCode?: string | null;
  sizes: Array<{
    id: string;
    size: string;
    stock: number;
  }>;
}

interface PhotoState {
  id: string;
  keyThumb: string;
  keyFull: string;
  isExisting: boolean;
}

export function EditProductClient({
  product,
  categories,
}: EditProductClientProps) {
  const router = useRouter();

  // Estado del texto crudo (BR-33)
  const [rawText, setRawText] = useState(product.rawText || "");

  // Campos principales
  const [title, setTitle] = useState(product.title || "");
  const [pricePesos, setPricePesos] = useState<string>(
    product.priceCents !== null ? String(product.priceCents / 100) : ""
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    product.categoryId
  );
  const [status, setStatus] = useState<ProductStatus>(product.status);

  // Variantes de color y talles (BR-20, BR-33)
  const [colors, setColors] = useState<ColorState[]>(() => {
    if (product.colors && product.colors.length > 0) {
      return product.colors.map((c, cIdx) => ({
        id: `c-${c.id || cIdx}`,
        name: c.name,
        hexCode: c.hexCode,
        sizes: (c.sizes || []).map((s, sIdx) => ({
          id: `s-${s.id || sIdx}`,
          size: s.size,
          stock: s.stock,
        })),
      }));
    }
    return [
      {
        id: "default-col",
        name: "Único",
        sizes: [{ id: "default-sz", size: "ÚNICO", stock: 1 }],
      },
    ];
  });

  // Fotos existentes y nuevas
  const [photos, setPhotos] = useState<PhotoState[]>(() => {
    return (product.photos || []).map((p, idx) => ({
      id: `photo-${p.id || idx}`,
      keyThumb: p.keyThumb,
      keyFull: p.keyFull,
      isExisting: true,
    }));
  });
  const [compressing, setCompressing] = useState(false);

  // Estado de guardado
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Categorías hoja disponibles para prendas (BR-15)
  const leafCategories = categories.filter((c) => {
    return !categories.some((child) => child.parentId === c.id);
  });

  // Re-interpretar texto crudo bajo demanda (BR-33)
  const handleReParseText = () => {
    if (!rawText.trim()) return;
    const parsed = parseProductText(rawText);

    // Solo actualiza campos que la administradora no haya marcado como manual
    const manualFields = new Set(product.manualFields || []);

    if (!manualFields.has("title") && parsed.title) {
      setTitle(parsed.title);
    }
    if (!manualFields.has("priceCents") && parsed.priceCents !== null) {
      setPricePesos(String(parsed.priceCents / 100));
    }
    if (!manualFields.has("categoryId") && parsed.suggestedCategorySlug) {
      const suggested = categories.find(
        (c) => c.slug === parsed.suggestedCategorySlug
      );
      if (suggested && leafCategories.some((leaf) => leaf.id === suggested.id)) {
        setSelectedCategoryId(suggested.id);
      }
    }
  };

  // Manejo de carga de fotos
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressing(true);
    setErrorMessage(null);

    try {
      const newPhotos: PhotoState[] = [];
      for (const file of Array.from(files)) {
        const compressed = await compressImageInBrowser(file);
        newPhotos.push({
          id: `new-${Date.now()}-${Math.random()}`,
          keyThumb: compressed.keyThumb,
          keyFull: compressed.keyFull,
          isExisting: false,
        });
      }
      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch {
      setErrorMessage("No se pudieron procesar algunas imágenes.");
    } finally {
      setCompressing(false);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Gestión de variantes
  const handleAddColor = () => {
    setColors((prev) => [
      ...prev,
      {
        id: `col-${Date.now()}`,
        name: `Color ${prev.length + 1}`,
        sizes: [{ id: `sz-${Date.now()}`, size: "ÚNICO", stock: 1 }],
      },
    ]);
  };

  const handleRemoveColor = (colId: string) => {
    if (colors.length <= 1) return;
    setColors((prev) => prev.filter((c) => c.id !== colId));
  };

  const handleColorNameChange = (colId: string, name: string) => {
    setColors((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, name } : c))
    );
  };

  const handleAddSize = (colId: string) => {
    setColors((prev) =>
      prev.map((c) => {
        if (c.id !== colId) return c;
        return {
          ...c,
          sizes: [
            ...c.sizes,
            { id: `sz-${Date.now()}-${Math.random()}`, size: "M", stock: 1 },
          ],
        };
      })
    );
  };

  const handleRemoveSize = (colId: string, sizeId: string) => {
    setColors((prev) =>
      prev.map((c) => {
        if (c.id !== colId) return c;
        if (c.sizes.length <= 1) return c;
        return {
          ...c,
          sizes: c.sizes.filter((s) => s.id !== sizeId),
        };
      })
    );
  };

  const handleStockChange = (colId: string, sizeId: string, delta: number) => {
    setColors((prev) =>
      prev.map((c) => {
        if (c.id !== colId) return c;
        return {
          ...c,
          sizes: c.sizes.map((s) => {
            if (s.id !== sizeId) return s;
            return { ...s, stock: Math.max(0, s.stock + delta) };
          }),
        };
      })
    );
  };

  const handleSizeNameChange = (
    colId: string,
    sizeId: string,
    sizeName: string
  ) => {
    setColors((prev) =>
      prev.map((c) => {
        if (c.id !== colId) return c;
        return {
          ...c,
          sizes: c.sizes.map((s) =>
            s.id === sizeId ? { ...s, size: sizeName } : s
          ),
        };
      })
    );
  };

  // Guardar cambios (BR-33)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      let priceCents: number | null = null;
      if (pricePesos.trim()) {
        const parsedPesos = parseFloat(pricePesos.replace(/,/g, "."));
        if (!Number.isNaN(parsedPesos) && parsedPesos >= 0) {
          priceCents = Math.round(parsedPesos * 100);
        }
      }

      const payload = {
        rawText,
        title: title.trim() || null,
        priceCents,
        categoryId: selectedCategoryId,
        status,
        colors: colors.map((c, cIdx) => ({
          name: c.name.trim() || "Único",
          hexCode: c.hexCode || null,
          position: cIdx,
          sizes: c.sizes.map((s) => ({
            size: s.size.trim() || "ÚNICO",
            stock: s.stock,
          })),
        })),
        photos: photos.map((p, pIdx) => ({
          keyThumb: p.keyThumb,
          keyFull: p.keyFull,
          position: pIdx,
        })),
      };

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar la prenda.");
      }

      setSavedSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const codeFormatted = `#${String(product.code).padStart(3, "0")}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Barra Superior de Navegación */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver a prendas</span>
        </Link>

        <a
          href={`/p/${String(product.code).padStart(3, "0")}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-amber-200 hover:text-amber-100 transition-colors"
        >
          <span>Ver ficha pública</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Cabecera del Editor */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-200/20 text-amber-300 border border-amber-300/30">
            {codeFormatted}
          </span>
          <span className="text-xs uppercase font-bold tracking-widest text-zinc-400">
            Edición Completa (BR-33)
          </span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-zinc-100 mt-1">
          {product.title || `Prenda ${codeFormatted}`}
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Modificá texto crudo, variantes de color, stock y fotos sin perder datos editados a mano.
        </p>
      </div>

      {/* Formulario Principal */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Sección: Texto Crudo Original (BR-05, BR-33) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Texto Crudo Original
            </label>
            <button
              type="button"
              onClick={handleReParseText}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-200 text-xs font-medium transition-colors"
              title="Volver a extraer datos sugeridos respetando tus correcciones manuales"
            >
              <Sparkles size={13} />
              <span>Reinterpretar texto (BR-33)</span>
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={4}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 font-sans focus:outline-none focus:border-amber-400 transition-all"
            placeholder="Pegá o editá la descripción cruda de la prenda..."
          />
          <p className="text-[11px] text-zinc-500">
            Al editar el texto crudo, podés pulsar &quot;Reinterpretar texto&quot; para proponer nuevos datos sin pisar lo que hayas corregido a mano.
          </p>
        </div>

        {/* Sección: Datos Básicos */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Datos Principales
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Título */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-zinc-400">Título de la Prenda</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Vestido Lino Estampado"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-all"
              />
            </div>

            {/* Precio en Pesos */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Precio en Pesos (ARS)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm text-zinc-500">$</span>
                <input
                  type="text"
                  value={pricePesos}
                  onChange={(e) => setPricePesos(e.target.value)}
                  placeholder="Ej: 45000 (vacío para 'Consultar')"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Categoría */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Categoría (Nodo Hoja)</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-all"
              >
                {leafCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-zinc-400">Estado de Publicación</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("AVAILABLE")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    status === "AVAILABLE"
                      ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  Disponible
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("RESERVED")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    status === "RESERVED"
                      ? "bg-amber-400 text-zinc-950 border-amber-300"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  Reservada
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("SOLD_OUT")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    status === "SOLD_OUT"
                      ? "bg-zinc-700 text-zinc-100 border-zinc-600"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  Agotada
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Variantes de Color y Stock por Talle (BR-20) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Colores, Talles y Stock (BR-20)
            </h2>
            <button
              type="button"
              onClick={handleAddColor}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-200 text-xs font-semibold transition-colors"
            >
              <Plus size={14} />
              <span>+ Color</span>
            </button>
          </div>

          <div className="space-y-4">
            {colors.map((c) => (
              <div
                key={c.id}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => handleColorNameChange(c.id, e.target.value)}
                    placeholder="Nombre del color (ej: Negro, Blanco)"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-semibold focus:outline-none focus:border-amber-400"
                  />

                  {colors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(c.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Eliminar este color"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Talles del Color */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Talles y stock disponible:</span>
                    <button
                      type="button"
                      onClick={() => handleAddSize(c.id)}
                      className="text-amber-200 hover:text-amber-100 font-medium inline-flex items-center gap-0.5"
                    >
                      <Plus size={12} />
                      <span>Agregar talle</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {c.sizes.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 bg-zinc-900/80 border border-zinc-800 rounded-lg p-2"
                      >
                        <input
                          type="text"
                          value={s.size}
                          onChange={(e) =>
                            handleSizeNameChange(c.id, s.id, e.target.value)
                          }
                          placeholder="Talle (S, M, 38)"
                          className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100 uppercase font-mono font-bold"
                        />

                        {/* Control de Stock +/- */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStockChange(c.id, s.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all"
                          >
                            <Minus size={13} />
                          </button>

                          <span className="w-8 text-center font-mono font-bold text-xs text-zinc-100">
                            {s.stock}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleStockChange(c.id, s.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {c.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(c.id, s.id)}
                            className="text-zinc-600 hover:text-rose-400 p-1 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección: Fotos de la Prenda (BR-07) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Fotos ({photos.length})
            </h2>

            <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-200 text-xs font-semibold cursor-pointer transition-colors">
              <Upload size={14} />
              <span>{compressing ? "Comprimiendo..." : "+ Subir fotos"}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={compressing}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {photos.map((p, idx) => (
              <div
                key={p.id}
                className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 group"
              >
                <img
                  src={p.keyThumb}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(p.id)}
                  className="absolute top-1 right-1 p-1 rounded-lg bg-zinc-950/80 text-zinc-400 hover:text-rose-400 opacity-80 group-hover:opacity-100 transition-all"
                  title="Eliminar foto"
                >
                  <Trash2 size={14} />
                </button>
                <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[9px] font-mono bg-zinc-950/80 text-zinc-300">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mensajes de Feedback */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {savedSuccess && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs">
            <CheckCircle2 size={16} />
            <span>Prenda actualizada con éxito.</span>
          </div>
        )}

        {/* Botón de Guardar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/productos"
            className="px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-xs font-semibold transition-all"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={saving || compressing}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-200 text-zinc-950 font-bold text-xs hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-amber-950/30"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
