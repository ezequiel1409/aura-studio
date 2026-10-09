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

  const tabs = [
    { id: "todas", label: "Todas" },
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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium text-xs hover:bg-zinc-800 transition-all"
            >
              {allFilteredSelected ? (
                <>
                  <CheckSquare size={15} className="text-amber-300" />
                  <span>Deseleccionar todas</span>
                </>
              ) : (
                <>
                  <Square size={15} className="text-zinc-500" />
                  <span>Seleccionar todas ({filteredProducts.length})</span>
                </>
              )}
            </button>
          )}

          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-200 text-zinc-950 font-semibold text-xs hover:bg-amber-100 transition-all shadow-sm"
          >
            <Plus size={16} />
            <span>+ Cargar Prenda</span>
          </Link>
        </div>
      </div>

      {/* Buscador & Pestañas Táctiles */}
      <div className="space-y-3">
        {/* Input de Búsqueda */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (#023), título o descripción..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-all"
          />
          <Search
            size={16}
            className="absolute left-3.5 top-3 text-zinc-500 pointer-events-none"
          />
        </div>

        {/* Chips de Filtros (Scroll horizontal en móviles) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-medium transition-all ${
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
                    onClick={() => toggleProductSelection(p.id)}
                    className="pt-1 text-zinc-500 hover:text-amber-200 focus:outline-none transition-colors shrink-0"
                    title={isSelected ? "Deseleccionar prenda" : "Seleccionar para acción en lote"}
                  >
                    {isSelected ? (
                      <CheckSquare size={20} className="text-amber-300" />
                    ) : (
                      <Square size={20} className="text-zinc-600 hover:text-zinc-400" />
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
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
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
                      <h3 className="text-sm font-bold text-zinc-100 truncate">
                        {p.title || "Prenda sin título"}
                      </h3>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Botón Editar Ficha Completa (BR-33) */}
                        <Link
                          href={`/admin/productos/${p.code}/editar`}
                          className="text-zinc-400 hover:text-amber-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                          title="Editar prenda completa"
                        >
                          <Edit2 size={14} />
                        </Link>

                        {/* Botón Eliminar Manual (BR-34, BR-37) */}
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="text-zinc-500 hover:text-rose-400 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                          title="Eliminar prenda"
                        >
                          <Trash2 size={14} />
                        </button>

                        <a
                          href={`/p/${String(p.code).padStart(3, "0")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-500 hover:text-amber-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                          title="Ver en la tienda"
                        >
                          <ExternalLink size={14} />
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
                        <Tag size={11} className="text-zinc-500" />
                        <span>{category?.name || "Sin clasificar"}</span>
                      </span>

                      <span>•</span>

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
                    >
                      <Eye size={13} className="text-zinc-500" />
                      <span>{p.stats?.viewsCount ?? 0} vistas</span>
                    </span>

                    <span
                      className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
                      title="Consultas iniciadas por WhatsApp"
                    >
                      <MessageCircle size={13} className="text-emerald-400/80" />
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
                        <AlertTriangle size={12} className="text-rose-400" />
                      ) : (
                        <Clock size={12} />
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
                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(p.id, "AVAILABLE")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        p.status === "AVAILABLE"
                          ? "bg-emerald-500 text-zinc-950 font-bold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Disponible
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(p.id, "RESERVED")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        p.status === "RESERVED"
                          ? "bg-amber-400 text-zinc-950 font-bold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Reservada
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(p.id, "SOLD_OUT")}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
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
                    className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-amber-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors"
                    title="Ver historial de cambios de estado"
                  >
                    <History size={13} />
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
          aria-label="Acciones en lote"
          className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-50 bg-zinc-950/95 border border-amber-400/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-zinc-950 font-bold text-xs">
              {selectedProductIds.length}
            </span>
            <span className="font-semibold text-zinc-200">
              {selectedProductIds.length === 1 ? "prenda seleccionada" : "prendas seleccionadas"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Cambiar Estado en Lote */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setBulkStatusOpen(!bulkStatusOpen);
                  setBulkCategoryOpen(false);
                }}
                disabled={isBulkProcessing}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
              >
                <RefreshCw size={13} />
                <span>Estado</span>
              </button>

              {bulkStatusOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-36 bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-xl space-y-1">
                  <button
                    type="button"
                    onClick={() => handleBulkStatus("AVAILABLE")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-emerald-300 hover:bg-zinc-800 transition-colors text-xs font-semibold"
                  >
                    Disponible
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatus("RESERVED")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-amber-300 hover:bg-zinc-800 transition-colors text-xs font-semibold"
                  >
                    Reservada
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatus("SOLD_OUT")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors text-xs font-semibold"
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
                onClick={() => {
                  setBulkCategoryOpen(!bulkCategoryOpen);
                  setBulkStatusOpen(false);
                }}
                disabled={isBulkProcessing}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
              >
                <FolderInput size={13} />
                <span>Mover</span>
              </button>

              {bulkCategoryOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-48 max-h-56 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-xl space-y-1">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500">
                    Mover a:
                  </div>
                  {leafCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleBulkMoveCategory(c.id)}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 transition-colors text-xs truncate"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Eliminar en Lote */}
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isBulkProcessing}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/70 text-rose-300 border border-rose-800/80 hover:bg-rose-900 transition-colors font-medium"
            >
              <Trash2 size={13} />
              <span>Eliminar</span>
            </button>

            {/* Limpiar Selección */}
            <button
              type="button"
              onClick={clearSelection}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Cancelar selección"
            >
              <X size={15} />
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
