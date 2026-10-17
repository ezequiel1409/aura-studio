"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  Minus,
  Package,
  Plus,
  PlusCircle,
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
import { formatPriceARS } from "../../lib/format/currency";

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
  file?: File;
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

export function NewProductClient({ categories: initialCategories }: NewProductClientProps) {
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories);

  // 1. Fotos
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // 2. Datos Indispensables
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [pricePesos, setPricePesos] = useState<string>("");
  const [isConsultPrice, setIsConsultPrice] = useState(false);
  const [isSinglePiece, setIsSinglePiece] = useState(true);

  // 3. Opciones Secundarias ("Más opciones")
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(() => {
    const uncategorized = initialCategories.find((c) => c.slug === "sin-clasificar");
    return uncategorized ? uncategorized.id : (initialCategories[0]?.id || 0);
  });
  const [initialStatus, setInitialStatus] = useState<"AVAILABLE" | "RESERVED">("AVAILABLE");
  const [isFeatured, setIsFeatured] = useState(false);

  // Creación rápida de categoría en línea
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);

  // Variantes (colores y talles)
  const [colors, setColors] = useState<ColorState[]>([
    {
      id: "default-col",
      name: "Único",
      sizes: [{ id: "default-sz", size: "ÚNICO", stock: 1 }],
    },
  ]);

  // Vista previa activa (catálogo vs ficha de producto)
  const [previewTab, setPreviewTab] = useState<"card" | "detail">("card");

  // Modal de importación masiva (CSV/Planilla)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [importingBatch, setImportingBatch] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Estado de publicación y control de duplicados
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

  // Sincronizar título y texto descriptivo
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!rawText || rawText === title) {
      setRawText(val);
    }
  };

  // Plantillas rápidas de variantes
  const applyPreset = (preset: "clothing" | "shoes" | "single") => {
    if (preset === "clothing") {
      setColors([
        {
          id: `col-${Date.now()}`,
          name: "Único",
          sizes: [
            { id: "sz-s", size: "S", stock: 1 },
            { id: "sz-m", size: "M", stock: 1 },
            { id: "sz-l", size: "L", stock: 1 },
            { id: "sz-xl", size: "XL", stock: 1 },
          ],
        },
      ]);
      setIsSinglePiece(false);
    } else if (preset === "shoes") {
      setColors([
        {
          id: `col-${Date.now()}`,
          name: "Único",
          sizes: [35, 36, 37, 38, 39, 40].map((num) => ({
            id: `sz-${num}`,
            size: String(num),
            stock: 1,
          })),
        },
      ]);
      setIsSinglePiece(false);
    } else {
      setColors([
        {
          id: `col-${Date.now()}`,
          name: "Único",
          sizes: [{ id: "sz-unico", size: "ÚNICO", stock: 1 }],
        },
      ]);
      setIsSinglePiece(true);
    }
  };

  // Creación rápida de categoría
  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || creatingCategoryLoading) return;

    setCreatingCategoryLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.category) {
        setCategoriesList((prev) => [...prev, data.category]);
        setSelectedCategoryId(data.category.id);
        setNewCategoryName("");
        setIsCreatingCategory(false);
      } else {
        alert(data.error || "No se pudo crear la categoría");
      }
    } catch {
      alert("Error de conexión al crear categoría.");
    } finally {
      setCreatingCategoryLoading(false);
    }
  };

  // Compresión y carga de fotos (drag & drop y botón)
  const processFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;
    setCompressing(true);
    setFormError(null);

    try {
      const newPhotos: PhotoPreview[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.type.startsWith("image/")) continue;
        const compressed = await compressImageInBrowser(file);
        newPhotos.push({
          id: `${Date.now()}-${i}-${Math.random()}`,
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
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

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

  // Modificar stock
  const updateStock = (colorId: string, sizeId: string, delta: number) => {
    setColors((prev) =>
      prev.map((col) => {
        if (col.id !== colorId) return col;
        return {
          ...col,
          sizes: col.sizes.map((s) => {
            if (s.id !== sizeId) return s;
            return { ...s, stock: Math.max(0, s.stock + delta) };
          }),
        };
      })
    );
  };

  const setStockExact = (colorId: string, sizeId: string, val: number) => {
    setColors((prev) =>
      prev.map((col) => {
        if (col.id !== colorId) return col;
        return {
          ...col,
          sizes: col.sizes.map((s) => {
            if (s.id !== sizeId) return s;
            return { ...s, stock: Math.max(0, val) };
          }),
        };
      })
    );
  };

  // Enviar formulario (Publicar o Guardar Borrador)
  const submitProduct = async (
    statusOverride?: "AVAILABLE" | "RESERVED",
    andCreateAnother: boolean = false
  ) => {
    if (submitting || submittingRef.current) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError({
        type: "BUSINESS",
        code: "ERR_BUSINESS_MISSING_TITLE",
        message: "El nombre o título de la pieza es obligatorio.",
        missingFields: ["Nombre de la pieza"],
        details: "Escribe un nombre claro para que tus clientes identifiquen la prenda (ej: 'Vestido Lino Siena').",
      });
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);

    try {
      const priceCents =
        !isConsultPrice && pricePesos.trim()
          ? Math.round(parseFloat(pricePesos.replace(/,/g, ".")) * 100)
          : null;

      const finalStatus = statusOverride || initialStatus;

      const payload = {
        clientSubmissionId,
        rawText: rawText.trim() || trimmedTitle,
        title: trimmedTitle,
        priceCents,
        currency: "ARS",
        categoryId: selectedCategoryId,
        status: finalStatus,
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

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setFormError({
          type: data.type || "BUSINESS",
          code: data.code || "ERR_PUBLICATION_FAILED",
          message: data.error || "No se pudo registrar la pieza.",
          details: data.details,
        });
        return;
      }

      if (andCreateAnother) {
        // Limpiar para cargar otra pieza inmediatamente
        setTitle("");
        setRawText("");
        setPricePesos("");
        setIsConsultPrice(false);
        setPhotos([]);
        setColors([
          {
            id: `col-${Date.now()}`,
            name: "Único",
            sizes: [{ id: "sz-def", size: "ÚNICO", stock: 1 }],
          },
        ]);
        setClientSubmissionId(`sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
        alert(`¡Pieza #${data.product.code} publicada con éxito! Podés continuar cargando la siguiente.`);
      } else {
        setPublishedProduct({
          id: data.product.id,
          code: data.product.code,
          title: data.product.title,
          duplicatePrevented: data.duplicatePrevented,
          notice: data.notice,
        });
      }
    } catch (err: unknown) {
      setFormError({
        type: "TECHNICAL",
        code: "ERR_NETWORK_OR_SERVER",
        message: "Ocurrió una falla de conexión al guardar el producto.",
        details: err instanceof Error ? err.message : "Comprueba tu conexión e intenta nuevamente.",
      });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // Manejo de importación masiva por planilla (CSV)
  const handleBatchImport = async () => {
    if (!csvContent.trim() || importingBatch) return;
    setImportingBatch(true);
    setImportResult(null);

    const lines = csvContent.trim().split("\n");
    let countSuccess = 0;
    let countFailed = 0;

    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 2) continue;
      const [itemTitle, itemPrice, itemCategory, itemSize] = parts;

      if (!itemTitle || itemTitle.toLowerCase() === "titulo" || itemTitle.toLowerCase() === "título") {
        continue; // Encabezado
      }

      const parsedPrice = parseFloat(itemPrice.replace(/[^0-9.]/g, ""));
      const priceCents = !Number.isNaN(parsedPrice) ? Math.round(parsedPrice * 100) : null;

      let categoryId = selectedCategoryId;
      if (itemCategory) {
        const found = categoriesList.find((c) => c.name.toLowerCase() === itemCategory.toLowerCase());
        if (found) categoryId = found.id;
      }

      try {
        const payload = {
          clientSubmissionId: `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          rawText: `${itemTitle} ${itemPrice}`,
          title: itemTitle,
          priceCents,
          currency: "ARS",
          categoryId,
          status: "AVAILABLE",
          isFeatured: false,
          colors: [
            {
              name: "Único",
              position: 0,
              sizes: [{ size: itemSize || "ÚNICO", stock: 1 }],
            },
          ],
          photos: [],
        };

        const res = await fetch("/api/admin/products/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) countSuccess++;
        else countFailed++;
      } catch {
        countFailed++;
      }
    }

    setImportingBatch(false);
    setImportResult(`Importación finalizada: ${countSuccess} piezas creadas con éxito, ${countFailed} con errores.`);
  };

  // Pantalla de Confirmación de Publicación
  if (publishedProduct) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 size={32} />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-zinc-800 text-amber-300 border border-zinc-700">
            #{publishedProduct.code}
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-zinc-100">
            ¡Pieza publicada con éxito!
          </h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            {publishedProduct.title || `Pieza #${publishedProduct.code}`} ya está disponible en tu catálogo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setPublishedProduct(null);
              setTitle("");
              setRawText("");
              setPricePesos("");
              setIsConsultPrice(false);
              setPhotos([]);
              setColors([
                {
                  id: `col-${Date.now()}`,
                  name: "Único",
                  sizes: [{ id: "sz-def", size: "ÚNICO", stock: 1 }],
                },
              ]);
              setClientSubmissionId(`sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 font-bold text-sm transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            + Cargar otra pieza
          </button>

          <Link
            href="/admin/productos"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-sm transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            Ir al listado de productos
          </Link>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 font-semibold text-sm transition-all"
          >
            <span>Ver en la tienda</span>
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    );
  }

  // Precios formateados para la vista previa en vivo
  const numericPriceCents = !isConsultPrice && pricePesos.trim()
    ? Math.round(parseFloat(pricePesos.replace(/,/g, ".")) * 100)
    : null;

  const totalStockCount = colors.reduce(
    (sum, c) => sum + c.sizes.reduce((sSum, sz) => sSum + sz.stock, 0),
    0
  );

  const selectedCategoryObj = categoriesList.find((c) => c.id === selectedCategoryId);

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Barra de Encabezado Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/productos"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            aria-label="Volver al catálogo"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-zinc-100">
              Cargar Nueva Pieza
            </h1>
            <p className="text-xs text-zinc-400">
              Completá los datos indispensables para publicarla en tu tienda
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsImportModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none self-start sm:self-auto"
        >
          <FileSpreadsheet size={15} className="text-emerald-400" />
          <span>Importar desde planilla</span>
        </button>
      </div>

      {/* Alerta de Error si falló validación */}
      {formError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs space-y-1.5"
        >
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <AlertCircle size={16} />
            <span>{formError.message}</span>
          </div>
          {formError.details && <p className="text-rose-300/80 pl-6">{formError.details}</p>}
        </div>
      )}

      {/* 2. Disposición en 2 Columnas para Escritorio (lg:grid-cols-12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Formulario Rápido (7 columnas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Bloque 1: Fotos Primero (Drag & Drop y WebP) */}
          <section aria-labelledby="section-photos" className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-amber-400" />
                <h2 id="section-photos" className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Fotos de la pieza
                </h2>
              </div>
              <span className="text-[11px] text-zinc-400">
                {photos.length} {photos.length === 1 ? "foto cargada" : "fotos cargadas"}
              </span>
            </div>

            {/* Zona de Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                isDraggingOver
                  ? "border-amber-400 bg-amber-400/10"
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/60"
              }`}
            >
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
                disabled={compressing}
              />
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center cursor-pointer space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-300">
                  {compressing ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-zinc-200">
                    {compressing ? "Optimizando fotos..." : "Arrastrá tus fotos o hacé clic para buscar"}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    JPG, PNG o WebP. Se optimizan automáticamente para carga ultra rápida.
                  </p>
                </div>
              </label>
            </div>

            {/* Galería de miniaturas ordenables */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-2">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-4/5 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xs"
                  >
                    <Image
                      src={photo.keyThumb}
                      alt={`Foto ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />

                    {index === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-amber-300 text-zinc-950 text-[10px] font-bold shadow-xs">
                        Portada
                      </span>
                    )}

                    {/* Acciones flotantes */}
                    <div className="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                      <div className="flex items-center justify-between">
                        {index > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(index, "left")}
                            className="p-1 rounded-lg bg-zinc-900 text-zinc-200 hover:text-amber-300"
                            title="Mover a la izquierda"
                          >
                            <ChevronLeft size={13} />
                          </button>
                        ) : <span />}

                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="p-1 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900"
                          title="Eliminar foto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {index < photos.length - 1 && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(index, "right")}
                            className="p-1 rounded-lg bg-zinc-900 text-zinc-200 hover:text-amber-300"
                            title="Mover a la derecha"
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Bloque 2: Lo Indispensable Primero (Título, Precio, Stock) */}
          <section aria-labelledby="section-essential" className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <h2 id="section-essential" className="text-xs font-bold uppercase tracking-wider text-zinc-200 border-b border-zinc-800/80 pb-3">
              Datos indispensables
            </h2>

            {/* Nombre de la Pieza */}
            <div className="space-y-1.5">
              <label htmlFor="product-title" className="block text-xs font-bold text-zinc-200">
                Nombre de la pieza <span className="text-amber-400">*</span>
              </label>
              <input
                id="product-title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ej: Vestido Lino Siena, Blazer Milano..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                required
              />
            </div>

            {/* Descripción breve o notas */}
            <div className="space-y-1.5">
              <label htmlFor="product-desc" className="block text-xs font-semibold text-zinc-300">
                Descripción o detalles de la prenda
              </label>
              <textarea
                id="product-desc"
                rows={2}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Contá de qué se trata: material, calce, ocasión de uso..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors leading-relaxed"
              />
            </div>

            {/* Precio y Switch "Consultar precio" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="product-price" className="block text-xs font-bold text-zinc-200">
                  Precio (ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                    $
                  </span>
                  <input
                    id="product-price"
                    type="text"
                    inputMode="decimal"
                    disabled={isConsultPrice}
                    value={pricePesos}
                    onChange={(e) => setPricePesos(e.target.value)}
                    placeholder={isConsultPrice ? "Consultar precio" : "0.00"}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-5">
                <label htmlFor="consult-price-toggle" className="text-xs font-medium text-zinc-300 cursor-pointer">
                  Mostrar &ldquo;Consultar precio&rdquo;
                </label>
                <input
                  id="consult-price-toggle"
                  type="checkbox"
                  checked={isConsultPrice}
                  onChange={(e) => {
                    setIsConsultPrice(e.target.checked);
                    if (e.target.checked) setPricePesos("");
                  }}
                  className="w-4 h-4 rounded-md accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Selector Rápido de Stock: Pieza Única vs Múltiples */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-zinc-200">Modalidad de Inventario</p>
                <p className="text-[11px] text-zinc-400">
                  {isSinglePiece
                    ? "Pieza única: stock 1 unidad (sin selector de cantidad en la tienda)"
                    : `Múltiples unidades o variantes (${totalStockCount} en stock total)`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = !isSinglePiece;
                  setIsSinglePiece(next);
                  if (next) applyPreset("single");
                  else applyPreset("clothing");
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-semibold text-amber-300 hover:bg-zinc-800 transition-colors"
              >
                {isSinglePiece ? "Cambiar a múltiples" : "Cambiar a pieza única"}
              </button>
            </div>
          </section>

          {/* Bloque 3: "Más opciones" Colapsables */}
          <section className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors cursor-pointer"
              aria-expanded={isMoreOptionsOpen}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Más opciones (Categoría, Talles, Variantes, Destacado)
                </span>
                <span className="text-[11px] text-zinc-400">
                  {isMoreOptionsOpen ? "Ocultar" : "Personalizar"}
                </span>
              </div>
              {isMoreOptionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isMoreOptionsOpen && (
              <div className="p-5 border-t border-zinc-800 space-y-5">
                {/* Categoría con Alta Rápida en Línea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="product-cat" className="text-xs font-bold text-zinc-200">
                      Categoría
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                      className="text-xs font-semibold text-amber-300 hover:underline inline-flex items-center gap-1"
                    >
                      <PlusCircle size={13} />
                      <span>{isCreatingCategory ? "Cancelar" : "+ Nueva categoría"}</span>
                    </button>
                  </div>

                  {isCreatingCategory ? (
                    <form onSubmit={handleQuickCreateCategory} className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nombre de la nueva categoría..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={creatingCategoryLoading || !newCategoryName.trim()}
                        className="px-3 py-1.5 rounded-xl bg-amber-300 text-zinc-950 text-xs font-bold hover:bg-amber-200 disabled:opacity-50"
                      >
                        {creatingCategoryLoading ? "Creando..." : "Crear"}
                      </button>
                    </form>
                  ) : (
                    <select
                      id="product-cat"
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    >
                      {categoriesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Plantillas Rápidas de Talles */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">Plantillas rápidas de talles</span>
                    <span className="text-[11px] text-zinc-400">1 clic para configurar</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyPreset("clothing")}
                      className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-amber-300 hover:border-zinc-700 transition-colors"
                    >
                      Ropa (S, M, L, XL)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("shoes")}
                      className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-amber-300 hover:border-zinc-700 transition-colors"
                    >
                      Calzado (35 a 40)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("single")}
                      className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-amber-300 hover:border-zinc-700 transition-colors"
                    >
                      Talle Único
                    </button>
                  </div>

                  {/* Matriz de Talles y Stock */}
                  <div className="pt-2 space-y-2">
                    {colors.map((color) => (
                      <div key={color.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200">
                            Variante: {color.name}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {color.sizes.length} talles
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {color.sizes.map((sz) => (
                            <div
                              key={sz.id}
                              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-1"
                            >
                              <span className="text-xs font-bold text-zinc-200 font-mono">
                                {sz.size}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateStock(color.id, sz.id, -1)}
                                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center text-xs"
                                >
                                  -
                                </button>
                                <span className="text-xs font-mono font-bold w-4 text-center text-amber-300">
                                  {sz.stock}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateStock(color.id, sz.id, 1)}
                                  className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Destacado y Estado Inicial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <input
                      id="feat-check"
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded-md accent-amber-400 cursor-pointer"
                    />
                    <label htmlFor="feat-check" className="text-xs font-semibold text-zinc-200 cursor-pointer flex items-center gap-1.5">
                      <Star size={14} className={isFeatured ? "text-amber-400 fill-amber-400" : "text-zinc-500"} />
                      <span>Destacar en portada</span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-xs font-semibold text-zinc-300">Estado inicial</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setInitialStatus("AVAILABLE")}
                        className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          initialStatus === "AVAILABLE"
                            ? "bg-emerald-950/60 border-emerald-600 text-emerald-300"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        Disponible
                      </button>
                      <button
                        type="button"
                        onClick={() => setInitialStatus("RESERVED")}
                        className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          initialStatus === "RESERVED"
                            ? "bg-amber-950/60 border-amber-600 text-amber-300"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        Reservado
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Columna Derecha: Vista Previa Interactiva en Vivo (5 columnas sticky) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Vista Previa en Vivo
                </h3>
              </div>

              {/* Selector de tipo de vista */}
              <div className="flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewTab("card")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    previewTab === "card"
                      ? "bg-zinc-800 text-amber-300"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("detail")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    previewTab === "detail"
                      ? "bg-zinc-800 text-amber-300"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Ficha
                </button>
              </div>
            </div>

            {/* Renderizado de Vista Previa */}
            {previewTab === "card" ? (
              // Tarjeta de Catálogo
              <div className="max-w-[280px] mx-auto rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-lg space-y-3 p-3">
                <div className="relative aspect-4/5 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-850">
                  {photos.length > 0 ? (
                    <Image
                      src={photos[0].keyThumb}
                      alt={title || "Vista previa"}
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                      <ImageIcon size={32} />
                      <span className="text-[11px]">Sin foto de portada</span>
                    </div>
                  )}

                  {isFeatured && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-300 text-zinc-950 text-[10px] font-bold">
                      Destacado
                    </span>
                  )}

                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-zinc-900/90 text-emerald-400 text-[10px] font-bold backdrop-blur-xs">
                    {initialStatus === "AVAILABLE" ? "Disponible" : "Reservado"}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{selectedCategoryObj?.name || "Categoría"}</span>
                    <span>#---</span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-zinc-100 truncate">
                    {title || "Nombre de la pieza"}
                  </h4>
                  <p className="font-serif text-base font-bold text-zinc-100 font-mono lining-nums tabular-nums">
                    {isConsultPrice
                      ? "Consultar precio"
                      : numericPriceCents !== null
                      ? formatPriceARS(numericPriceCents)
                      : "$ 0"}
                  </p>
                </div>
              </div>
            ) : (
              // Ficha de Producto Detallada
              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 space-y-3 text-xs">
                <div className="flex gap-3">
                  <div className="relative w-20 aspect-4/5 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                    {photos.length > 0 ? (
                      <Image
                        src={photos[0].keyThumb}
                        alt="Miniatura"
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">
                      {initialStatus === "AVAILABLE" ? "Disponible" : "Reservado"}
                    </span>
                    <h4 className="font-serif text-sm font-bold text-zinc-100 truncate">
                      {title || "Nombre de la pieza"}
                    </h4>
                    <p className="font-bold text-zinc-100 font-mono">
                      {isConsultPrice
                        ? "Consultar precio"
                        : numericPriceCents !== null
                        ? formatPriceARS(numericPriceCents)
                        : "$ 0"}
                    </p>
                  </div>
                </div>

                {/* Chips de Talles */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-zinc-400 font-medium">Talles disponibles:</span>
                  <div className="flex flex-wrap gap-1">
                    {colors[0]?.sizes.map((sz) => (
                      <span
                        key={sz.id}
                        className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-[10px] font-bold text-zinc-200"
                      >
                        {sz.size} ({sz.stock})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Botón ficticio de agregar a bolsa */}
                <button
                  type="button"
                  disabled
                  className="w-full py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-bold opacity-75"
                >
                  Agregar a la bolsa (Vista previa)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Barra de Acciones Fija Abajo */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 py-3.5 px-4 md:px-8 md:pl-72 shadow-2xl transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link
            href="/admin/productos"
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancelar
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={submitting || !title.trim()}
              onClick={() => submitProduct(undefined, true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Publicar y cargar otra</span>
            </button>

            <button
              type="button"
              disabled={submitting || !title.trim()}
              onClick={() => submitProduct()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 text-xs font-extrabold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Publicar pieza</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Importar desde planilla */}
      {isImportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl text-zinc-100 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-400" />
                <h3 id="import-modal-title" className="font-serif text-lg font-bold">
                  Importar piezas desde planilla
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Pegá el contenido CSV con las columnas: <code className="text-amber-300">Título, Precio, Categoría, Talle</code>
            </p>

            <textarea
              rows={6}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder={"Título,Precio,Categoría,Talle\nVestido Lino Siena,45000,Vestidos,M\nBlazer Milano,85000,Blazers,L\nSweater Roma,35000,Sweaters,S"}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400"
            />

            {importResult && (
              <p className="text-xs font-bold text-amber-300 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                {importResult}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleBatchImport}
                disabled={importingBatch || !csvContent.trim()}
                className="px-4 py-2 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 text-xs font-bold disabled:opacity-50"
              >
                {importingBatch ? "Importando..." : "Comenzar importación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
