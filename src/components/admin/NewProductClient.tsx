"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Category } from "../../domain/category/types";
import { parseProductText, parseSizesList } from "../../lib/parser/product-parser";
import { compressImageInBrowser } from "../../lib/images/compress";

interface NewProductClientProps {
  categories: Category[];
}

interface ColorState {
  id: string;
  name: string;
  sizes: Array<{
    id: string;
    size: string;
    stock: number;
  }>;
}

interface PhotoPreview {
  id: string;
  file: File;
  keyThumb: string;
  keyFull: string;
}

export function NewProductClient({ categories }: NewProductClientProps) {
  // Estado del texto crudo (BR-05)
  const [rawText, setRawText] = useState("");

  // Estado de fotos (BR-07)
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [compressing, setCompressing] = useState(false);

  // Campos propuestos / editables (BR-26)
  const [title, setTitle] = useState("");
  const [pricePesos, setPricePesos] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);

  // Variantes de color y talles (BR-20)
  const [colors, setColors] = useState<ColorState[]>([
    {
      id: "default-col",
      name: "Único",
      sizes: [{ id: "default-sz", size: "ÚNICO", stock: 1 }],
    },
  ]);

  // Banderas de modificación manual por la admin (BR-26, BR-33)
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false);
  const [categoryManuallyEdited, setCategoryManuallyEdited] = useState(false);
  const [variantsManuallyEdited, setVariantsManuallyEdited] = useState(false);

  // Estado de publicación
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishedProduct, setPublishedProduct] = useState<{
    id: number;
    code: number;
    title: string | null;
  } | null>(null);

  // Buscar categoría "Sin clasificar" por defecto (BR-19)
  useEffect(() => {
    if (selectedCategoryId === 0 && categories.length > 0) {
      const uncategorized = categories.find((c) => c.slug === "sin-clasificar");
      if (uncategorized) {
        setSelectedCategoryId(uncategorized.id);
      } else {
        setSelectedCategoryId(categories[0].id);
      }
    }
  }, [categories, selectedCategoryId]);

  // Al escribir en el texto libre, correr parser en vivo (BR-05, BR-26)
  useEffect(() => {
    if (!rawText.trim()) return;

    const parsed = parseProductText(rawText);

    // Sugerir título si la admin no lo editó a mano
    if (!titleManuallyEdited && parsed.title) {
      setTitle(parsed.title);
    }

    // Sugerir precio si la admin no lo editó a mano
    if (!priceManuallyEdited && parsed.priceCents !== null) {
      setPricePesos(String(parsed.priceCents / 100));
    }

    // Sugerir categoría si la admin no la cambió a mano
    if (!categoryManuallyEdited && parsed.suggestedCategorySlug) {
      const match = categories.find((c) => c.slug === parsed.suggestedCategorySlug);
      if (match) {
        setSelectedCategoryId(match.id);
      }
    }

    // Sugerir talles si no fueron modificados a mano
    if (!variantsManuallyEdited && parsed.size) {
      const parsedSizes = parseSizesList(parsed.size);
      if (parsedSizes.length > 0) {
        setColors([
          {
            id: "auto-col",
            name: "Único",
            sizes: parsedSizes.map((s, idx) => ({
              id: `auto-sz-${idx}`,
              size: s,
              stock: 1,
            })),
          },
        ]);
      }
    }
  }, [
    rawText,
    titleManuallyEdited,
    priceManuallyEdited,
    categoryManuallyEdited,
    variantsManuallyEdited,
    categories,
  ]);

  // Manejo de carga y compresión en cliente de fotos (BR-07)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressing(true);
    setErrorMessage(null);

    try {
      const newPhotos: PhotoPreview[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Comprimir en WebP sin EXIF
        const compressed = await compressImageInBrowser(file);
        newPhotos.push({
          id: `${Date.now()}-${i}`,
          file,
          keyThumb: compressed.keyThumb,
          keyFull: compressed.keyFull,
        });
      }
      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch {
      setErrorMessage("Hubo un error al optimizar una o más fotos.");
    } finally {
      setCompressing(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Ajustes de Stock táctiles (+ / -) (BR-26)
  const updateStock = (colorId: string, sizeId: string, delta: number) => {
    setVariantsManuallyEdited(true);
    setColors((prev) =>
      prev.map((col) => {
        if (col.id !== colorId) return col;
        return {
          ...col,
          sizes: col.sizes.map((s) => {
            if (s.id !== sizeId) return s;
            const newStock = Math.max(0, s.stock + delta);
            return { ...s, stock: newStock };
          }),
        };
      })
    );
  };

  const updateSizeName = (colorId: string, sizeId: string, newSize: string) => {
    setVariantsManuallyEdited(true);
    setColors((prev) =>
      prev.map((col) => {
        if (col.id !== colorId) return col;
        return {
          ...col,
          sizes: col.sizes.map((s) => (s.id === sizeId ? { ...s, size: newSize.toUpperCase() } : s)),
        };
      })
    );
  };

  const addSizeToColor = (colorId: string, defaultSizeName = "NUEVO") => {
    setVariantsManuallyEdited(true);
    setColors((prev) =>
      prev.map((col) => {
        if (col.id !== colorId) return col;
        return {
          ...col,
          sizes: [
            ...col.sizes,
            { id: `sz-${Date.now()}-${Math.random()}`, size: defaultSizeName, stock: 1 },
          ],
        };
      })
    );
  };

  const removeSizeFromColor = (colorId: string, sizeId: string) => {
    setVariantsManuallyEdited(true);
    setColors((prev) =>
      prev.map((col) => {
        if (col.id !== colorId) return col;
        if (col.sizes.length <= 1) return col; // al menos 1 talle
        return {
          ...col,
          sizes: col.sizes.filter((s) => s.id !== sizeId),
        };
      })
    );
  };

  const addAnotherColor = () => {
    setVariantsManuallyEdited(true);
    setColors((prev) => [
      ...prev,
      {
        id: `col-${Date.now()}`,
        name: `Color ${prev.length + 1}`,
        sizes: [{ id: `sz-${Date.now()}`, size: "ÚNICO", stock: 1 }],
      },
    ]);
  };

  const removeColor = (colorId: string) => {
    if (colors.length <= 1) return;
    setVariantsManuallyEdited(true);
    setColors((prev) => prev.filter((c) => c.id !== colorId));
  };

  const updateColorName = (colorId: string, newName: string) => {
    setVariantsManuallyEdited(true);
    setColors((prev) =>
      prev.map((c) => (c.id === colorId ? { ...c, name: newName } : c))
    );
  };

  // Envío de publicación (BR-05, BR-26)
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const priceCents = pricePesos.trim()
        ? Math.round(parseFloat(pricePesos.replace(/,/g, ".")) * 100)
        : null;

      const payload = {
        rawText,
        title: title.trim() || null,
        priceCents,
        currency: "ARS",
        categoryId: selectedCategoryId,
        colors: colors.map((c, cIdx) => ({
          name: c.name.trim() || "Único",
          position: cIdx,
          sizes: c.sizes.map((s) => ({
            size: s.size.trim() || "ÚNICO",
            stock: s.stock,
          })),
        })),
        photos: photos.map((p, idx) => ({
          keyThumb: p.keyThumb,
          keyFull: p.keyFull,
          position: idx,
        })),
      };

      const res = await fetch("/api/admin/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al publicar la prenda");
      }

      setPublishedProduct({
        id: data.product.id,
        code: data.product.code,
        title: data.product.title || "Prenda sin título",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido al publicar";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setRawText("");
    setPhotos([]);
    setTitle("");
    setPricePesos("");
    setColors([
      {
        id: "default-col",
        name: "Único",
        sizes: [{ id: "default-sz", size: "ÚNICO", stock: 1 }],
      },
    ]);
    setTitleManuallyEdited(false);
    setPriceManuallyEdited(false);
    setCategoryManuallyEdited(false);
    setVariantsManuallyEdited(false);
    setPublishedProduct(null);
    setErrorMessage(null);
  };

  // Pantalla de confirmación de publicación (BR-26, backoffice.md)
  if (publishedProduct) {
    const codeFormatted = `#${String(publishedProduct.code).padStart(3, "0")}`;
    return (
      <div className="max-w-xl mx-auto py-8 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-700/80 text-emerald-300 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/30">
          <CheckCircle2 size={36} />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Publicación Exitosa (BR-26)
          </span>
          <h2 className="font-serif text-3xl font-bold text-zinc-100 mt-1">
            Prenda {codeFormatted} publicada
          </h2>
          <p className="text-zinc-400 text-sm mt-2">
            "{publishedProduct.title}" ya está disponible y visible en el showroom.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <a
            href={`/p/${String(publishedProduct.code).padStart(3, "0")}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-200 text-zinc-950 font-semibold text-sm hover:bg-amber-100 transition-all shadow-md"
          >
            <span>Ver en la tienda</span>
            <ExternalLink size={16} />
          </a>

          <Link
            href="/admin/productos"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 font-semibold text-sm hover:bg-zinc-800 transition-all"
          >
            <span>Ver en lista de prendas</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-zinc-800">
          <button
            onClick={handleResetForm}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-200 transition-colors"
          >
            <RotateCcw size={16} />
            <span>Cargar otra prenda</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botón Volver & Título */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-100">
            Cargar Nueva Prenda
          </h1>
          <p className="text-xs text-zinc-400">
            Pegá fotos y texto. El sistema propone los datos y confirmás con un toque (BR-05, BR-26).
          </p>
        </div>
      </div>

      <form onSubmit={handlePublish} className="space-y-6">
        {/* Paso 1: Subir Fotos en el Navegador (BR-07) */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Camera size={16} className="text-amber-300" />
              <span>Fotos de la prenda (BR-07)</span>
            </label>
            <span className="text-[11px] text-zinc-500">
              WebP optimizado sin EXIF
            </span>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Miniaturas subidas */}
            {photos.map((p, idx) => (
              <div
                key={p.id}
                className="relative w-20 h-24 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 group"
              >
                <img
                  src={p.keyThumb}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(p.id)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-red-400 transition-colors"
                  title="Eliminar foto"
                >
                  <X size={12} />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-900/90 text-amber-200">
                    Portada
                  </span>
                )}
              </div>
            ))}

            {/* Botón de Agregar Fotos */}
            <label className="w-20 h-24 rounded-xl border-2 border-dashed border-zinc-700 hover:border-amber-400/70 bg-zinc-950/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-zinc-400 hover:text-amber-200">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={compressing}
                className="hidden"
              />
              {compressing ? (
                <Loader2 size={18} className="animate-spin text-amber-300" />
              ) : (
                <>
                  <Upload size={18} />
                  <span className="text-[10px] font-medium">+ Fotos</span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Paso 2: Bloque Único de Texto Libre (BR-05) */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <label
            htmlFor="rawText"
            className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2"
          >
            <Sparkles size={16} className="text-amber-300" />
            <span>Texto libre original (BR-05)</span>
          </label>
          <textarea
            id="rawText"
            rows={3}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Pegá la descripción aquí... Ej: Remera Boxy fit de algodón negra y crudo talles S y M $22.500"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-all font-sans leading-relaxed"
            required
          />
          <p className="text-[11px] text-zinc-500">
            Se guarda siempre el texto crudo. El parser interpreta automáticamente título, precio, categoría y variantes.
          </p>
        </div>

        {/* Paso 3: Vista Previa Táctil y Ajustes Rápidos (BR-26) */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Vista Previa de Publicación (BR-26)
            </h2>
            <span className="text-[11px] text-zinc-400">
              Ajustá o confirmá con un toque
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Título */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Título propuesto
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitleManuallyEdited(true);
                  setTitle(e.target.value);
                }}
                placeholder="Título de la prenda"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Precio en Pesos */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Precio (ARS)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-500 text-sm">$</span>
                <input
                  type="number"
                  step="any"
                  value={pricePesos}
                  onChange={(e) => {
                    setPriceManuallyEdited(true);
                    setPricePesos(e.target.value);
                  }}
                  placeholder="Vacío = 'Consultar precio'"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Categoría */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Categoría
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setCategoryManuallyEdited(true);
                  setSelectedCategoryId(Number(e.target.value));
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.slug === "sin-clasificar" ? "(Por defecto)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Matriz Táctil de Colores, Talles y Stock (BR-20, BR-26) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                Matriz de Colores y Stock por Talle
              </span>
              <button
                type="button"
                onClick={addAnotherColor}
                className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 font-medium"
              >
                <Plus size={14} />
                <span>+ Color</span>
              </button>
            </div>

            <div className="space-y-3">
              {colors.map((col) => (
                <div
                  key={col.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
                >
                  {/* Fila del Color */}
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => updateColorName(col.id, e.target.value)}
                      placeholder="Nombre del color (ej: Negro)"
                      className="bg-transparent border-b border-zinc-700 focus:border-amber-400 text-sm font-semibold text-zinc-100 px-1 py-0.5 focus:outline-none"
                    />

                    {colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColor(col.id)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                        title="Eliminar este color"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Talles con botones táctiles + / - */}
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {col.sizes.map((sz) => (
                      <div
                        key={sz.id}
                        className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1.5 shadow-sm"
                      >
                        <input
                          type="text"
                          value={sz.size}
                          onChange={(e) => updateSizeName(col.id, sz.id, e.target.value)}
                          className="w-12 text-center text-xs font-bold text-amber-200 bg-transparent focus:outline-none"
                        />

                        {/* Controles táctiles de stock */}
                        <div className="flex items-center gap-1 bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
                          <button
                            type="button"
                            onClick={() => updateStock(col.id, sz.id, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-100 active:bg-zinc-800 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-bold text-zinc-100">
                            {sz.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateStock(col.id, sz.id, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-100 active:bg-zinc-800 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {col.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSizeFromColor(col.id, sz.id)}
                            className="text-zinc-600 hover:text-zinc-400 p-0.5"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Botón rápido para sumar talle a este color */}
                    <button
                      type="button"
                      onClick={() => addSizeToColor(col.id, "M")}
                      className="px-2.5 py-1.5 rounded-xl border border-dashed border-zinc-700 text-zinc-400 hover:text-amber-200 text-xs flex items-center gap-1 hover:border-amber-400/50 transition-colors"
                    >
                      <Plus size={12} />
                      <span>Talle</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Botón Principal de Publicación (BR-26) */}
        <div className="sticky bottom-4 z-20 pt-2">
          <button
            type="submit"
            disabled={submitting || !rawText.trim()}
            className="w-full py-3.5 px-6 rounded-2xl bg-amber-200 hover:bg-amber-100 active:scale-[0.98] text-zinc-950 font-bold text-base transition-all shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Publicando prenda...</span>
              </>
            ) : (
              <>
                <span>Publicar Prenda</span>
                <Check size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
