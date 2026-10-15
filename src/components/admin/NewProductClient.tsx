"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
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

export interface FormErrorState {
  type: "BUSINESS" | "TECHNICAL";
  code: string;
  message: string;
  missingFields?: string[];
  details?: string;
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(() => {
    const uncategorized = categories.find((c) => c.slug === "sin-clasificar");
    return uncategorized ? uncategorized.id : (categories[0]?.id || 0);
  });

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

  // Estado de publicación y doble-submit lock
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);
  const [clientSubmissionId, setClientSubmissionId] = useState<string>(
    () => `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
  const [publishedProduct, setPublishedProduct] = useState<{
    id: number;
    code: number;
    title: string | null;
    duplicatePrevented?: boolean;
    notice?: string;
  } | null>(null);

  // Al escribir en el texto libre, correr parser en vivo (BR-05, BR-26)
  const handleRawTextChange = (text: string) => {
    setRawText(text);
    if (!text.trim()) return;

    const parsed = parseProductText(text);

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
  };

  // Manejo de carga y compresión en cliente de fotos (BR-07)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressing(true);
    setFormError(null);

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
    } catch (err: unknown) {
      setFormError({
        type: "TECHNICAL",
        code: "ERR_TECH_IMAGE_COMPRESSION",
        message: "Hubo un error al optimizar una o más fotos en el navegador.",
        details: err instanceof Error ? err.message : "Comprueba que los archivos sean imágenes válidas JPG, PNG o WebP.",
      });
    } finally {
      setCompressing(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Marcar una foto como portada (posición 0)
  const handleSetCoverPhoto = (index: number) => {
    if (index <= 0 || index >= photos.length) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
  };

  // Reordenar fotos en la galería (mover izquierda / derecha)
  const handleMovePhoto = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
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

  // Envío de publicación con protección anti-doble clic e idempotencia (BR-05, BR-26)
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || submittingRef.current) return;

    if (!rawText.trim()) {
      setFormError({
        type: "BUSINESS",
        code: "ERR_BUSINESS_MISSING_RAW_TEXT",
        message: "El texto descriptivo de la prenda es obligatorio.",
        missingFields: ["Texto o descripción de la prenda"],
        details:
          "Escribe al menos una descripción con los datos de la prenda (ej: 'Vestido lino $45.000 talles S M').",
      });
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);

    try {
      const priceCents = pricePesos.trim()
        ? Math.round(parseFloat(pricePesos.replace(/,/g, ".")) * 100)
        : null;

      const payload = {
        clientSubmissionId,
        rawText,
        title: title.trim() || null,
        priceCents,
        currency: "ARS",
        categoryId: selectedCategoryId,
        isFeatured,
        colors: colors.map((c, cIdx) => ({
          name: c.name.trim() || "Único",
          position: cIdx,
          sizes: c.sizes.map((s) => ({
            size: s.size.trim() || "ÚNICO",
            stock: Number.isNaN(Number(s.stock)) ? 0 : Math.max(0, Number(s.stock)),
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

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        if (data?.errorType) {
          setFormError({
            type: data.errorType,
            code:
              data.errorCode ||
              (data.errorType === "BUSINESS" ? "ERR_BUSINESS_UNKNOWN" : "ERR_TECH_SERVER_500"),
            message: data.error || "Ocurrió un error al procesar el producto.",
            missingFields: data.missingFields || [],
            details: data.details,
          });
        } else {
          setFormError({
            type: res.status >= 500 ? "TECHNICAL" : "BUSINESS",
            code: res.status >= 500 ? `ERR_TECH_${res.status}` : `ERR_BUSINESS_${res.status}`,
            message: data?.error || `Error del servidor (${res.status})`,
            missingFields: [],
            details: "No se pudo completar la creación del producto en el servidor.",
          });
        }
        return;
      }

      setPublishedProduct({
        id: data.product.id,
        code: data.product.code,
        title: data.product.title || "Producto sin título",
        duplicatePrevented: Boolean(data.duplicatePrevented),
        notice: data.notice,
      });
    } catch (err: unknown) {
      setFormError({
        type: "TECHNICAL",
        code: "ERR_TECH_NETWORK",
        message: "Falla de red o conexión interrumpida.",
        details:
          err instanceof Error ? err.message : "No se pudo establecer comunicación con el servidor.",
      });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setRawText("");
    setPhotos([]);
    setTitle("");
    setPricePesos("");
    const uncategorized = categories.find((c) => c.slug === "sin-clasificar");
    setSelectedCategoryId(uncategorized ? uncategorized.id : (categories[0]?.id || 0));
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
    setIsFeatured(false);
    setPublishedProduct(null);
    setFormError(null);
    setClientSubmissionId(`sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    submittingRef.current = false;
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
            {publishedProduct.duplicatePrevented ? "Prenda Ya Registrada" : "Publicación Exitosa"}
          </span>
          <h2 className="font-serif text-3xl font-bold text-zinc-100 mt-1">
            Producto {codeFormatted} {publishedProduct.duplicatePrevented ? "Confirmado" : "Publicado"}
          </h2>
          <p className="text-zinc-400 text-sm mt-2">
            &ldquo;{publishedProduct.title}&rdquo; ya está disponible y visible en el showroom.
          </p>
          {publishedProduct.duplicatePrevented && (
            <div className="mt-3 p-3 rounded-xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs text-left space-y-1">
              <p className="font-bold">Aviso anti-duplicados:</p>
              <p className="text-zinc-300 leading-relaxed">
                {publishedProduct.notice ||
                  "Se evitó crear un producto duplicado. Este artículo ya había sido guardado con este código."}
              </p>
            </div>
          )}
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
            href={`/admin/productos/${String(publishedProduct.code).padStart(3, "0")}/editar`}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 font-semibold text-sm hover:bg-zinc-800 transition-all"
          >
            <span>Editar prenda</span>
          </Link>

          <Link
            href="/admin/productos"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 font-semibold text-sm hover:bg-zinc-800 transition-all"
          >
            <span>Ver catálogo</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleResetForm}
            className="inline-flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200 font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Cargar otro producto</span>
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
          aria-label="Volver al panel principal de administración"
          className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-100">
            Cargar Nuevo Producto
          </h1>
          <p className="text-xs text-zinc-400">
            Pegá fotos y texto. El sistema propone los datos y confirmás con un toque.
          </p>
        </div>
      </div>

      {/* Aviso destacado de isLoading (BR-26) */}
      {submitting && (
        <div
          role="status"
          aria-live="polite"
          className="sticky top-20 z-30 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/50 bg-zinc-900/98 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-zinc-100">Guardando y publicando producto...</p>
              <p className="text-[11px] text-zinc-400">
                Procesando variantes, fotos y asignando código correlativo único. Por favor no cierres la página.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-300 uppercase tracking-wider animate-pulse">
            Guardando...
          </span>
        </div>
      )}

      <form onSubmit={handlePublish} className="space-y-6">
        {/* Paso 1: Subir Fotos en el Navegador (BR-07) */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Camera size={16} className="text-amber-300" aria-hidden="true" />
              <span>Fotos del producto</span>
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
                className={`relative w-24 h-32 rounded-xl overflow-hidden border bg-zinc-950 group transition-all ${
                  idx === 0
                    ? "border-amber-400 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/50"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <img
                  src={p.keyThumb}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Botón Eliminar */}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(p.id)}
                  aria-label={`Eliminar foto ${idx + 1}`}
                  className="absolute top-1 right-1 p-1 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none z-10"
                  title="Eliminar foto"
                >
                  <X size={12} aria-hidden="true" />
                </button>

                {/* Flechas para reordenar */}
                {photos.length > 1 && (
                  <div className="absolute top-1 left-1 flex items-center gap-0.5 z-10 opacity-75 group-hover:opacity-100 transition-opacity">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, "left")}
                        aria-label={`Mover foto ${idx + 1} hacia la izquierda`}
                        title="Mover hacia la izquierda"
                        className="p-0.5 rounded bg-zinc-950/80 text-zinc-300 hover:text-amber-200 hover:bg-zinc-900 transition-colors focus-visible:ring-1 focus-visible:ring-amber-400"
                      >
                        <ChevronLeft size={12} aria-hidden="true" />
                      </button>
                    )}
                    {idx < photos.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, "right")}
                        aria-label={`Mover foto ${idx + 1} hacia la derecha`}
                        title="Mover hacia la derecha"
                        className="p-0.5 rounded bg-zinc-950/80 text-zinc-300 hover:text-amber-200 hover:bg-zinc-900 transition-colors focus-visible:ring-1 focus-visible:ring-amber-400"
                      >
                        <ChevronRight size={12} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}

                {/* Badge de Portada o Botón para Hacer Portada */}
                {idx === 0 ? (
                  <div className="absolute bottom-1 inset-x-1 flex items-center justify-center gap-1 py-0.5 rounded bg-amber-400 text-zinc-950 font-bold text-[9px] shadow-sm">
                    <Star size={10} className="fill-zinc-950" aria-hidden="true" />
                    <span>Portada</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetCoverPhoto(idx)}
                    aria-label={`Destacar foto ${idx + 1} como portada principal`}
                    title="Hacer que esta foto sea la portada del producto"
                    className="absolute bottom-1 inset-x-1 flex items-center justify-center gap-1 py-0.5 rounded bg-zinc-950/90 text-zinc-300 hover:text-amber-300 hover:bg-zinc-900 border border-zinc-800 text-[9px] font-semibold transition-all focus-visible:ring-1 focus-visible:ring-amber-400"
                  >
                    <Star size={9} aria-hidden="true" />
                    <span>Destacar</span>
                  </button>
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
            <span>Texto libre original</span>
          </label>
          <textarea
            id="rawText"
            rows={3}
            value={rawText}
            onChange={(e) => handleRawTextChange(e.target.value)}
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
              Vista Previa de Publicación
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
                placeholder="Título del producto"
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

            {/* Producto Destacado en el Showroom */}
            <div className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Star
                    size={15}
                    className={isFeatured ? "text-amber-400 fill-amber-400" : "text-zinc-500"}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-bold text-zinc-200">
                    Destacar este producto en el catálogo
                  </span>
                  {isFeatured && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Destacado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Aparecerá en los primeros lugares de la tienda y en el filtro de Destacados.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isFeatured}
                aria-label="Destacar este producto en el catálogo"
                onClick={() => setIsFeatured((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isFeatured ? "bg-amber-400" : "bg-zinc-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                    isFeatured ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
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
                      aria-label="Nombre del color"
                      className="bg-transparent border-b border-zinc-700 focus:border-amber-400 text-sm font-semibold text-zinc-100 px-1 py-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                    />

                    {colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColor(col.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                        title="Eliminar este color"
                        aria-label={`Eliminar color ${col.name}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
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
                          aria-label={`Nombre de talle para color ${col.name}`}
                          className="w-12 text-center text-xs font-bold text-amber-200 bg-transparent focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                        />

                        {/* Controles táctiles de stock */}
                        <div className="flex items-center gap-1 bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
                          <button
                            type="button"
                            onClick={() => updateStock(col.id, sz.id, -1)}
                            aria-label={`Reducir stock del talle ${sz.size} para color ${col.name}`}
                            className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-100 active:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                          >
                            <Minus size={12} aria-hidden="true" />
                          </button>
                          <span
                            className="w-6 text-center text-xs font-mono font-bold text-zinc-100"
                            aria-label={`${sz.stock} unidades de stock`}
                          >
                            {sz.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateStock(col.id, sz.id, 1)}
                            aria-label={`Aumentar stock del talle ${sz.size} para color ${col.name}`}
                            className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-100 active:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                          >
                            <Plus size={12} aria-hidden="true" />
                          </button>
                        </div>

                        {col.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSizeFromColor(col.id, sz.id)}
                            aria-label={`Eliminar talle ${sz.size} del color ${col.name}`}
                            className="text-zinc-600 hover:text-zinc-400 p-0.5 rounded focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                          >
                            <X size={12} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Botón rápido para sumar talle a este color */}
                    <button
                      type="button"
                      onClick={() => addSizeToColor(col.id, "M")}
                      aria-label={`Agregar nuevo talle al color ${col.name}`}
                      className="px-2.5 py-1.5 rounded-xl border border-dashed border-zinc-700 text-zinc-400 hover:text-amber-200 text-xs flex items-center gap-1 hover:border-amber-400/50 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                    >
                      <Plus size={12} aria-hidden="true" />
                      <span>Talle</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de Error Estructurado (Negocio vs Técnico) */}
        {formError && (
          <div
            role="alert"
            aria-live="assertive"
            className={`p-4 sm:p-5 rounded-2xl border text-xs space-y-3 transition-all ${
              formError.type === "BUSINESS"
                ? "bg-amber-950/40 border-amber-800/80 text-amber-200"
                : "bg-red-950/50 border-red-800 text-red-200"
            }`}
          >
            {/* Header con Badge de Tipo y Código de Respuesta */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                {formError.type === "BUSINESS" ? (
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    formError.type === "BUSINESS"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {formError.type === "BUSINESS"
                    ? "Regla de Negocio / Validación"
                    : "Falla Técnica del Servidor"}
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-zinc-300 bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-700/60">
                Código: {formError.code}
              </span>
            </div>

            {/* Mensaje principal */}
            <div>
              <h4 className="font-bold text-sm text-zinc-100">
                {formError.type === "BUSINESS"
                  ? "No se pudo crear el producto: Datos requeridos faltantes"
                  : "Ocurrió un error técnico al procesar la solicitud"}
              </h4>
              <p className="mt-1 text-zinc-300 leading-relaxed">{formError.message}</p>
            </div>

            {/* Si es de negocio: Lista detallada de qué está faltando */}
            {formError.type === "BUSINESS" &&
              formError.missingFields &&
              formError.missingFields.length > 0 && (
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-amber-500/20 space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    ¿Qué está faltando completar o corregir?
                  </p>
                  <ul className="space-y-1 text-zinc-200">
                    {formError.missingFields.map((field, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{field}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Detalle o recomendación */}
            {formError.details && (
              <p className="text-[11px] text-zinc-400 italic leading-relaxed">
                {formError.details}
              </p>
            )}

            {/* Si es técnico: advertencia anti-duplicados y botón de verificación en catálogo */}
            {formError.type === "TECHNICAL" && (
              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong>Recomendación anti-duplicados:</strong> Si el servidor tardó en responder, es posible que la prenda se haya guardado. Te sugerimos revisar el catálogo en otra pestaña antes de volver a presionar Publicar.
                </p>
                <a
                  href="/admin/productos"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Verificar en Catálogo de Productos</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Botón Principal de Publicación (BR-26) */}
        <div className="sticky bottom-4 z-20 pt-2">
          <button
            type="submit"
            disabled={submitting || compressing || !rawText.trim()}
            className="w-full py-3.5 px-6 rounded-2xl bg-amber-200 hover:bg-amber-100 active:scale-[0.98] text-zinc-950 font-bold text-base transition-all shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Guardando y publicando producto...</span>
              </>
            ) : (
              <>
                <span>Publicar Producto</span>
                <Check size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
