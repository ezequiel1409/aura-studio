"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2,
  ExternalLink,
  Eye,
  Folder,
  FolderInput,
  History,
  Layers,
  Maximize2,
  MessageCircle,
  Minimize2,
  MoreVertical,
  Package,
  Plus,
  RefreshCw,
  Search,
  Square,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { Category } from "../../domain/category/types";
import { Product, ProductStatus } from "../../domain/product/types";
import { formatPriceARS } from "../../lib/format/currency";
import dynamic from "next/dynamic";
import { UndoAction, UndoToast } from "./UndoToast";

const StatusHistoryModal = dynamic(
  () => import("./StatusHistoryModal").then((mod) => mod.StatusHistoryModal),
  { ssr: false }
);

const ConfirmDeleteProductModal = dynamic(
  () => import("./ConfirmDeleteProductModal").then((mod) => mod.ConfirmDeleteProductModal),
  { ssr: false }
);
import { useBackofficeStore } from "../../stores/backoffice.store";

export type GroupByMode = "category" | "status" | "none";

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

  // Destrucción de suscripciones y limpieza de memoria estilo Angular (ngOnDestroy)
  useEffect(() => {
    return () => {
      setOpenMenuProductId(null);
      setEditingPriceId(null);
    };
  }, []);

  // Jerarquización: Modo de agrupación (Categoría por defecto para máxima claridad)
  const [groupBy, setGroupBy] = useState<GroupByMode>("category");
  // Grupos colapsados (Set de IDs)
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(new Set());
  // Prendas individuales con ficha de detalles expandida
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(new Set());
  // Menú de acciones '···' abierto actualmente
  const [openMenuProductId, setOpenMenuProductId] = useState<number | null>(null);

  // Control de densidad de filas (Cómoda vs Compacta)
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  // Edición rápida de precio en línea
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [inlinePriceInput, setInlinePriceInput] = useState<string>("");

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

  // Estado para Modal con Step de Confirmación de Borrado de Producto
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Estado accesible para notificaciones de error inline (reemplaza alert() bloqueante)
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

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

  // Construcción de Grupos Jerarquizados Colapsables
  const groups = useMemo(() => {
    if (groupBy === "none") {
      return [
        {
          id: "all",
          title: "Todas las prendas",
          products: filteredProducts,
          availableCount: filteredProducts.filter((p) => p.status === "AVAILABLE").length,
          reservedCount: filteredProducts.filter((p) => p.status === "RESERVED").length,
          soldOutCount: filteredProducts.filter((p) => p.status === "SOLD_OUT").length,
        },
      ];
    }

    if (groupBy === "status") {
      const statusOrder: { status: ProductStatus; title: string }[] = [
        { status: "AVAILABLE", title: "Disponibles" },
        { status: "RESERVED", title: "Reservadas" },
        { status: "SOLD_OUT", title: "Agotadas" },
      ];

      return statusOrder
        .map(({ status, title }) => {
          const groupProds = filteredProducts.filter((p) => p.status === status);
          return {
            id: `status-${status}`,
            title,
            products: groupProds,
            availableCount: groupProds.filter((p) => p.status === "AVAILABLE").length,
            reservedCount: groupProds.filter((p) => p.status === "RESERVED").length,
            soldOutCount: groupProds.filter((p) => p.status === "SOLD_OUT").length,
          };
        })
        .filter((g) => g.products.length > 0);
    }

    // Por Categoría (default)
    const catIdsPresent = Array.from(new Set(filteredProducts.map((p) => p.categoryId)));

    const sortedCatIds = catIdsPresent.sort((a, b) => {
      if (a === uncategorizedId) return 1;
      if (b === uncategorizedId) return -1;
      const catA = categoryMap.get(a);
      const catB = categoryMap.get(b);
      const posA = catA?.position ?? 999;
      const posB = catB?.position ?? 999;
      if (posA !== posB) return posA - posB;
      return (catA?.name || "").localeCompare(catB?.name || "");
    });

    return sortedCatIds.map((catId) => {
      const cat = categoryMap.get(catId);
      const title = cat?.name || (catId === uncategorizedId ? "Sin clasificar" : `Categoría #${catId}`);
      const groupProds = filteredProducts.filter((p) => p.categoryId === catId);

      return {
        id: `cat-${catId}`,
        title,
        products: groupProds,
        availableCount: groupProds.filter((p) => p.status === "AVAILABLE").length,
        reservedCount: groupProds.filter((p) => p.status === "RESERVED").length,
        soldOutCount: groupProds.filter((p) => p.status === "SOLD_OUT").length,
      };
    });
  }, [filteredProducts, groupBy, categoryMap, uncategorizedId]);

  // Manejo de Colapsado de Grupos
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const collapseAllGroups = () => {
    setCollapsedGroupIds(new Set(groups.map((g) => g.id)));
  };

  const expandAllGroups = () => {
    setCollapsedGroupIds(new Set());
  };

  // Manejo de Expansión de Detalles de Prenda
  const toggleProductExpanded = (productId: number) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const expandAllProductDetails = () => {
    setExpandedProductIds(new Set(filteredProducts.map((p) => p.id)));
  };

  const collapseAllProductDetails = () => {
    setExpandedProductIds(new Set());
  };

  // Selección rápida de todo un grupo
  const handleToggleSelectGroup = (groupProductIds: number[]) => {
    const allSelected = groupProductIds.every((id) => selectedProductIds.includes(id));
    if (allSelected) {
      const toRemove = new Set(groupProductIds);
      const remaining = selectedProductIds.filter((id) => !toRemove.has(id));
      clearSelection();
      selectAllProducts(remaining);
    } else {
      const merged = Array.from(new Set([...selectedProductIds, ...groupProductIds]));
      clearSelection();
      selectAllProducts(merged);
    }
  };

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
    const previousProducts = [...products];
    setFeedbackError(null);

    // Actualización optimista inmediata
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              status: newStatus,
              soldOutAt: newStatus === "SOLD_OUT" ? Date.now() : null,
            }
          : p
      )
    );

    try {
      const res = await fetch("/api/admin/products/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setProducts(previousProducts);
        setFeedbackError(data.error || "No se pudo actualizar el estado.");
        return;
      }

      setUndoAction({
        id: `status-${Date.now()}`,
        productId,
        productCode: target.code,
        fromStatus: previousStatus,
        toStatus: newStatus,
        message: `Prenda #${String(target.code).padStart(3, "0")} marcada como ${
          newStatus === "AVAILABLE"
            ? "Disponible"
            : newStatus === "RESERVED"
            ? "Reservada"
            : "Agotada"
        }.`,
      });
    } catch {
      setProducts(previousProducts);
      setFeedbackError("Error de conexión al actualizar el estado.");
    }
  };

  // Deshacer cambio de estado (BR-28)
  const handleUndo = async (action: UndoAction) => {
    setUndoAction(null);
    setFeedbackError(null);
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
        setFeedbackError(data.error || "No se pudo revertir el estado.");
      }
    } catch {
      setFeedbackError("Error al revertir el estado.");
    }
  };

  // Eliminar un producto individual con step de confirmación (BR-34, BR-37)
  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
  };

  // Alternar Destacada con optimismo
  const handleToggleFeatured = async (productId: number) => {
    const currentProduct = products.find((p) => p.id === productId);
    if (!currentProduct) return;

    setFeedbackError(null);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isFeatured: !p.isFeatured } : p))
    );

    try {
      const res = await fetch("/api/admin/products/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? currentProduct : p))
        );
        setFeedbackError(data.error || "No se pudo actualizar el estado de destacado.");
        return;
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? data.product : p))
      );
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? currentProduct : p))
      );
      setFeedbackError("Error de conexión con el servidor.");
    }
  };

  // Edición rápida de precio en línea
  const handleSaveInlinePrice = async (productId: number, priceStr: string) => {
    const priceVal = parseFloat(priceStr.replace(/,/g, "."));
    const priceCents = Number.isNaN(priceVal) ? null : Math.round(priceVal * 100);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceCents }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, priceCents } : p))
        );
        setEditingPriceId(null);
      } else {
        setFeedbackError("No se pudo actualizar el precio");
      }
    } catch {
      setFeedbackError("Error de conexión al actualizar el precio");
    }
  };

  // Acciones en Lote (BR-29)
  const handleBulkStatus = async (newStatus: ProductStatus) => {
    if (selectedProductIds.length === 0) return;
    setBulkProcessing(true);
    setFeedbackError(null);
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
        setFeedbackError(data.error || "Error al aplicar estado en lote.");
      }
    } catch {
      setFeedbackError("Error de conexión con el servidor.");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkMoveCategory = async (targetCategoryId: number) => {
    if (selectedProductIds.length === 0) return;
    setBulkProcessing(true);
    setFeedbackError(null);
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
        setFeedbackError(data.error || "Error al mover categorías en lote.");
      }
    } catch {
      setFeedbackError("Error de conexión con el servidor.");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    const confirmed = window.confirm(
      `¿Estás segura de eliminar permanentemente ${selectedProductIds.length} producto(s) seleccionado(s)? Esta acción es destructiva e irreversible.`
    );
    if (!confirmed) return;

    setBulkProcessing(true);
    setFeedbackError(null);
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
        setFeedbackError(data.error || "Error al eliminar productos en lote.");
      }
    } catch {
      setFeedbackError("Error de conexión con el servidor.");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkFeatured = async (isFeatured: boolean) => {
    if (selectedProductIds.length === 0) return;
    setBulkProcessing(true);
    setFeedbackError(null);

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "featured",
          productIds: selectedProductIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedbackError(data.error || "Error al procesar la acción en lote.");
        return;
      }

      setProducts((prev) =>
        prev.map((p) =>
          selectedProductIds.includes(p.id) ? { ...p, isFeatured } : p
        )
      );
      clearSelection();
    } catch {
      setFeedbackError("Error de conexión con el servidor.");
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
    <div className="space-y-5 pb-24">
      {/* Cabecera & Acciones Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-100">
            Catálogo de Productos
          </h1>
          <p className="text-xs text-zinc-400">
            Gestión jerárquica con grupos colapsables, acciones rápidas e historial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filteredProducts.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              aria-label={
                allFilteredSelected
                  ? "Deseleccionar todos los productos filtrados"
                  : `Seleccionar todos los ${filteredProducts.length} productos filtrados`
              }
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-800 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              {allFilteredSelected ? (
                <>
                  <CheckSquare size={15} className="text-amber-300" aria-hidden="true" />
                  <span>Deseleccionar ({filteredProducts.length})</span>
                </>
              ) : (
                <>
                  <Square size={15} className="text-zinc-500" aria-hidden="true" />
                  <span>Seleccionar ({filteredProducts.length})</span>
                </>
              )}
            </button>
          )}

          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-200 text-zinc-950 font-semibold text-xs hover:bg-amber-100 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <Plus size={16} aria-hidden="true" />
            <span>+ Cargar Producto</span>
          </Link>
        </div>
      </div>

      {/* Banner de Error Accesible Inline (Reemplaza alert() bloqueante) */}
      {feedbackError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-950/60 border border-rose-700/80 text-rose-200 text-xs font-medium shadow-sm"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" aria-hidden="true" />
            <span>{feedbackError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackError(null)}
            aria-label="Cerrar aviso de error"
            className="p-1 rounded-lg text-rose-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Buscador y Pestañas de Estado */}
      <div className="space-y-3">
        {/* Input de Búsqueda */}
        <div className="relative">
          <input
            id="search-products-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (#023), título o descripción..."
            aria-label="Buscar productos por código, título o descripción"
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
          aria-label="Filtros de estado de productos"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-full font-medium transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
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

      {/* Barra de Herramientas de Jerarquización y Control Colapsable */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
        {/* Selector de Agrupación */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-medium">Agrupar por:</span>
          <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <button
              type="button"
              onClick={() => setGroupBy("category")}
              aria-pressed={groupBy === "category"}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                groupBy === "category"
                  ? "bg-amber-200 text-zinc-950 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Folder size={12} aria-hidden="true" />
              <span>Categorías</span>
            </button>
            <button
              type="button"
              onClick={() => setGroupBy("status")}
              aria-pressed={groupBy === "status"}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                groupBy === "status"
                  ? "bg-amber-200 text-zinc-950 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Tag size={12} aria-hidden="true" />
              <span>Estados</span>
            </button>
            <button
              type="button"
              onClick={() => setGroupBy("none")}
              aria-pressed={groupBy === "none"}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                groupBy === "none"
                  ? "bg-amber-200 text-zinc-950 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers size={12} aria-hidden="true" />
              <span>Sin agrupar</span>
            </button>
          </div>
        </div>

        {/* Acciones de Colapso Global */}
        <div className="flex items-center gap-2 ml-auto">
          {groupBy !== "none" && (
            <div className="flex items-center gap-1 border-r border-zinc-800 pr-2">
              <button
                type="button"
                onClick={collapseAllGroups}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Colapsar todos los grupos"
              >
                <Minimize2 size={12} aria-hidden="true" />
                <span>Colapsar grupos</span>
              </button>
              <button
                type="button"
                onClick={expandAllGroups}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Expandir todos los grupos"
              >
                <Maximize2 size={12} aria-hidden="true" />
                <span>Expandir grupos</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={expandAllProductDetails}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Expandir detalles de todas las prendas"
            >
              <span>+ Ver detalles</span>
            </button>
            <button
              type="button"
              onClick={collapseAllProductDetails}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Comprimir a vista compacta"
            >
              <span>- Vista compacta</span>
            </button>
          </div>

          {/* Control de Densidad: Cómoda vs Compacta */}
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
            <button
              type="button"
              onClick={() => setDensity("comfortable")}
              aria-pressed={density === "comfortable"}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                density === "comfortable"
                  ? "bg-amber-200 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Cómoda
            </button>
            <button
              type="button"
              onClick={() => setDensity("compact")}
              aria-pressed={density === "compact"}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                density === "compact"
                  ? "bg-amber-200 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Compacta
            </button>
          </div>
        </div>
      </div>

      {/* Listado Jerarquizado de Grupos y Productos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-2">
          <Package size={32} className="mx-auto text-zinc-500" />
          <p className="text-sm font-semibold text-zinc-300">
            No se encontraron productos con los filtros seleccionados
          </p>
          <p className="text-xs text-zinc-400">
            Probá limpiando el buscador o cambiando de pestaña.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isGroupCollapsed = collapsedGroupIds.has(group.id);
            const groupProductIds = group.products.map((p) => p.id);
            const isGroupAllSelected =
              groupProductIds.length > 0 &&
              groupProductIds.every((id) => selectedProductIds.includes(id));

            return (
              <section
                key={group.id}
                aria-labelledby={`heading-${group.id}`}
                className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-900/40 backdrop-blur-sm transition-all"
              >
                {/* Encabezado Colapsable del Grupo (Controles hermanos desanidados para WCAG 4.1.2) */}
                {groupBy !== "none" && (
                  <div className="w-full flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-zinc-900/90 border-b border-zinc-800/70">
                    <button
                      type="button"
                      id={`heading-${group.id}`}
                      aria-expanded={!isGroupCollapsed}
                      aria-controls={`group-content-${group.id}`}
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="flex-1 flex items-center justify-between gap-2.5 min-w-0 text-left px-2 py-1.5 rounded-xl hover:bg-zinc-800/60 transition-colors cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="p-1 rounded-md bg-zinc-800 text-amber-300 shrink-0">
                          {isGroupCollapsed ? (
                            <ChevronRight size={15} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={15} aria-hidden="true" />
                          )}
                        </span>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                            {group.title}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold shrink-0">
                            {group.products.length} {group.products.length === 1 ? "prenda" : "prendas"}
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                        {group.availableCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md border status-badge-available font-semibold">
                            {group.availableCount} disp.
                          </span>
                        )}
                        {group.reservedCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md border status-badge-reserved font-semibold">
                            {group.reservedCount} res.
                          </span>
                        )}
                        {group.soldOutCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md border status-badge-soldout font-semibold">
                            {group.soldOutCount} agot.
                          </span>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSelectGroup(groupProductIds)}
                      aria-label={`Seleccionar todas las prendas de ${group.title}`}
                      className="shrink-0 text-[11px] font-medium text-zinc-400 hover:text-amber-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                    >
                      {isGroupAllSelected ? "Deseleccionar grupo" : "Seleccionar grupo"}
                    </button>
                  </div>
                )}

                {/* Lista de Prendas del Grupo */}
                {!isGroupCollapsed && (
                  <div id={`group-content-${group.id}`} className="p-2 sm:p-3 space-y-2.5">
                    {group.products.map((p) => {
                      const codeFormatted = `#${String(p.code).padStart(3, "0")}`;
                      const category = categoryMap.get(p.categoryId);
                      const thumbUrl = p.photos?.[0]?.keyThumb;
                      const isSelected = isProductSelected(p.id);
                      const isDetailsExpanded = expandedProductIds.has(p.id);

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

                      // Stock acumulado
                      const totalStock = (p.colors || []).reduce((acc, col) => {
                        return acc + (col.sizes || []).reduce((sAcc, sz) => sAcc + sz.stock, 0);
                      }, 0);

                      return (
                        <div
                          key={p.id}
                          className={`border rounded-xl transition-all ${
                            isSelected
                              ? "bg-amber-950/20 border-amber-500/60 shadow-sm"
                              : "bg-zinc-900/70 border-zinc-800/90 hover:border-zinc-700/80"
                          }`}
                        >
                          {/* Fila Principal de la Prenda */}
                          <div className={`${density === "compact" ? "p-2 sm:p-2.5" : "p-3 sm:p-3.5"} flex items-center gap-2.5 sm:gap-3`}>
                            {/* Checkbox de selección múltiple */}
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={isSelected}
                              onClick={() => toggleProductSelection(p.id)}
                              className="text-zinc-500 hover:text-amber-200 p-1.5 shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                              aria-label={`${isSelected ? "Deseleccionar" : "Seleccionar"} producto #${codeFormatted}`}
                            >
                              {isSelected ? (
                                <CheckSquare size={18} className="text-amber-300" aria-hidden="true" />
                              ) : (
                                <Square size={18} className="text-zinc-500 hover:text-zinc-300" aria-hidden="true" />
                              )}
                            </button>

                            {/* Foto miniatura con badge de código (Clic navega directamente a editar) */}
                            <Link
                              href={`/admin/productos/${p.code}/editar`}
                              prefetch={false}
                              className={`relative block ${density === "compact" ? "w-10 h-12" : "w-12 h-14 sm:w-14 sm:h-16"} rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 group/thumb hover:border-amber-400/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400`}
                              title={`Editar ficha ${codeFormatted}`}
                            >
                              {thumbUrl ? (
                                <img
                                  src={thumbUrl}
                                  alt={p.title || codeFormatted}
                                  className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                  <Package size={18} />
                                </div>
                              )}
                              <span className="absolute bottom-0.5 left-0.5 right-0.5 text-center text-[9px] font-mono font-bold bg-zinc-950/90 text-amber-200 rounded">
                                {codeFormatted}
                              </span>
                            </Link>

                            {/* Información central completa */}
                            <div className="flex-1 min-w-0 pr-1">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/admin/productos/${p.code}/editar`}
                                  prefetch={false}
                                  className="text-xs sm:text-sm font-bold text-zinc-100 hover:text-amber-300 transition-colors truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                                  title={`Editar ${p.title || codeFormatted}`}
                                >
                                  {p.title || "Producto sin título"}
                                </Link>
                                {p.isFeatured && (
                                  <span
                                    className="shrink-0 p-0.5 text-amber-400"
                                    title="Prenda destacada en el showroom"
                                  >
                                    <Star size={12} className="fill-amber-400" aria-hidden="true" />
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs pt-0.5">
                                {/* Edición rápida de precio en línea */}
                                {editingPriceId === p.id ? (
                                  <span className="inline-flex items-center gap-1 bg-zinc-950 border border-amber-400/80 rounded-lg p-0.5">
                                    <span className="text-zinc-400 font-mono text-xs pl-1">$</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={inlinePriceInput}
                                      onChange={(e) => setInlinePriceInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleSaveInlinePrice(p.id, inlinePriceInput);
                                        } else if (e.key === "Escape") {
                                          setEditingPriceId(null);
                                        }
                                      }}
                                      autoFocus
                                      className="w-20 px-1 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-100 focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveInlinePrice(p.id, inlinePriceInput)}
                                      className="p-1 rounded bg-amber-300 text-zinc-950 hover:bg-amber-200"
                                      title="Guardar precio"
                                    >
                                      <Check size={11} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPriceId(null)}
                                      className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                                      title="Cancelar"
                                    >
                                      <X size={11} />
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPriceId(p.id);
                                      setInlinePriceInput(
                                        p.priceCents !== null ? String(p.priceCents / 100) : ""
                                      );
                                    }}
                                    className="font-mono font-semibold text-amber-200 hover:underline inline-flex items-center gap-1 group/price cursor-pointer"
                                    title="Clic para editar precio rápidamente"
                                  >
                                    <span>
                                      {p.priceCents !== null
                                        ? formatPriceARS(p.priceCents, p.currency)
                                        : "Consultar precio"}
                                    </span>
                                    <Edit2 size={10} className="opacity-0 group-hover/price:opacity-100 text-amber-400 transition-opacity" />
                                  </button>
                                )}

                                <span className="text-zinc-500">•</span>
                                <span className="text-zinc-400 truncate max-w-[120px]">
                                  {category?.name || "Sin clasificar"}
                                </span>
                                <span className="text-zinc-500 hidden sm:inline">•</span>
                                <span className="text-zinc-400 hidden sm:inline">
                                  Stock: <strong className="text-zinc-200">{totalStock}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Selector Rápido de Estado con Texto Completo */}
                            <div className="shrink-0">
                              <div
                                role="group"
                                aria-label={`Estado de ${codeFormatted}`}
                                className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] sm:text-xs"
                              >
                                <button
                                  type="button"
                                  aria-pressed={p.status === "AVAILABLE"}
                                  aria-label={`Marcar disponible #${codeFormatted}`}
                                  onClick={() => handleStatusChange(p.id, "AVAILABLE")}
                                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                                    p.status === "AVAILABLE"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-zinc-400 hover:text-zinc-200"
                                  }`}
                                >
                                  <span className="hidden sm:inline">Disponible</span>
                                  <span className="sm:hidden">Disp.</span>
                                </button>
                                <button
                                  type="button"
                                  aria-pressed={p.status === "RESERVED"}
                                  aria-label={`Marcar reservada #${codeFormatted}`}
                                  onClick={() => handleStatusChange(p.id, "RESERVED")}
                                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 ${
                                    p.status === "RESERVED"
                                      ? "bg-amber-500 text-stone-950 shadow-xs"
                                      : "text-zinc-400 hover:text-zinc-200"
                                  }`}
                                >
                                  <span className="hidden sm:inline">Reservado</span>
                                  <span className="sm:hidden">Res.</span>
                                </button>
                                <button
                                  type="button"
                                  aria-pressed={p.status === "SOLD_OUT"}
                                  aria-label={`Marcar agotada #${codeFormatted}`}
                                  onClick={() => handleStatusChange(p.id, "SOLD_OUT")}
                                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 ${
                                    p.status === "SOLD_OUT"
                                      ? "bg-stone-600 text-white shadow-xs"
                                      : "text-zinc-400 hover:text-zinc-200"
                                  }`}
                                >
                                  <span className="hidden sm:inline">Agotado</span>
                                  <span className="sm:hidden">Agot.</span>
                                </button>
                              </div>
                            </div>

                            {/* Botón Acordeón de Detalles (▾ / ▴) */}
                            <button
                              type="button"
                              onClick={() => toggleProductExpanded(p.id)}
                              aria-expanded={isDetailsExpanded}
                              aria-controls={`details-content-${p.id}`}
                              aria-label={
                                isDetailsExpanded
                                  ? `Ocultar detalles de #${codeFormatted}`
                                  : `Ver detalles y stock de #${codeFormatted}`
                              }
                              className="p-2 rounded-lg text-zinc-400 hover:text-amber-200 hover:bg-zinc-800 transition-colors shrink-0"
                              title={isDetailsExpanded ? "Ocultar detalles" : "Ver detalles y stock"}
                            >
                              <ChevronDown
                                size={17}
                                className={`transition-transform duration-200 ${
                                  isDetailsExpanded ? "rotate-180 text-amber-300" : ""
                                }`}
                                aria-hidden="true"
                              />
                            </button>

                            {/* Botón Borrado Rápido con Step de Confirmación */}
                            <button
                              type="button"
                              onClick={() => setProductToDelete(p)}
                              aria-label={`Borrar producto #${codeFormatted}`}
                              className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 shrink-0"
                              title="Borrar producto..."
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>

                            {/* Botón directo de edición rápida + Menú de Acciones Unificado */}
                            <div className="relative shrink-0 flex items-center gap-0.5">
                              <Link
                                href={`/admin/productos/${p.code}/editar`}
                                prefetch={false}
                                className="p-2 rounded-lg text-zinc-400 hover:text-amber-200 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
                                title={`Editar ficha ${codeFormatted}`}
                                aria-label={`Editar ficha ${codeFormatted}`}
                              >
                                <Edit2 size={15} aria-hidden="true" />
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenuProductId(openMenuProductId === p.id ? null : p.id)
                                }
                                aria-haspopup="true"
                                aria-expanded={openMenuProductId === p.id}
                                aria-label={`Más opciones para #${codeFormatted}`}
                                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
                              >
                                <MoreVertical size={16} aria-hidden="true" />
                              </button>

                              {openMenuProductId === p.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setOpenMenuProductId(null)}
                                    aria-hidden="true"
                                  />
                                  <div
                                    role="menu"
                                    className="absolute right-0 top-full mt-1 w-44 z-40 bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-2xl space-y-0.5 animate-in fade-in"
                                  >
                                    <Link
                                      href={`/admin/productos/${p.code}/editar`}
                                      role="menuitem"
                                      onClick={() => setOpenMenuProductId(null)}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                    >
                                      <Edit2 size={13} className="text-zinc-400" aria-hidden="true" />
                                      <span>Editar ficha</span>
                                    </Link>

                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setOpenMenuProductId(null);
                                        handleToggleFeatured(p.id);
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-amber-200 transition-colors text-left"
                                    >
                                      <Star
                                        size={13}
                                        className={
                                          p.isFeatured
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-zinc-400"
                                        }
                                        aria-hidden="true"
                                      />
                                      <span>
                                        {p.isFeatured ? "Quitar destacado" : "Destacar en portada"}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setOpenMenuProductId(null);
                                        setHistoryTarget({
                                          id: p.id,
                                          code: p.code,
                                          title: p.title,
                                        });
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-amber-200 transition-colors text-left"
                                    >
                                      <History size={13} className="text-zinc-400" aria-hidden="true" />
                                      <span>Historial de cambios</span>
                                    </button>

                                    <a
                                      href={`/p/${String(p.code).padStart(3, "0")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      role="menuitem"
                                      onClick={() => setOpenMenuProductId(null)}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                    >
                                      <ExternalLink size={13} className="text-zinc-400" aria-hidden="true" />
                                      <span>Ver en tienda</span>
                                    </a>

                                    <div className="border-t border-zinc-800 my-1" />

                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setOpenMenuProductId(null);
                                        handleDeleteProduct(p);
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-300 hover:bg-rose-950/60 hover:text-rose-200 transition-colors text-left font-semibold"
                                    >
                                      <Trash2 size={13} className="text-rose-400" aria-hidden="true" />
                                      <span>Eliminar producto...</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Detalles Desplegables (Acordeón Nivel 2 de la Prenda) */}
                          {isDetailsExpanded && (
                            <div
                              id={`details-content-${p.id}`}
                              className="px-3 pb-3 sm:px-4 sm:pb-3.5 pt-2 border-t border-zinc-800/60 space-y-3 bg-zinc-950/30 rounded-b-xl animate-in fade-in"
                            >
                              {/* Variantes de Talle y Color */}
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                                  Desglose de Stock por Variante:
                                </span>
                                {p.colors && p.colors.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {p.colors.map((col) => (
                                      <div
                                        key={col.id || col.name}
                                        className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs flex items-center gap-1.5"
                                      >
                                        <span className="font-semibold text-zinc-200">
                                          {col.name}:
                                        </span>
                                        <span className="text-zinc-400">
                                          {col.sizes?.map((sz) => `${sz.size} (${sz.stock})`).join(", ") ||
                                            "Sin talles"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-zinc-400">
                                    Stock total sin variantes: {totalStock} unidades
                                  </p>
                                )}
                              </div>

                              {/* Métricas privadas y Alerta de Archivo */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs border-t border-zinc-800/40">
                                <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
                                  <span
                                    className="flex items-center gap-1.5"
                                    title="Visitas totales a la ficha del producto"
                                  >
                                    <Eye size={13} className="text-zinc-500" aria-hidden="true" />
                                    <span>{p.stats?.viewsCount ?? 0} vistas</span>
                                  </span>
                                  <span
                                    className="flex items-center gap-1.5"
                                    title="Consultas iniciadas por WhatsApp"
                                  >
                                    <MessageCircle
                                      size={13}
                                      className="text-emerald-400/80"
                                      aria-hidden="true"
                                    />
                                    <span>{p.stats?.whatsappClicks ?? 0} consultas WhatsApp</span>
                                  </span>
                                </div>

                                {p.status === "SOLD_OUT" && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p)}
                                    className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-amber-300 transition-colors"
                                  >
                                    <Clock size={12} aria-hidden="true" />
                                    <span>Archivar pieza</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Barra Flotante de Acciones en Lote (BR-29, AR-10 Zustand) */}
      {selectedProductIds.length > 0 && (
        <aside
          aria-label="Barra de acciones en lote para productos seleccionados"
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
              {selectedProductIds.length === 1
                ? "1 producto seleccionado"
                : `${selectedProductIds.length} productos seleccionados`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Cambiar Estado en Lote */}
            <div className="relative">
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={bulkStatusOpen}
                aria-label="Cambiar estado de productos seleccionados en lote"
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
                aria-label="Mover productos seleccionados a otra categoría en lote"
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
              aria-label={`Destacar ${selectedProductIds.length} producto(s) seleccionado(s) en lote`}
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
              aria-label={`Eliminar ${selectedProductIds.length} producto(s) seleccionado(s) en lote`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/70 text-rose-300 border border-rose-800/80 hover:bg-rose-900 transition-colors font-medium focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
            >
              <Trash2 size={13} aria-hidden="true" />
              <span>Eliminar</span>
            </button>

            {/* Limpiar Selección */}
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Cancelar y deseleccionar todos los productos"
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

      {/* Modal con Step de Confirmación de Borrado de Producto */}
      {productToDelete && (
        <ConfirmDeleteProductModal
          product={productToDelete}
          onClose={() => setProductToDelete(null)}
          onDeleted={(deletedId) => {
            setProducts((prev) => prev.filter((p) => p.id !== deletedId));
            if (isProductSelected(deletedId)) {
              toggleProductSelection(deletedId);
            }
          }}
        />
      )}
    </div>
  );
}
