"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Eye,
  History,
  MessageCircle,
  Package,
  Plus,
  Search,
  Tag,
  ExternalLink,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  Star,
  FolderInput,
  RefreshCw,
  X,
} from "lucide-react";
import { Category } from "../../domain/category/types";
import { Product, ProductStatus } from "../../domain/product/types";
import { formatPriceARS } from "../../lib/format/currency";
import { UndoAction, UndoToast } from "./UndoToast";
import { StatusHistoryModal } from "./StatusHistoryModal";
import { useBackofficeStore } from "../../stores/backoffice.store";

interface ProductListClientProps {
  initialProducts: Product[];
  categories: Category[];
  initialFilter?: string;
  initialStatus?: string;
}

export function ProductListClient({
  initialProducts,
  categories,
  initialFilter = "todas",
  initialStatus,
}: ProductListClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (initialStatus === "AVAILABLE") return "disponibles";
    if (initialStatus === "RESERVED") return "reservadas";
    if (initialStatus === "SOLD_OUT") return "agotadas";
    return initialFilter || "todas";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime] = useState(() => Date.now());

  // Integración con Zustand para selección múltiple y estado de lote (AR-10, BR-29)
  const {
    selectedProductIds,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,
    isProductSelected,
    isBulkProcessing,
    setBulkProcessing,
  } = useBackofficeStore();

  // Estado para Deshacer (BR-28)
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  // Estado para Modal de Historial (BR-28)
  const [historyTarget, setHistoryTarget] = useState<{
    id: number;
    code: number;
    title: string | null;
  } | null>(null);

  // Estados de control para acciones en lote flotantes
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);

  // Mapa de categorías para búsqueda rápida de nombre
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  // Categorías hoja disponibles para mover prendas (BR-15: prendas solo en nodos hoja)
  const leafCategories = useMemo(() => {
    const parentIds = new Set(categories.map((c) => c.parentId).filter(Boolean));
    return categories.filter((c) => !parentIds.has(c.id));
  }, [categories]);

  // ID de la categoría "Sin clasificar"
  const uncategorizedId = useMemo(() => {
    const unc = categories.find((c) => c.slug === "sin-clasificar");
    return unc ? unc.id : 0;
  }, [categories]);

  // Filtrado reactivo en el cliente
  const filteredProducts = useMemo(() => {
    const twentyThreeDaysMs = 23 * 24 * 60 * 60 * 1000;

    return products.filter((p) => {
      // 1. Filtro por pestaña
      if (activeTab === "destacadas" && !p.isFeatured) return false;
      if (activeTab === "disponibles" && p.status !== "AVAILABLE") return false;
      if (activeTab === "reservadas" && p.status !== "RESERVED") return false;
      if (activeTab === "agotadas" && p.status !== "SOLD_OUT") return false;
      if (activeTab === "por_vencer") {
        if (p.status !== "SOLD_OUT") return false;
        if (!p.soldOutAt || p.soldOutAt > currentTime - twentyThreeDaysMs) return false;
      }
      if (activeTab === "sin_clasificar" && p.categoryId !== uncategorizedId) return false;
      if (activeTab === "sin_precio" && p.priceCents !== null) return false;

      // 2. Búsqueda por texto o código (#001 o 001)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const codeStr = String(p.code);
        const codePadded = `#${codeStr.padStart(3, "0")}`.toLowerCase();
        const matchesCode =
          codeStr.includes(query.replace(/^#/, "")) ||
          codePadded.includes(query);
        const matchesTitle = p.title?.toLowerCase().includes(query);
        const matchesRaw = p.rawText.toLowerCase().includes(query);

        return matchesCode || matchesTitle || matchesRaw;
      }

      return true;
    });
  }, [products, activeTab, searchQuery, uncategorizedId, currentTime]);

  // Todos los IDs filtrados seleccionados actualmente
  const allFilteredSelected = useMemo(() => {
    if (filteredProducts.length === 0) return false;
    return filteredProducts.every((p) => selectedProductIds.includes(p.id));
  }, [filteredProducts, selectedProductIds]);

  // Alternar selección de todas las prendas filtradas (BR-29)
  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      clearSelection();
    } else {
      selectAllProducts(filteredProducts.map((p) => p.id));
    }
  };

  // Cambio de estado rápido en un toque (BR-27)
  const handleStatusChange = async (productId: number, newStatus: ProductStatus) => {
    const target = products.find((p) => p.id === productId);
    if (!target || target.status === newStatus) return;

    const previousStatus = target.status;

    try {
      const res = await fetch("/api/admin/products/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || "No se pudo cambiar el estado.");
        return;
      }

      // Actualizar estado local de inmediato
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? data.product : p))
      );

      // Disparar barra de Deshacer (BR-28)
      const statusLabels: Record<ProductStatus, string> = {
        AVAILABLE: "Disponible",
        RESERVED: "Reservada",
        SOLD_OUT: "Agotada",
      };

      setUndoAction({
        id: `undo-${Date.now()}`,
        productId,
        productCode: target.code,
        fromStatus: previousStatus,
        toStatus: newStatus,
        message: `Prenda #${String(target.code).padStart(3, "0")} marcada como ${statusLabels[newStatus]}`,
      });
    } catch {
      alert("Error al conectar con el servidor.");
    }
  };

  // Deshacer cambio de estado (BR-28)
  const handleUndo = async (action: UndoAction) => {
    try {
      const res = await fetch("/api/admin/products/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: action.productId }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === action.productId ? data.product : p))
        );
      } else {
        alert(data.error || "No se pudo revertir el estado.");
      }
    } catch {
      alert("Error al revertir el estado.");
    }
  };

  // Eliminar una prenda individual con confirmación (BR-34, BR-37)
  const handleDeleteProduct = async (product: Product) => {
    const codeFormatted = `#${String(product.code).padStart(3, "0")}`;
    const confirmed = window.confirm(
      `¿Estás segura de eliminar la prenda ${codeFormatted} (${product.title || "Sin título"})? Esta acción no se puede deshacer y su código correlativo no será reutilizado.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        if (isProductSelected(product.id)) {
          toggleProductSelection(product.id);
        }
      } else {
        alert(data.error || "No se pudo eliminar la prenda.");
      }
    } catch {
      alert("Error de conexión al eliminar la prenda.");
    }
  };

  // Acciones en Lote (BR-29)
  const handleBulkStatus = async (newStatus: ProductStatus) => {
    if (selectedProductIds.length === 0) return;
    setBulkProcessing(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          productIds: selectedProductIds,
          newStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            selectedProductIds.includes(p.id)
              ? {
                  ...p,
                  status: newStatus,
                  soldOutAt: newStatus === "SOLD_OUT" ? Date.now() : null,
                }
              : p
          )
        );
        clearSelection();
        setBulkStatusOpen(false);
      } else {
        alert(data.error || "Error al aplicar estado en lote.");
      }
    } catch {
      alert("Error de conexión con el servidor.");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkMoveCategory = async (targetCategoryId: number) => {
    if (selectedProductIds.length === 0) return;
    setBulkProcessing(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "category",
          productIds: selectedProductIds,
          targetCategoryId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            selectedProductIds.includes(p.id)
              ? { ...p, categoryId: targetCategoryId }
              : p
          )
        );
        clearSelection();
        setBulkCategoryOpen(false);
      } else {
        alert(data.error || "Error al mover categorías en lote.");
      }
    } catch {
      alert("Error de conexión con el servidor.");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    const confirmed = window.confirm(
      `¿Estás segura de eliminar permanentemente ${selectedProductIds.length} prenda(s) seleccionada(s)? Esta acción es destructiva e irreversible.`
    );
    if (!confirmed) return;

    setBulkProcessing(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          productIds: selectedProductIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setProducts((prev) =>
          prev.filter((p) => !selectedProductIds.includes(p.id))
        );
        clearSelection();
      } else {
        alert(data.error || "Error al eliminar prendas en lote.");
      }
    } catch {
      alert("Error de conexión con el servidor.");
    } finally {
      setBulkProcessing(false);
    }
  };

  // Alternar estado de Destacada en un clic
  const handleToggleFeatured = async (productId: number) => {
    try {
      const res = await fetch("/api/admin/products/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || "No se pudo actualizar el estado de destacado.");
        return;
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? data.product : p))
      );
    } catch {
      alert("Error de conexión con el servidor.");
    }
  };

  // Marcar / desmarcar destacadas en lote
  const handleBulkFeatured = async (isFeatured: boolean) => {
    if (selectedProductIds.length === 0) return;
    setBulkProcessing(true);

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "featured",
          productIds: selectedProductIds,
          isFeatured,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || "Error al procesar la acción en lote.");
        return;
      }

      setProducts((prev) =>
        prev.map((p) =>
          selectedProductIds.includes(p.id) ? { ...p, isFeatured } : p
        )
      );
      clearSelection();
    } catch {
      alert("Error de conexión con el servidor.");
    } finally {
      setBulkProcessing(false);
    }
  };

  const featuredCount = useMemo(
    () => products.filter((p) => p.isFeatured).length,
    [products]
  );

  const tabs = [
    { id: "todas", label: "Todas" },
    { id: "destacadas", label: `⭐ Destacadas (${featuredCount})` },
    { id: "disponibles", label: "Disponibles" },
    { id: "reservadas", label: "Reservadas" },
    { id: "agotadas", label: "Agotadas" },
    { id: "por_vencer", label: "Por vencer" },
    { id: "sin_clasificar", label: "Sin clasificar" },
    { id: "sin_precio", label: "Sin precio" },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Cabecera & Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-100">
            Lista de Prendas
          </h1>
          <p className="text-xs text-zinc-400">
            Gestioná stock, estados, edición completa, acciones en lote e historial (BR-27, BR-29, BR-33).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filteredProducts.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              aria-label={
                allFilteredSelected
                  ? "Deseleccionar todas las prendas filtradas"
                  : `Seleccionar todas las ${filteredProducts.length} prendas filtradas`
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium text-xs hover:bg-zinc-800 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              {allFilteredSelected ? (
                <>
                  <CheckSquare size={15} className="text-amber-300" aria-hidden="true" />
                  <span>Deseleccionar todas</span>
                </>
              ) : (
                <>
                  <Square size={15} className="text-zinc-500" aria-hidden="true" />
                  <span>Seleccionar todas ({filteredProducts.length})</span>
                </>
              )}
            </button>
          )}

          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-200 text-zinc-950 font-semibold text-xs hover:bg-amber-100 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <Plus size={16} aria-hidden="true" />
            <span>+ Cargar Prenda</span>
          </Link>
        </div>
      </div>

      {/* Buscador & Pestañas Táctiles */}
      <div className="space-y-3">
        {/* Input de Búsqueda */}
        <div className="relative">
          <input
            id="search-products-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (#023), título o descripción..."
            aria-label="Buscar prendas por código, título o descripción"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400 transition-all"
          />
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3.5 top-3 text-zinc-500 pointer-events-none"
          />
        </div>

        {/* Chips de Filtros (Scroll horizontal en móviles) */}
        <div
          role="tablist"
          aria-label="Filtros de estado de prendas"
          className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-medium transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  isActive
                    ? "bg-amber-200 text-zinc-950 font-bold shadow-sm"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Listado de Prendas */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-2">
          <Package size={32} className="mx-auto text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-300">
            No se encontraron prendas con los filtros seleccionados
          </p>
          <p className="text-xs text-zinc-500">
            Probá limpiando el buscador o cambiando de pestaña.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((p) => {
            const codeFormatted = `#${String(p.code).padStart(3, "0")}`;
            const category = categoryMap.get(p.categoryId);
            const thumbUrl = p.photos?.[0]?.keyThumb;
            const isSelected = isProductSelected(p.id);

            // Cálculo de purga (BR-31)
            let daysUntilPurge: number | null = null;
            let isExpiringSoon = false;
            if (p.status === "SOLD_OUT" && p.soldOutAt) {
              const elapsedDays = Math.floor(
                (currentTime - p.soldOutAt) / (24 * 60 * 60 * 1000)
              );
              daysUntilPurge = Math.max(0, 30 - elapsedDays);
              isExpiringSoon = daysUntilPurge <= 7;
            }

            // Total de stock acumulado de variantes
            const totalStock = (p.colors || []).reduce((acc, col) => {
              return acc + (col.sizes || []).reduce((sAcc, sz) => sAcc + sz.stock, 0);
            }, 0);

            return (
              <div
                key={p.id}
                className={`border rounded-2xl p-4 transition-all space-y-3.5 backdrop-blur-sm ${
                  isSelected
                    ? "bg-amber-950/20 border-amber-500/60 shadow-sm"
                    : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700/80"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Checkbox de Selección Múltiple (BR-29) */}
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={() => toggleProductSelection(p.id)}
                    className="pt-1 text-zinc-500 hover:text-amber-200 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-md"
                    title={isSelected ? "Deseleccionar prenda" : "Seleccionar para acción en lote"}
                    aria-label={`${isSelected ? "Deseleccionar" : "Seleccionar"} prenda #${codeFormatted} ${p.title || ""}`}
                  >
                    {isSelected ? (
                      <CheckSquare size={20} className="text-amber-300" aria-hidden="true" />
                    ) : (
                      <Square size={20} className="text-zinc-600 hover:text-zinc-400" aria-hidden="true" />
                    )}
                  </button>

                  {/* Foto miniatura o placeholder */}
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={p.title || codeFormatted}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600" aria-hidden="true">
                        <Package size={20} />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-950/80 text-amber-200">
                      {codeFormatted}
                    </span>
                  </div>

                  {/* Datos principales */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-bold text-zinc-100 truncate">
                          {p.title || "Prenda sin título"}
                        </h3>
                        {p.isFeatured && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                            <Star size={10} className="fill-amber-300" aria-hidden="true" />
                            <span>Destacada</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Botón Destacar en un toque */}
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(p.id)}
                          className={`p-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                            p.isFeatured
                              ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                              : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"
                          }`}
                          title={p.isFeatured ? "Quitar de destacados" : "Destacar en showroom"}
                          aria-label={
                            p.isFeatured
                              ? `Quitar prenda #${codeFormatted} de destacados`
                              : `Destacar prenda #${codeFormatted} en el catálogo`
                          }
                        >
                          <Star
                            size={14}
                            className={p.isFeatured ? "fill-amber-400 text-amber-400" : ""}
                            aria-hidden="true"
                          />
                        </button>

                        {/* Botón Editar Ficha Completa (BR-33) */}
                        <Link
                          href={`/admin/productos/${p.code}/editar`}
                          className="text-zinc-400 hover:text-amber-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                          title="Editar prenda completa"
                          aria-label={`Editar ficha de prenda #${codeFormatted} ${p.title || ""}`}
                        >
                          <Edit2 size={14} aria-hidden="true" />
                        </Link>

                        {/* Botón Eliminar Manual (BR-34, BR-37) */}
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="text-zinc-500 hover:text-rose-400 p-1 rounded-lg hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                          title="Eliminar prenda"
                          aria-label={`Eliminar prenda #${codeFormatted} ${p.title || ""}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>

                        <a
                          href={`/p/${String(p.code).padStart(3, "0")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-500 hover:text-amber-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                          title="Ver en la tienda"
                          aria-label={`Ver prenda #${codeFormatted} en la tienda pública (abre en nueva pestaña)`}
                        >
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      </div>
                    </div>

                    <p className="text-xs font-mono font-semibold text-amber-200">
                      {p.priceCents !== null
                        ? formatPriceARS(p.priceCents, p.currency)
                        : "Consultar precio"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Tag size={11} className="text-zinc-500" aria-hidden="true" />
                        <span>{category?.name || "Sin clasificar"}</span>
                      </span>

                      <span aria-hidden="true">•</span>

                      <span>Stock total: <strong className="text-zinc-200">{totalStock}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Métricas y Alerta de Purga */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-xs">
                  {/* Métricas privadas de Backoffice (BR-39) */}
                  <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                    <span
                      className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
                      title="Visitas totales a la ficha de la prenda"
                      aria-label={`${p.stats?.viewsCount ?? 0} visitas registradas a la prenda`}
                    >
                      <Eye size={13} className="text-zinc-500" aria-hidden="true" />
                      <span>{p.stats?.viewsCount ?? 0} vistas</span>
                    </span>

                    <span
                      className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
                      title="Consultas iniciadas por WhatsApp"
                      aria-label={`${p.stats?.whatsappClicks ?? 0} clics de consulta por WhatsApp`}
                    >
                      <MessageCircle size={13} className="text-emerald-400/80" aria-hidden="true" />
                      <span>{p.stats?.whatsappClicks ?? 0} WhatsApp</span>
                    </span>
                  </div>

                  {/* Alerta de Purga a los 30 días (BR-31) */}
                  {daysUntilPurge !== null && (
                    <div
                      className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border ${
                        isExpiringSoon
                          ? "bg-rose-950/40 text-rose-300 border-rose-800"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {isExpiringSoon ? (
                        <AlertTriangle size={12} className="text-rose-400" aria-hidden="true" />
                      ) : (
                        <Clock size={12} aria-hidden="true" />
                      )}
                      <span>
                        Se purga en {daysUntilPurge} {daysUntilPurge === 1 ? "día" : "días"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones de Estado de un Toque & Historial (BR-27, BR-28) */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {/* Selector rápido de 3 botones */}
                  <div
                    role="group"
                    aria-label={`Cambiar estado de la prenda #${codeFormatted}`}
                    className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs"
                  >
                    <button
                      type="button"
                      aria-pressed={p.status === "AVAILABLE"}
                      aria-label={`Marcar prenda #${codeFormatted} como Disponible`}
                      onClick={() => handleStatusChange(p.id, "AVAILABLE")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                        p.status === "AVAILABLE"
                          ? "bg-emerald-500 text-zinc-950 font-bold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Disponible
                    </button>

                    <button
                      type="button"
                      aria-pressed={p.status === "RESERVED"}
                      aria-label={`Marcar prenda #${codeFormatted} como Reservada`}
                      onClick={() => handleStatusChange(p.id, "RESERVED")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                        p.status === "RESERVED"
                          ? "bg-amber-400 text-zinc-950 font-bold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Reservada
                    </button>

                    <button
                      type="button"
                      aria-pressed={p.status === "SOLD_OUT"}
                      aria-label={`Marcar prenda #${codeFormatted} como Agotada`}
                      onClick={() => handleStatusChange(p.id, "SOLD_OUT")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none ${
                        p.status === "SOLD_OUT"
                          ? "bg-zinc-700 text-zinc-100 font-bold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Agotada
                    </button>
                  </div>

                  {/* Botón de Historial (BR-28) */}
                  <button
                    type="button"
                    onClick={() =>
                      setHistoryTarget({
                        id: p.id,
                        code: p.code,
                        title: p.title,
                      })
                    }
                    className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-amber-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                    title="Ver historial de cambios de estado"
                    aria-label={`Ver historial de cambios de estado para prenda #${codeFormatted}`}
                  >
                    <History size={13} aria-hidden="true" />
                    <span className="hidden sm:inline">Historial</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Barra Flotante de Acciones en Lote (BR-29, AR-10 Zustand) */}
      {selectedProductIds.length > 0 && (
        <aside
          aria-label="Barra de acciones en lote para prendas seleccionadas"
          className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-50 bg-zinc-950/95 border border-amber-400/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-zinc-950 font-bold text-xs"
              aria-hidden="true"
            >
              {selectedProductIds.length}
            </span>
            <span className="font-semibold text-zinc-200">
              {selectedProductIds.length === 1 ? "1 prenda seleccionada" : `${selectedProductIds.length} prendas seleccionadas`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Cambiar Estado en Lote */}
            <div className="relative">
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={bulkStatusOpen}
                aria-label="Cambiar estado de prendas seleccionadas en lote"
                onClick={() => {
                  setBulkStatusOpen(!bulkStatusOpen);
                  setBulkCategoryOpen(false);
                }}
                disabled={isBulkProcessing}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <RefreshCw size={13} aria-hidden="true" />
                <span>Estado</span>
              </button>

              {bulkStatusOpen && (
                <div
                  role="menu"
                  aria-label="Opciones de estado para lote"
                  className="absolute bottom-full mb-2 left-0 w-36 bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-xl space-y-1"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleBulkStatus("AVAILABLE")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-emerald-300 hover:bg-zinc-800 transition-colors text-xs font-semibold focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  >
                    Disponible
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleBulkStatus("RESERVED")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-amber-300 hover:bg-zinc-800 transition-colors text-xs font-semibold focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  >
                    Reservada
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleBulkStatus("SOLD_OUT")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors text-xs font-semibold focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  >
                    Agotada
                  </button>
                </div>
              )}
            </div>

            {/* Mover Categoría en Lote */}
            <div className="relative">
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={bulkCategoryOpen}
                aria-label="Mover prendas seleccionadas a otra categoría en lote"
                onClick={() => {
                  setBulkCategoryOpen(!bulkCategoryOpen);
                  setBulkStatusOpen(false);
                }}
                disabled={isBulkProcessing}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <FolderInput size={13} aria-hidden="true" />
                <span>Mover</span>
              </button>

              {bulkCategoryOpen && (
                <div
                  role="menu"
                  aria-label="Opciones de categoría para lote"
                  className="absolute bottom-full mb-2 left-0 w-48 max-h-56 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-xl space-y-1"
                >
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500">
                    Mover a:
                  </div>
                  {leafCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleBulkMoveCategory(c.id)}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 transition-colors text-xs truncate focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destacar en Lote */}
            <button
              type="button"
              onClick={() => handleBulkFeatured(true)}
              disabled={isBulkProcessing}
              aria-label={`Destacar ${selectedProductIds.length} prenda(s) seleccionada(s) en lote`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-200 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <Star size={13} className="fill-amber-300" aria-hidden="true" />
              <span>Destacar</span>
            </button>

            {/* Eliminar en Lote */}
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isBulkProcessing}
              aria-label={`Eliminar ${selectedProductIds.length} prenda(s) seleccionada(s) en lote`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/70 text-rose-300 border border-rose-800/80 hover:bg-rose-900 transition-colors font-medium focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
            >
              <Trash2 size={13} aria-hidden="true" />
              <span>Eliminar</span>
            </button>

            {/* Limpiar Selección */}
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Cancelar y deseleccionar todas las prendas"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              title="Cancelar selección"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </aside>
      )}

      {/* Toast interactivo para Deshacer (BR-28) */}
      <UndoToast
        action={undoAction}
        onUndo={handleUndo}
        onDismiss={() => setUndoAction(null)}
      />

      {/* Modal de Historial de Estados (BR-28) */}
      {historyTarget && (
        <StatusHistoryModal
          productId={historyTarget.id}
          productCode={historyTarget.code}
          productTitle={historyTarget.title}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
