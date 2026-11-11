"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileSpreadsheet,
  Loader2,
  PlusCircle,
  RotateCcw,
  Save,
} from "lucide-react";
import { Category } from "../../domain/category/types";
import { ProductAttributeDefinition } from "../../domain/navigation/types";
import { MediaUploaderStep, PhotoPreview } from "./products/new/MediaUploaderStep";
import { BasicDataStep } from "./products/new/BasicDataStep";
import { ColorState, StockVariantsStep } from "./products/new/StockVariantsStep";
import { ProductAttributesStep } from "./products/new/ProductAttributesStep";
import { ProductPreviewCard } from "./products/new/ProductPreviewCard";
import { MobileProductPreviewSheet } from "./products/new/MobileProductPreviewSheet";

interface NewProductClientProps {
  categories: Category[];
  attributeDefinitions?: ProductAttributeDefinition[];
}

export interface FormErrorState {
  type: "BUSINESS" | "TECHNICAL";
  code: string;
  message: string;
  missingFields?: string[];
  details?: string;
}

const DRAFT_STORAGE_KEY = "app_admin_new_product_draft";

export function NewProductClient({
  categories: initialCategories,
  attributeDefinitions = [],
}: NewProductClientProps) {
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories);

  // 1. Fotos
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);

  // 2. Datos básicos
  const [title, setTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [pricePesos, setPricePesos] = useState<string>("");
  const [compareAtPricePesos, setCompareAtPricePesos] = useState<string>("");
  const [isConsultPrice, setIsConsultPrice] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(() => {
    const uncategorized = initialCategories.find(
      (c) => c.slug === "sin-clasificar"
    );
    return uncategorized ? uncategorized.id : initialCategories[0]?.id || 0;
  });

  // 3. Variantes y Stock (80% Pieza Única por defecto)
  const [isSinglePiece, setIsSinglePiece] = useState(true);
  const [colors, setColors] = useState<ColorState[]>([
    {
      id: "col-default",
      name: "Único",
      sizes: [{ id: "sz-default", size: "ÚNICO", stock: 1 }],
    },
  ]);

  // 4. Visibilidad y Atributos
  const [initialStatus, setInitialStatus] = useState<"AVAILABLE" | "RESERVED">("AVAILABLE");
  const [isFeatured, setIsFeatured] = useState(false);
  const [allowReturn, setAllowReturn] = useState(true);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [attrDefs, setAttrDefs] = useState<ProductAttributeDefinition[]>(attributeDefinitions);

  // Borrador local y auto-guardado en navegador
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
  const isDraftInitializedRef = useRef(false);

  // Estados de interfaz y navegación móvil (Acordeón inteligente)
  const [mobileStep, setMobileStep] = useState<number>(1);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Optimizaciones Desktop: useDeferredValue para actualizar la preview sin trabar los 144Hz del teclado
  const deferredTitle = useDeferredValue(title);
  const deferredPricePesos = useDeferredValue(pricePesos);

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

  // Detección de teclado virtual móvil mediante visualViewport para no obstruir inputs
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const viewport = window.visualViewport;

    const handleResize = () => {
      const isShort = viewport.height < window.innerHeight * 0.75;
      setIsKeyboardOpen(isShort);
    };

    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  // 1. Restaurar borrador de localStorage al montar
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        let restoredAny = false;

        if (draft.title && typeof draft.title === "string") {
          setTitle(draft.title);
          restoredAny = true;
        }
        if (draft.pricePesos && typeof draft.pricePesos === "string") {
          setPricePesos(draft.pricePesos);
          restoredAny = true;
        }
        if (draft.compareAtPricePesos && typeof draft.compareAtPricePesos === "string") {
          setCompareAtPricePesos(draft.compareAtPricePesos);
        }
        if (typeof draft.isConsultPrice === "boolean") {
          setIsConsultPrice(draft.isConsultPrice);
        }
        if (typeof draft.selectedCategoryId === "number" && draft.selectedCategoryId > 0) {
          setSelectedCategoryId(draft.selectedCategoryId);
        }
        if (typeof draft.isSinglePiece === "boolean") {
          setIsSinglePiece(draft.isSinglePiece);
        }
        if (Array.isArray(draft.colors) && draft.colors.length > 0) {
          setColors(draft.colors);
          restoredAny = true;
        }
        if (Array.isArray(draft.photos) && draft.photos.length > 0) {
          setPhotos(draft.photos);
          restoredAny = true;
        }
        if (draft.initialStatus === "AVAILABLE" || draft.initialStatus === "RESERVED") {
          setInitialStatus(draft.initialStatus);
        }
        if (typeof draft.isFeatured === "boolean") {
          setIsFeatured(draft.isFeatured);
        }
        if (typeof draft.allowReturn === "boolean") {
          setAllowReturn(draft.allowReturn);
        }
        if (draft.attributes && typeof draft.attributes === "object") {
          setAttributes(draft.attributes);
        }

        if (restoredAny) {
          setHasRestoredDraft(true);
          setLastDraftSavedAt(draft.savedAt || Date.now());
        }
      }
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } finally {
      isDraftInitializedRef.current = true;
    }
  }, []);

  // 2. Auto-guardado en localStorage ante cambios en el formulario
  useEffect(() => {
    if (!isDraftInitializedRef.current || typeof window === "undefined") return;

    const hasContent = Boolean(
      title.trim() ||
      pricePesos.trim() ||
      compareAtPricePesos.trim() ||
      isConsultPrice ||
      photos.length > 0 ||
      (colors.length > 0 &&
        (colors.length > 1 ||
          (colors[0]?.sizes && (colors[0].sizes.length > 1 || colors[0].sizes[0]?.stock !== 1 || colors[0].sizes[0]?.size !== "ÚNICO")))) ||
      Object.keys(attributes).length > 0
    );

    if (!hasContent) {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
      setLastDraftSavedAt(null);
      return;
    }

    const timer = setTimeout(() => {
      try {
        const draft = {
          title,
          pricePesos,
          compareAtPricePesos,
          isConsultPrice,
          selectedCategoryId,
          isSinglePiece,
          colors,
          photos,
          initialStatus,
          isFeatured,
          allowReturn,
          attributes,
          savedAt: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setLastDraftSavedAt(Date.now());
      } catch {
        try {
          const lightPhotos = photos.map((p) => ({
            id: p.id,
            keyThumb: p.keyThumb,
            keyFull: p.keyFull,
          }));
          const draftLight = {
            title,
            pricePesos,
            compareAtPricePesos,
            isConsultPrice,
            selectedCategoryId,
            isSinglePiece,
            colors,
            photos: lightPhotos,
            initialStatus,
            isFeatured,
            allowReturn,
            attributes,
            savedAt: Date.now(),
          };
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftLight));
          setLastDraftSavedAt(Date.now());
        } catch {}
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    title,
    pricePesos,
    compareAtPricePesos,
    isConsultPrice,
    selectedCategoryId,
    isSinglePiece,
    colors,
    photos,
    initialStatus,
    isFeatured,
    allowReturn,
    attributes,
  ]);

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setTitle("");
    setPricePesos("");
    setCompareAtPricePesos("");
    setIsConsultPrice(false);
    setPhotos([]);
    setAttributes({});
    setColors([
      {
        id: "col-default",
        name: "Único",
        sizes: [{ id: "sz-default", size: "ÚNICO", stock: 1 }],
      },
    ]);
    setHasRestoredDraft(false);
    setLastDraftSavedAt(null);
    titleInputRef.current?.focus();
  };

  // Validaciones
  const isTitleValid = title.trim().length > 0;
  const isPriceValid =
    isConsultPrice ||
    (pricePesos.trim().length > 0 &&
      !isNaN(parseFloat(pricePesos.replace(/,/g, "."))) &&
      parseFloat(pricePesos.replace(/,/g, ".")) >= 0);
  const totalStockCount = colors.reduce(
    (acc, col) => acc + col.sizes.reduce((sAcc, s) => sAcc + (s.stock || 0), 0),
    0
  );
  const isFormValid = isTitleValid && isPriceValid;

  const missingFieldsList: string[] = [];
  if (!isTitleValid) missingFieldsList.push("Nombre de la prenda");
  if (!isPriceValid) missingFieldsList.push("Precio");

  const selectedCategoryObj = categoriesList.find((c) => c.id === selectedCategoryId);

  // Envío del producto al backend
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
        message: "El nombre o título de la prenda es obligatorio.",
        missingFields: ["Nombre de la prenda"],
        details: "Escribí un nombre claro para que tus clientas identifiquen la prenda (ej: 'Vestido Lino Siena').",
      });
      titleInputRef.current?.focus();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 12000);

    try {
      const priceCents =
        !isConsultPrice && pricePesos.trim()
          ? Math.round(parseFloat(pricePesos.replace(/,/g, ".")) * 100)
          : null;

      const compareAtPriceCents =
        !isConsultPrice && compareAtPricePesos.trim()
          ? Math.round(parseFloat(compareAtPricePesos.replace(/,/g, ".")) * 100)
          : null;

      const finalStatus = statusOverride || initialStatus;
      const cleanAttributes: Record<string, string> = {};
      for (const [k, v] of Object.entries(attributes)) {
        if (v && v.trim()) {
          cleanAttributes[k] = v.trim();
        }
      }

      const allUniqueSizes = Array.from(
        new Set(
          colors.flatMap((c) =>
            c.sizes.map((s) => s.size.trim().toUpperCase()).filter(Boolean)
          )
        )
      ).join(", ");

      const payload = {
        clientSubmissionId,
        rawText: trimmedTitle,
        title: trimmedTitle,
        priceCents,
        compareAtPriceCents,
        currency: "ARS",
        size: allUniqueSizes || undefined,
        categoryId: selectedCategoryId,
        status: finalStatus,
        isFeatured,
        allowReturn,
        publishedAt: new Date().toISOString(),
        attributes: cleanAttributes,
        colors: colors.map((c, cIdx) => ({
          name: c.name.trim() || "Único",
          hexCode: c.hexCode || null,
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
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setFormError({
          type: data.type || "BUSINESS",
          code: data.code || "ERR_PUBLICATION_FAILED",
          message: data.error || "No se pudo registrar la prenda.",
          details: data.details,
        });
        return;
      }

      // Limpiar borrador local tras publicación exitosa
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
      setHasRestoredDraft(false);
      setLastDraftSavedAt(null);

      if (andCreateAnother) {
        setTitle("");
        setPricePesos("");
        setCompareAtPricePesos("");
        setIsConsultPrice(false);
        setPhotos([]);
        setAttributes({});
        setColors([
          {
            id: `col-${Date.now()}`,
            name: "Único",
            sizes: [{ id: "sz-def", size: "ÚNICO", stock: 1 }],
          },
        ]);
        setClientSubmissionId(`sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
        setMobileStep(1);

        // Auto-focus de escritorio encadenado (Loop de Carga Ráfaga)
        setTimeout(() => {
          titleInputRef.current?.focus();
        }, 50);
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
      if (err instanceof Error && err.name === "AbortError") {
        setFormError({
          type: "TECHNICAL",
          code: "ERR_REQUEST_TIMEOUT",
          message: "La operación tardó demasiado (más de 12 segundos).",
          details:
            "El servidor o la red demoró más de lo esperado. Tus datos y fotos siguen intactos en el formulario: podés reintentar ahora.",
        });
      } else {
        setFormError({
          type: "TECHNICAL",
          code: "ERR_NETWORK_OR_SERVER",
          message: "Ocurrió una falla de conexión al guardar el producto.",
          details: err instanceof Error ? err.message : "Comprobá tu conexión e intentá nuevamente.",
        });
      }
    } finally {
      clearTimeout(timeoutId);
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const isFormValidRef = useRef(isFormValid);
  isFormValidRef.current = isFormValid;
  const submitProductRef = useRef(submitProduct);
  submitProductRef.current = submitProduct;

  // Atajos de teclado Desktop con detección de Shift:
  // - Ctrl + Enter => Publicar pieza
  // - Ctrl + Shift + Enter => Publicar y cargar otra (Loop Rápido)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isFormValidRef.current || submittingRef.current) return;

        if (e.shiftKey) {
          submitProductRef.current(undefined, true);
        } else {
          submitProductRef.current("AVAILABLE");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
              setMobileStep(1);
              setTimeout(() => titleInputRef.current?.focus(), 50);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 font-bold text-sm transition-all cursor-pointer"
          >
            + Cargar otra pieza
          </button>

          <Link
            prefetch={false}
            href="/admin/productos"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-sm transition-all"
          >
            Ir al listado de productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* 1. Encabezado con Acciones Rápidas Superiores en Desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            prefetch={false}
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
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="text-xs text-zinc-400">
                Flujo rápido con soporte de portapapeles y atajos de teclado
              </p>
              {lastDraftSavedAt && (
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-normal">
                  • <Save size={11} className="text-emerald-500" /> Borrador guardado localmente
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones Superiores Desktop (Patrón Shopify / Linear) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            prefetch={false}
            href="/admin/productos/importar"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span className="hidden md:inline">Importar planilla</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 border-l border-zinc-800 pl-2">
            <button
              type="button"
              disabled={submitting || !isFormValid}
              onClick={() => submitProduct(undefined, true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              title="Publicar y limpiar el formulario para la siguiente (Ctrl + Shift + Enter)"
            >
              <PlusCircle size={13} />
              <span>Cargar otra</span>
              <kbd className="hidden lg:inline text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-zinc-700">
                Ctrl+⇧+↵
              </kbd>
            </button>

            <button
              type="button"
              disabled={submitting || !isFormValid}
              onClick={() => submitProduct("AVAILABLE")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-extrabold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              title="Publicar pieza disponible en la tienda (Ctrl + Enter)"
            >
              {submitting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              <span>Publicar</span>
              <kbd className="hidden lg:inline text-[9px] bg-amber-500 text-zinc-950 px-1.5 py-0.5 rounded font-mono font-bold">
                Ctrl+↵
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Error */}
      {formError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs space-y-2 animate-in fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertCircle size={16} />
              <span>{formError.message}</span>
            </div>
            <button
              type="button"
              disabled={submitting || !isFormValid}
              onClick={() => submitProduct("AVAILABLE")}
              className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-rose-900/90 hover:bg-rose-850 border border-rose-700/80 text-rose-100 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Reintentar publicación
            </button>
          </div>
          {formError.details && (
            <p className="text-rose-300/80 pl-6">{formError.details}</p>
          )}
        </div>
      )}

      {/* Notificación de Borrador Restaurado */}
      {hasRestoredDraft && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-amber-200 text-xs animate-in fade-in"
        >
          <div className="flex items-center gap-2 min-w-0">
            <RotateCcw size={15} className="text-amber-400 shrink-0" />
            <span className="truncate">
              Borrador local recuperado. Podés continuar tu edición o descartarlo si no lo necesitás.
            </span>
          </div>
          <button
            type="button"
            onClick={discardDraft}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
          >
            Descartar borrador
          </button>
        </div>
      )}

      {/* Layout Principal: Desktop (Split 7:5) / Mobile (Acordeón Inteligente) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Formulario (7 columnas en desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* PASO 1: FOTOS Y CÁMARA */}
          <section
            aria-labelledby="heading-step-1"
            className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xs transition-colors"
          >
            <button
              type="button"
              id="heading-step-1"
              aria-expanded={mobileStep === 1}
              onClick={() => setMobileStep(mobileStep === 1 ? 0 : 1)}
              className="w-full flex items-center justify-between p-4.5 text-left bg-zinc-900 hover:bg-zinc-850/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300">
                  {photos.length > 0 ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <span>1</span>
                  )}
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Fotos de la prenda
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {photos.length === 0
                      ? "Arrastrá fotos, pegá con Ctrl+V o usá la cámara"
                      : `${photos.length} ${photos.length === 1 ? "foto cargada" : "fotos cargadas"}`}
                  </p>
                </div>
              </div>

              <ChevronDown
                size={16}
                className={`text-zinc-400 transition-transform lg:hidden ${
                  mobileStep === 1 ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`p-4.5 pt-0 border-t border-zinc-800/60 ${
                mobileStep === 1 ? "block" : "hidden lg:block"
              }`}
            >
              <MediaUploaderStep
                photos={photos}
                onPhotosChange={(updated) => {
                  setPhotos(updated);
                  if (photos.length === 0 && updated.length > 0) {
                    setMobileStep(2);
                  }
                }}
                onError={(msg, details) => {
                  setFormError({
                    type: "TECHNICAL",
                    code: "ERR_IMAGE_PROCESSING",
                    message: msg,
                    details,
                  });
                }}
              />
            </div>
          </section>

          {/* PASO 2: DATOS BÁSICOS Y PRECIO */}
          <section
            aria-labelledby="heading-step-2"
            className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xs transition-colors"
          >
            <button
              type="button"
              id="heading-step-2"
              aria-expanded={mobileStep === 2}
              onClick={() => setMobileStep(mobileStep === 2 ? 0 : 2)}
              className="w-full flex items-center justify-between p-4.5 text-left bg-zinc-900 hover:bg-zinc-850/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300">
                  {isTitleValid && isPriceValid ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <span>2</span>
                  )}
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Datos básicos y precio
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {title ? title : "Nombre, precio de venta y categoría"}
                  </p>
                </div>
              </div>

              <ChevronDown
                size={16}
                className={`text-zinc-400 transition-transform lg:hidden ${
                  mobileStep === 2 ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`p-4.5 pt-0 border-t border-zinc-800/60 ${
                mobileStep === 2 ? "block" : "hidden lg:block"
              }`}
            >
              <BasicDataStep
                title={title}
                onTitleChange={setTitle}
                titleInputRef={titleInputRef}
                pricePesos={pricePesos}
                onPriceChange={setPricePesos}
                compareAtPricePesos={compareAtPricePesos}
                onCompareAtPriceChange={setCompareAtPricePesos}
                isConsultPrice={isConsultPrice}
                onConsultPriceChange={setIsConsultPrice}
                categories={categoriesList}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={setSelectedCategoryId}
                onCategoryCreated={(newCat) => {
                  setCategoriesList((prev) => [...prev, newCat]);
                }}
              />
            </div>
          </section>

          {/* PASO 3: TALLES Y STOCK (80% PIEZA ÚNICA) */}
          <section
            aria-labelledby="heading-step-3"
            className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xs transition-colors"
          >
            <button
              type="button"
              id="heading-step-3"
              aria-expanded={mobileStep === 3}
              onClick={() => setMobileStep(mobileStep === 3 ? 0 : 3)}
              className="w-full flex items-center justify-between p-4.5 text-left bg-zinc-900 hover:bg-zinc-850/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300">
                  {totalStockCount > 0 ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <span>3</span>
                  )}
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Talle y Stock
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {isSinglePiece
                      ? `Pieza única · Talle ${colors[0]?.sizes[0]?.size || "ÚNICO"}`
                      : `${totalStockCount} unidades en variantes`}
                  </p>
                </div>
              </div>

              <ChevronDown
                size={16}
                className={`text-zinc-400 transition-transform lg:hidden ${
                  mobileStep === 3 ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`p-4.5 pt-0 border-t border-zinc-800/60 ${
                mobileStep === 3 ? "block" : "hidden lg:block"
              }`}
            >
              <StockVariantsStep
                isSinglePiece={isSinglePiece}
                onToggleSinglePiece={setIsSinglePiece}
                colors={colors}
                onColorsChange={setColors}
                categoryName={selectedCategoryObj?.name}
              />
            </div>
          </section>

          {/* PASO 4: VISIBILIDAD Y OPCIONES */}
          <section
            aria-labelledby="heading-step-4"
            className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xs transition-colors"
          >
            <button
              type="button"
              id="heading-step-4"
              aria-expanded={mobileStep === 4}
              onClick={() => setMobileStep(mobileStep === 4 ? 0 : 4)}
              className="w-full flex items-center justify-between p-4.5 text-left bg-zinc-900 hover:bg-zinc-850/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300">
                  <span>4</span>
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Opciones y visibilidad
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {initialStatus === "AVAILABLE" ? "Disponible" : "Borrador"}
                    {isFeatured ? " · Destacado en portada" : ""}
                  </p>
                </div>
              </div>

              <ChevronDown
                size={16}
                className={`text-zinc-400 transition-transform lg:hidden ${
                  mobileStep === 4 ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`p-4.5 pt-0 border-t border-zinc-800/60 ${
                mobileStep === 4 ? "block" : "hidden lg:block"
              }`}
            >
              <ProductAttributesStep
                initialStatus={initialStatus}
                onStatusChange={setInitialStatus}
                isFeatured={isFeatured}
                onFeaturedChange={setIsFeatured}
                allowReturn={allowReturn}
                onAllowReturnChange={setAllowReturn}
                attributes={attributes}
                onAttributeChange={(k, v) => setAttributes((prev) => ({ ...prev, [k]: v }))}
                attributeDefinitions={attrDefs}
                onAttributeDefinitionsChange={setAttrDefs}
              />
            </div>
          </section>
        </div>

        {/* Columna Derecha: Vista Previa Fija Sticky en Desktop (5 columnas) */}
        <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-4">
          <ProductPreviewCard
            title={deferredTitle}
            pricePesos={deferredPricePesos}
            isConsultPrice={isConsultPrice}
            categoryName={selectedCategoryObj?.name || "Categoría"}
            photos={photos}
            initialStatus={initialStatus}
            isFeatured={isFeatured}
            colors={colors}
          />
        </div>
      </div>

      {/* Modal Bottom Sheet de Vista Previa para Mobile */}
      <MobileProductPreviewSheet
        isOpen={isMobilePreviewOpen}
        onClose={() => setIsMobilePreviewOpen(false)}
        title={title}
        pricePesos={pricePesos}
        isConsultPrice={isConsultPrice}
        categoryName={selectedCategoryObj?.name || "Categoría"}
        photos={photos}
        initialStatus={initialStatus}
        isFeatured={isFeatured}
        colors={colors}
      />

      {/* Barra de Acciones Fija (Sticky Bottom Bar) */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 py-3 px-4 md:px-8 shadow-2xl transition-all duration-200 ${
          isKeyboardOpen ? "opacity-30 sm:opacity-100 pointer-events-none sm:pointer-events-auto" : "opacity-100"
        }`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Botón flotante de vista previa (Mobile) + Estado de validación */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobilePreviewOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-300 text-xs font-bold cursor-pointer"
            >
              <Eye size={14} />
              <span>Ver preview</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs">
              {isFormValid ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 size={15} />
                  <span>
                    Listo para publicar · {totalStockCount} unid.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                  <AlertTriangle size={15} />
                  <span>
                    Falta: <strong>{missingFieldsList.join(", ")}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={() => submitProduct("RESERVED")}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              title="Guardar como borrador para editar luego"
            >
              Borrador
            </button>

            <button
              type="button"
              disabled={submitting || !isFormValid}
              onClick={() => submitProduct(undefined, true)}
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              title="Publicar y cargar siguiente (Ctrl + Shift + Enter)"
            >
              <PlusCircle size={14} />
              <span>Publicar y cargar otra</span>
              <kbd className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-zinc-700">
                Ctrl+⇧+↵
              </kbd>
            </button>

            <button
              type="button"
              disabled={submitting || !isFormValid}
              onClick={() => submitProduct("AVAILABLE")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-extrabold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              title="Publicar pieza disponible en la tienda (Ctrl + Enter)"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Publicar pieza</span>
                  <kbd className="hidden sm:inline text-[10px] bg-amber-500 text-zinc-950 px-1.5 py-0.5 rounded font-mono font-bold">
                    Ctrl+↵
                  </kbd>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

