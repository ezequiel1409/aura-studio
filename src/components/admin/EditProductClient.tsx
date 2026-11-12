"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Category } from "../../domain/category/types";
import { ProductAttributeDefinition } from "../../domain/navigation/types";
import { Product, ProductStatus } from "../../domain/product/types";
import { parseProductText } from "../../lib/parser/product-parser";
import { ConfirmDeleteProductModal } from "./ConfirmDeleteProductModal";
import { AdminFeedbackBanner } from "./ui/AdminFeedbackBanner";
import { BasicDataStep } from "./products/new/BasicDataStep";
import { MediaUploaderStep, PhotoPreview } from "./products/new/MediaUploaderStep";
import { ProductAttributesStep } from "./products/new/ProductAttributesStep";
import { ColorState, StockVariantsStep } from "./products/new/StockVariantsStep";
import {
  collectUniqueSizesCsv,
  filterLeafCategories,
  parseCompareAtPesosToCents,
  parsePricePesosToCents,
  productToFormDefaults,
  serializeAttributesPayload,
  serializeColorsPayload,
  serializePhotosPayload,
} from "./products/form/product-form.helpers";

interface EditProductClientProps {
  product: Product;
  categories: Category[];
  attributeDefinitions?: ProductAttributeDefinition[];
}

export function EditProductClient({
  product,
  categories,
  attributeDefinitions = [],
}: EditProductClientProps) {
  const router = useRouter();
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const initialDefaults = useMemo(
    () => productToFormDefaults(product, categories),
    [product, categories]
  );

  const [categoriesList, setCategoriesList] = useState<Category[]>(categories);
  const leafCategories = useMemo(
    () => filterLeafCategories(categoriesList),
    [categoriesList]
  );

  const [currentProduct, setCurrentProduct] = useState(product);
  const [rawText, setRawText] = useState(initialDefaults.rawText);
  const [title, setTitle] = useState(initialDefaults.title);
  const [pricePesos, setPricePesos] = useState(initialDefaults.pricePesos);
  const [compareAtPricePesos, setCompareAtPricePesos] = useState(
    initialDefaults.compareAtPricePesos
  );
  const [isConsultPrice, setIsConsultPrice] = useState(
    initialDefaults.isConsultPrice
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    initialDefaults.selectedCategoryId
  );

  const [status, setStatus] = useState<ProductStatus>(initialDefaults.status);
  const [isFeatured, setIsFeatured] = useState<boolean>(
    initialDefaults.isFeatured
  );
  const [allowReturn, setAllowReturn] = useState<boolean>(
    initialDefaults.allowReturn
  );
  const [publishedAtDate, setPublishedAtDate] = useState<string>(
    initialDefaults.publishedAtDate
  );

  const [attrDefs, setAttrDefs] = useState<ProductAttributeDefinition[]>(
    attributeDefinitions || []
  );
  const [attributes, setAttributes] = useState<Record<string, string>>(
    initialDefaults.attributes
  );

  const [isSinglePiece, setIsSinglePiece] = useState<boolean>(
    initialDefaults.isSinglePiece
  );
  const [colors, setColors] = useState<ColorState[]>(initialDefaults.colors);
  const [photos, setPhotos] = useState<PhotoPreview[]>(initialDefaults.photos);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const codeFormatted = `#${String(product.code).padStart(3, "0")}`;
  const currentCategoryName =
    categoriesList.find((c) => c.id === selectedCategoryId)?.name || "";

  const handleReParseText = () => {
    if (!rawText.trim()) return;
    const parsed = parseProductText(rawText);
    const manualFields = new Set(product.manualFields || []);

    if (!manualFields.has("title") && parsed.title) {
      setTitle(parsed.title);
    }
    if (!manualFields.has("priceCents") && parsed.priceCents !== null) {
      setPricePesos(String(parsed.priceCents / 100));
      setIsConsultPrice(false);
    }
    if (!manualFields.has("categoryId") && parsed.suggestedCategorySlug) {
      const suggested = categoriesList.find(
        (c) => c.slug === parsed.suggestedCategorySlug
      );
      if (suggested && leafCategories.some((leaf) => leaf.id === suggested.id)) {
        setSelectedCategoryId(suggested.id);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      const priceCents = isConsultPrice ? null : parsePricePesosToCents(pricePesos);
      const compareAtPriceCents = isConsultPrice
        ? null
        : parseCompareAtPesosToCents(compareAtPricePesos);

      const payload = {
        rawText,
        title: title.trim() || null,
        priceCents,
        compareAtPriceCents,
        size: collectUniqueSizesCsv(colors) || undefined,
        categoryId: selectedCategoryId,
        status,
        isFeatured,
        allowReturn,
        publishedAt: publishedAtDate
          ? Date.parse(`${publishedAtDate}T12:00:00.000Z`)
          : null,
        attributes: serializeAttributesPayload(attributes),
        colors: serializeColorsPayload(colors),
        photos: serializePhotosPayload(photos),
      };

      abortControllerRef.current = new AbortController();
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar el producto.");
      }

      if (!isMountedRef.current) return;
      if (data.product) {
        setCurrentProduct(data.product);
      }
      setSavedSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Error al guardar";
      setErrorMessage(msg);
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Barra Superior de Navegación */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 p-1"
          aria-label="Volver al catálogo de productos"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Volver al catálogo de productos</span>
        </Link>

        <a
          href={`/p/${String(product.code).padStart(3, "0")}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-amber-200 hover:text-amber-100 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 p-1"
          aria-label={`Ver ficha pública del producto ${codeFormatted} en una pestaña nueva`}
        >
          <span>Ver ficha pública</span>
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>

      {/* Cabecera del Editor */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-200/20 text-amber-300 border border-amber-300/30">
            {codeFormatted}
          </span>
          <span className="text-xs uppercase font-bold tracking-widest text-zinc-400">
            Edición Completa
          </span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-zinc-100 mt-1">
          {title.trim() || currentProduct.title || `Producto ${codeFormatted}`}
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Modificá texto crudo, variantes de color, stock y fotos sin perder datos editados a mano.
        </p>
      </div>

      {/* Formulario Principal */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Sección: Texto Crudo Original (BR-05, BR-33) */}
        <section className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="edit-raw-text"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              Texto Crudo Original
            </label>
            <button
              type="button"
              onClick={handleReParseText}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-200 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
              title="Volver a extraer datos sugeridos respetando tus correcciones manuales"
              aria-label="Reinterpretar texto crudo del producto"
            >
              <Sparkles size={13} aria-hidden="true" />
              <span>Reinterpretar texto</span>
            </button>
          </div>
          <textarea
            id="edit-raw-text"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={4}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 font-sans focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 transition-all"
            placeholder="Pegá o editá la descripción cruda del producto..."
          />
          <p className="text-[11px] text-zinc-500">
            Al editar el texto crudo, podés pulsar &quot;Reinterpretar texto&quot; para proponer nuevos datos sin pisar lo que hayas corregido a mano.
          </p>
        </section>

        {/* Sección: Datos Principales */}
        <section className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Datos Principales
          </h2>
          <BasicDataStep
            title={title}
            onTitleChange={setTitle}
            pricePesos={pricePesos}
            onPriceChange={setPricePesos}
            compareAtPricePesos={compareAtPricePesos}
            onCompareAtPriceChange={setCompareAtPricePesos}
            isConsultPrice={isConsultPrice}
            onConsultPriceChange={setIsConsultPrice}
            categories={leafCategories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            onCategoryCreated={(cat) =>
              setCategoriesList((prev) => [...prev, cat])
            }
          />
        </section>

        {/* Sección: Galería de Fotos */}
        <section className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Fotos del Producto
          </h2>
          <MediaUploaderStep
            photos={photos}
            onPhotosChange={setPhotos}
            onError={(msg) => setErrorMessage(msg)}
          />
        </section>

        {/* Sección: Variantes y Stock */}
        <section className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Variantes de Color, Talles y Stock
          </h2>
          <StockVariantsStep
            isSinglePiece={isSinglePiece}
            onToggleSinglePiece={setIsSinglePiece}
            colors={colors}
            onColorsChange={setColors}
            categoryName={currentCategoryName}
          />
        </section>

        {/* Sección: Visibilidad y Atributos */}
        <section className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Visibilidad, Políticas y Especificaciones
          </h2>
          <ProductAttributesStep
            initialStatus={status}
            onStatusChange={setStatus}
            allowSoldOut
            publishedAtDate={publishedAtDate}
            onPublishedAtDateChange={setPublishedAtDate}
            isFeatured={isFeatured}
            onFeaturedChange={setIsFeatured}
            allowReturn={allowReturn}
            onAllowReturnChange={setAllowReturn}
            attributes={attributes}
            onAttributeChange={(k, v) =>
              setAttributes((prev) => ({ ...prev, [k]: v }))
            }
            attributeDefinitions={attrDefs}
            onAttributeDefinitionsChange={setAttrDefs}
          />
        </section>

        {errorMessage && (
          <AdminFeedbackBanner
            type="error"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        {savedSuccess && (
          <div className="space-y-2">
            <AdminFeedbackBanner
              type="ok"
              message="Producto actualizado con éxito en el catálogo."
              onDismiss={() => setSavedSuccess(false)}
            />
            <div className="flex justify-end">
              <Link
                href="/admin/productos"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:underline font-semibold"
              >
                <span>Volver a la lista de productos</span>
                <ArrowLeft size={13} className="rotate-180" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-850">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-900/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 hover:text-rose-100 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
          >
            <Trash2 size={15} aria-hidden="true" />
            <span>Remover producto</span>
          </button>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/productos"
              className="px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-200 text-zinc-950 font-bold text-xs hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-amber-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={16} aria-hidden="true" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {showDeleteModal && (
        <ConfirmDeleteProductModal
          product={product}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => {
            router.push("/admin/productos");
          }}
        />
      )}
    </div>
  );
}
