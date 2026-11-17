"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Folder,
  Layers,
  Loader2,
  Package,
  Plus,
  Search,
  Square,
  Tag,
  X,
} from "lucide-react";
import { Category } from "../../domain/category/types";
import { BackofficeSummaryCounts } from "../../domain/ports/repositories.port";
import { calculateTotalStock, LOW_STOCK_THRESHOLD } from "../../domain/product/rules";
import { Product, ProductStatus } from "../../domain/product/types";
import { useBackofficeStore } from "../../stores/backoffice.store";
import { QuickStockModal } from "./QuickStockModal";
import { UndoAction, UndoToast } from "./UndoToast";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { AdminPaginationBar } from "./ui/AdminPaginationBar";
import { ProductInventoryRowCard } from "./products/list/ProductInventoryRowCard";
import { ProductBulkActionBar } from "./products/list/ProductBulkActionBar";

const StatusHistoryModal = dynamic(
  () => import("./StatusHistoryModal").then((mod) => mod.StatusHistoryModal),
  { ssr: false }
);

const ConfirmDeleteProductModal = dynamic(
  () => import("./ConfirmDeleteProductModal").then((mod) => mod.ConfirmDeleteProductModal),
  { ssr: false }
);

export type GroupByMode = "category" | "status" | "none";

interface ProductListClientProps {
  initialProducts: Product[];
  categories: Category[];
  initialFilter?: string;
  initialStatus?: string;
  initialSearch?: string;
  initialTotal?: number;
  initialPage?: number;
  initialTotalPages?: number;
  pageSize?: number;
  summaryCounts?: BackofficeSummaryCounts;
}

function resolveInitialTab(initialStatus?: string, initialFilter?: string): string {
  const normalizedStatus = initialStatus?.trim().toUpperCase();
  if (normalizedStatus === "AVAILABLE") return "disponibles";
  if (normalizedStatus === "RESERVED") return "reservadas";
  if (normalizedStatus === "SOLD_OUT") return "agotadas";
  return initialFilter?.trim().toLowerCase() || "todas";
}

export function ProductListClient({
  initialProducts,
  categories,
  initialFilter = "todas",
  initialStatus,
  initialSearch = "",
  initialTotal,
  initialPage = 1,
  initialTotalPages = 1,
  pageSize = 20,
  summaryCounts,
}: ProductListClientProps) {
  const isServerPaginated = initialTotal !== undefined;

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState<number>(initialTotal ?? initialProducts.length);
  const [page, setPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [loadingList, setLoadingList] = useState(false);

  const [activeTab, setActiveTab] = useState<string>(() =>
    resolveInitialTab(initialStatus, initialFilter)
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [currentTime] = useState(() => Date.now());

  const [groupBy, setGroupBy] = useState<GroupByMode>("category");
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(new Set());
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(new Set());
  const [openMenuProductId, setOpenMenuProductId] = useState<number | null>(null);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [inlinePriceInput, setInlinePriceInput] = useState<string>("");

  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  const {
    selectedProductIds,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,
    isProductSelected,
    isBulkProcessing,
    setBulkProcessing,
  } = useBackofficeStore();

  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{
    id: number;
    code: number;
    title: string | null;
  } | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);

  const fetchAbortRef = useRef<AbortController | null>(null);
  const didMountSearchRef = useRef(false);

  // Cerrar menús contextuales con Escape y limpiar al desmontar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuProductId(null);
        setBulkStatusOpen(false);
        setBulkCategoryOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      fetchAbortRef.current?.abort();
      setOpenMenuProductId(null);
      setEditingPriceId(null);
    };
  }, []);

  const fetchServerPage = useCallback(
    async (opts: { nextTab: string; nextSearch: string; nextPage: number }) => {
      if (!isServerPaginated) return;

      fetchAbortRef.current?.abort();
      const controller = new AbortController();
      fetchAbortRef.current = controller;

      setLoadingList(true);
      setFeedbackError(null);

      try {
        const params = new URLSearchParams({
          page: String(opts.nextPage),
          pageSize: String(pageSize),
          tab: opts.nextTab,
        });
        if (opts.nextSearch.trim()) {
          params.set("search", opts.nextSearch.trim());
        }

        const res = await fetch(`/api/admin/products?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setFeedbackError(data.error || "No se pudo cargar el listado de productos.");
          return;
        }

        setProducts(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total ?? 0));
        setPage(Number(data.page ?? opts.nextPage));
        setTotalPages(Number(data.totalPages ?? 1));
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setFeedbackError("Error de conexión al consultar productos.");
      } finally {
        setLoadingList(false);
      }
    },
    [isServerPaginated, pageSize]
  );

  // Búsqueda con debounce en modo paginado en servidor
  useEffect(() => {
    if (!isServerPaginated) return;
    if (!didMountSearchRef.current) {
      didMountSearchRef.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      void fetchServerPage({
        nextTab: activeTab,
        nextSearch: searchQuery,
        nextPage: 1,
      });
    }, 260);

    return () => window.clearTimeout(timer);
  }, [searchQuery, isServerPaginated, activeTab, fetchServerPage]);

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    if (isServerPaginated) {
      void fetchServerPage({
        nextTab,
        nextSearch: searchQuery,
        nextPage: 1,
      });
    }
  };

  const handlePageChange = (nextPage: number) => {
    if (!isServerPaginated || nextPage < 1 || nextPage > totalPages || loadingList) return;
    void fetchServerPage({
      nextTab: activeTab,
      nextSearch: searchQuery,
      nextPage,
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  const leafCategories = useMemo(() => {
    const parentIds = new Set(categories.map((c) => c.parentId).filter(Boolean));
    return categories.filter((c) => !parentIds.has(c.id));
  }, [categories]);

  const uncategorizedId = useMemo(() => {
    const unc = categories.find((c) => c.slug === "sin-clasificar");
    return unc ? unc.id : 0;
  }, [categories]);

  // Filtrado en memoria (usado cuando no hay paginación servidor, p. ej. render SSR unitario)
  const visibleProducts = useMemo(() => {
    if (isServerPaginated) {
      return products;
    }

    const twentyThreeDaysMs = 23 * 24 * 60 * 60 * 1000;

    return products.filter((p) => {
      const totalStock = calculateTotalStock(p.colors);

      if (activeTab === "destacadas" && !p.isFeatured) return false;
      if (activeTab === "disponibles" && p.status !== "AVAILABLE") return false;
      if (activeTab === "reservadas" && p.status !== "RESERVED") return false;
      if (activeTab === "agotadas" && p.status !== "SOLD_OUT") return false;
      if (activeTab === "stock_bajo" && (totalStock <= 0 || totalStock > LOW_STOCK_THRESHOLD)) {
        return false;
      }
      if (activeTab === "por_vencer") {
        if (p.status !== "SOLD_OUT") return false;
        if (!p.soldOutAt || p.soldOutAt > currentTime - twentyThreeDaysMs) return false;
      }
      if (activeTab === "sin_clasificar" && p.categoryId !== uncategorizedId) return false;
      if (activeTab === "sin_precio" && p.priceCents !== null) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const codeStr = String(p.code);
        const codePadded = `#${codeStr.padStart(3, "0")}`.toLowerCase();
        const matchesCode =
          codeStr.includes(query.replace(/^#/, "")) || codePadded.includes(query);
        const matchesTitle = p.title?.toLowerCase().includes(query);
        const matchesRaw = p.rawText.toLowerCase().includes(query);

        return matchesCode || matchesTitle || matchesRaw;
      }

      return true;
    });
  }, [isServerPaginated, products, activeTab, searchQuery, uncategorizedId, currentTime]);

  const groups = useMemo(() => {
    if (groupBy === "none") {
      return [
        {
          id: "all",
          title: "Todas las prendas",
          products: visibleProducts,
          availableCount: visibleProducts.filter((p) => p.status === "AVAILABLE").length,
          reservedCount: visibleProducts.filter((p) => p.status === "RESERVED").length,
          soldOutCount: visibleProducts.filter((p) => p.status === "SOLD_OUT").length,
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
          const groupProds = visibleProducts.filter((p) => p.status === status);
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

    const catIdsPresent = Array.from(new Set(visibleProducts.map((p) => p.categoryId)));
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
      const title =
        cat?.name || (catId === uncategorizedId ? "Sin clasificar" : `Categoría #${catId}`);
      const groupProds = visibleProducts.filter((p) => p.categoryId === catId);

      return {
        id: `cat-${catId}`,
        title,
        products: groupProds,
        availableCount: groupProds.filter((p) => p.status === "AVAILABLE").length,
        reservedCount: groupProds.filter((p) => p.status === "RESERVED").length,
        soldOutCount: groupProds.filter((p) => p.status === "SOLD_OUT").length,
      };
    });
  }, [visibleProducts, groupBy, categoryMap, uncategorizedId]);

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

  const allVisibleSelected = useMemo(() => {
    if (visibleProducts.length === 0) return false;
    return visibleProducts.every((p) => selectedProductIds.includes(p.id));
  }, [visibleProducts, selectedProductIds]);

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      clearSelection();
    } else {
      selectAllProducts(visibleProducts.map((p) => p.id));
    }
  };

  const handleStatusChange = async (productId: number, newStatus: ProductStatus) => {
    const target = products.find((p) => p.id === productId);
    if (!target || target.status === newStatus) return;

    const previousStatus = target.status;
    const previousProducts = [...products];
    setFeedbackError(null);
    setFeedbackNotice(null);

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
        message: `Producto #${String(target.code).padStart(3, "0")} marcado como ${
          newStatus === "AVAILABLE"
            ? "Disponible"
            : newStatus === "RESERVED"
            ? "Reservado"
            : "Agotado"
        }.`,
      });
    } catch {
      setProducts(previousProducts);
      setFeedbackError("Error de conexión al actualizar el estado.");
    }
  };

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
      setFeedbackNotice(
        data.product.isFeatured
          ? `Prenda #${String(currentProduct.code).padStart(3, "0")} destacada.`
          : `Prenda #${String(currentProduct.code).padStart(3, "0")} quitada de destacados.`
      );
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? currentProduct : p))
      );
      setFeedbackError("Error de conexión con el servidor.");
    }
  };

  const handleSaveInlinePrice = async (productId: number, priceStr: string) => {
    const priceVal = Number.parseFloat(priceStr.replace(/,/g, "."));
    const priceCents = Number.isNaN(priceVal) ? null : Math.round(priceVal * 100);
    setFeedbackError(null);
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
        setFeedbackNotice("Precio actualizado correctamente.");
      } else {
        setFeedbackError("No se pudo actualizar el precio.");
      }
    } catch {
      setFeedbackError("Error de conexión al actualizar el precio.");
    }
  };

  const handleBulkStatus = async (newStatus: ProductStatus) => {
    if (selectedProductIds.length === 0) return;
    setBulkProcessing(true);
    setFeedbackError(null);
    setFeedbackNotice(null);
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
        const countChanged = selectedProductIds.length;
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
        setFeedbackNotice(`Se actualizó el estado de ${countChanged} producto(s).`);
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
    setFeedbackNotice(null);
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
        const countMoved = selectedProductIds.length;
        setProducts((prev) =>
          prev.map((p) =>
            selectedProductIds.includes(p.id)
              ? { ...p, categoryId: targetCategoryId }
              : p
          )
        );
        clearSelection();
        setBulkCategoryOpen(false);
        setFeedbackNotice(`Se movieron ${countMoved} producto(s) de categoría.`);
      } else {
        setFeedbackError(data.error || "Error al mover categorías en lote.");
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
    setFeedbackNotice(null);

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
        setFeedbackError(data.error || "Error al procesar la acción en lote.");
        return;
      }

      const countUpdated = selectedProductIds.length;
      setProducts((prev) =>
        prev.map((p) =>
          selectedProductIds.includes(p.id) ? { ...p, isFeatured } : p
        )
      );
      clearSelection();
      setFeedbackNotice(
        isFeatured
          ? `${countUpdated} producto(s) destacado(s) en portada.`
          : `${countUpdated} producto(s) quitado(s) de destacados.`
      );
    } catch {
      setFeedbackError("Error de conexión con el servidor.");
    } finally {
      setBulkProcessing(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    setBulkProcessing(true);
    setFeedbackError(null);
    setFeedbackNotice(null);
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
        const deletedIds = new Set(selectedProductIds);
        setProducts((prev) => prev.filter((p) => !deletedIds.has(p.id)));
        setTotal((prev) => Math.max(0, prev - deletedIds.size));
        clearSelection();
        setBulkDeleteConfirmOpen(false);
        setFeedbackNotice(`Se eliminaron ${deletedIds.size} producto(s).`);
      } else {
        setFeedbackError(data.error || "Error al eliminar productos en lote.");
      }
    } catch {
      setFeedbackError("Error de conexión con el servidor.");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleQuickStockSaved = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    const totalAfter = calculateTotalStock(updatedProduct.colors);
    setFeedbackNotice(
      `Stock actualizado en #${String(updatedProduct.code).padStart(3, "0")}: ${totalAfter} u. en stock.`
    );
  };

  const tabs = useMemo(() => {
    const featuredLabel = "Destacadas";
    return [
      { id: "todas", label: "Todas" },
      { id: "destacadas", label: featuredLabel },
      {
        id: "disponibles",
        label: summaryCounts ? `Disponibles (${summaryCounts.available})` : "Disponibles",
      },
      {
        id: "stock_bajo",
        label: `Stock bajo (<=${LOW_STOCK_THRESHOLD})`,
      },
      {
        id: "reservadas",
        label: summaryCounts ? `Reservados (${summaryCounts.reserved})` : "Reservados",
      },
      {
        id: "agotadas",
        label: summaryCounts ? `Agotados (${summaryCounts.soldOut})` : "Agotados",
      },
      {
        id: "por_vencer",
        label:
          summaryCounts && summaryCounts.expiringSoon > 0
            ? `Por vencer (${summaryCounts.expiringSoon})`
            : "Por vencer",
      },
      {
        id: "sin_clasificar",
        label:
          summaryCounts && summaryCounts.uncategorized > 0
            ? `Sin clasificar (${summaryCounts.uncategorized})`
            : "Sin clasificar",
      },
      {
        id: "sin_precio",
        label:
          summaryCounts && summaryCounts.noPrice > 0
            ? `Sin precio (${summaryCounts.noPrice})`
            : "Sin precio",
      },
    ];
  }, [summaryCounts]);

  const totalDisplayedCount = isServerPaginated ? total : visibleProducts.length;

  return (
    <div className="space-y-5 pb-28">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold text-zinc-100">
            Catálogo e Inventario
          </h1>
          <p className="text-xs text-zinc-400">
            Lista simplificada con ajuste rápido de stock por talle y color.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {visibleProducts.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              aria-label={
                allVisibleSelected
                  ? "Deseleccionar todos los productos visibles"
                  : `Seleccionar todos los ${visibleProducts.length} productos visibles`
              }
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              {allVisibleSelected ? (
                <>
                  <CheckSquare size={15} className="text-amber-300" aria-hidden="true" />
                  <span>Deseleccionar ({visibleProducts.length})</span>
                </>
              ) : (
                <>
                  <Square size={15} className="text-zinc-500" aria-hidden="true" />
                  <span>Seleccionar ({visibleProducts.length})</span>
                </>
              )}
            </button>
          )}

          <Link
            href="/admin/productos/nuevo"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl admin-btn-primary text-xs shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <Plus size={16} aria-hidden="true" />
            <span>Cargar Producto</span>
          </Link>
        </div>
      </div>

      {/* Feedback de éxito */}
      {feedbackNotice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/80 text-emerald-200 text-xs font-medium shadow-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{feedbackNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            aria-label="Cerrar notificación"
            className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-emerald-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Feedback de error */}
      {feedbackError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-950/60 border border-rose-700/80 text-rose-200 text-xs font-medium shadow-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" aria-hidden="true" />
            <span>{feedbackError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackError(null)}
            aria-label="Cerrar aviso de error"
            className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-rose-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Buscador + Filtros + Agrupación en 1 bloque limpio */}
      <div className="space-y-3 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3 sm:p-4">
        <div className="relative flex items-center">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3.5 text-zinc-500 pointer-events-none"
          />
          <input
            id="search-products-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (#023), título o descripción..."
            aria-label="Buscar productos por código, título o descripción"
            className="w-full min-h-[44px] bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-11 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-1 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 cursor-pointer"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Pestañas de filtro */}
        <div
          role="tablist"
          aria-label="Filtros de productos e inventario"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.id)}
                className={`whitespace-nowrap min-h-[40px] px-3.5 rounded-full font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  isActive
                    ? "bg-amber-300 text-zinc-950 font-bold shadow-xs"
                    : "bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Barra de agrupación compacta (sin botones redundantes) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/70 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-400 font-medium">Agrupar por:</span>
            <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => setGroupBy("category")}
                aria-pressed={groupBy === "category"}
                className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  groupBy === "category"
                    ? "bg-amber-300 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Folder size={13} aria-hidden="true" />
                <span>Categorías</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupBy("status")}
                aria-pressed={groupBy === "status"}
                className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  groupBy === "status"
                    ? "bg-amber-300 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Tag size={13} aria-hidden="true" />
                <span>Estados</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupBy("none")}
                aria-pressed={groupBy === "none"}
                className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  groupBy === "none"
                    ? "bg-amber-300 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Layers size={13} aria-hidden="true" />
                <span>Sin agrupar</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-[11px] text-zinc-400 tabular-nums">
              {loadingList ? (
                <span className="inline-flex items-center gap-1.5 text-amber-300">
                  <Loader2 size={12} className="animate-spin" />
                  Actualizando...
                </span>
              ) : (
                `Mostrando ${visibleProducts.length} de ${totalDisplayedCount}`
              )}
            </span>

            <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => setDensity("comfortable")}
                aria-pressed={density === "comfortable"}
                className={`min-h-[36px] px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  density === "comfortable"
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Cómoda
              </button>
              <button
                type="button"
                onClick={() => setDensity("compact")}
                aria-pressed={density === "compact"}
                className={`min-h-[36px] px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  density === "compact"
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Compacta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Listado */}
      {visibleProducts.length === 0 ? (
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
                className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-900/40 transition-all"
              >
                {groupBy !== "none" && (
                  <div className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-zinc-900/90 border-b border-zinc-800/70">
                    <button
                      type="button"
                      id={`heading-${group.id}`}
                      aria-expanded={!isGroupCollapsed}
                      aria-controls={`group-content-${group.id}`}
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="flex-1 min-h-[44px] flex items-center justify-between gap-2.5 min-w-0 text-left px-2 py-1.5 rounded-xl hover:bg-zinc-800/60 transition-colors cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
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
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold shrink-0">
                            {group.products.length}{" "}
                            {group.products.length === 1 ? "prenda" : "prendas"}
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
                            {group.reservedCount} reserv.
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
                      className="shrink-0 min-h-[44px] text-[11px] font-medium text-zinc-400 hover:text-amber-200 px-3 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                    >
                      {isGroupAllSelected ? "Deseleccionar" : "Seleccionar grupo"}
                    </button>
                  </div>
                )}

                {!isGroupCollapsed && (
                  <div
                    id={`group-content-${group.id}`}
                    className="p-2.5 sm:p-3 space-y-2.5"
                  >
                    {group.products.map((p) => (
                      <ProductInventoryRowCard
                        key={p.id}
                        product={p}
                        categoryName={categoryMap.get(p.categoryId)?.name}
                        density={density}
                        isSelected={isProductSelected(p.id)}
                        isDetailsExpanded={expandedProductIds.has(p.id)}
                        isMenuOpen={openMenuProductId === p.id}
                        isEditingPrice={editingPriceId === p.id}
                        inlinePriceInput={inlinePriceInput}
                        onToggleSelect={toggleProductSelection}
                        onToggleDetails={toggleProductExpanded}
                        onToggleMenu={(productId) =>
                          setOpenMenuProductId((prev) => (prev === productId ? null : productId))
                        }
                        onCloseMenu={() => setOpenMenuProductId(null)}
                        onStartEditPrice={(product) => {
                          setEditingPriceId(product.id);
                          setInlinePriceInput(
                            product.priceCents !== null ? String(product.priceCents / 100) : ""
                          );
                        }}
                        onInlinePriceChange={setInlinePriceInput}
                        onSaveInlinePrice={(productId, price) =>
                          void handleSaveInlinePrice(productId, price)
                        }
                        onCancelEditPrice={() => setEditingPriceId(null)}
                        onStatusChange={(productId, status) =>
                          void handleStatusChange(productId, status)
                        }
                        onOpenQuickStock={setQuickStockProduct}
                        onToggleFeatured={(productId) => void handleToggleFeatured(productId)}
                        onOpenHistory={setHistoryTarget}
                        onRequestDelete={setProductToDelete}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Paginación en servidor */}
      {isServerPaginated && totalPages > 1 && (
        <AdminPaginationBar
          page={page}
          totalPages={totalPages}
          totalItems={total}
          itemLabel="productos"
          ariaLabel="Paginación de productos"
          onPageChange={handlePageChange}
          disabled={loadingList}
        />
      )}

      {/* Barra Flotante de Acciones en Lote */}
      <ProductBulkActionBar
        selectedCount={selectedProductIds.length}
        leafCategories={leafCategories}
        isBulkProcessing={isBulkProcessing}
        bulkStatusOpen={bulkStatusOpen}
        bulkCategoryOpen={bulkCategoryOpen}
        onToggleStatusOpen={() => {
          setBulkStatusOpen((prev) => !prev);
          setBulkCategoryOpen(false);
        }}
        onToggleCategoryOpen={() => {
          setBulkCategoryOpen((prev) => !prev);
          setBulkStatusOpen(false);
        }}
        onBulkStatus={(status) => void handleBulkStatus(status)}
        onBulkMoveCategory={(categoryId) => void handleBulkMoveCategory(categoryId)}
        onBulkFeatured={(isFeatured) => void handleBulkFeatured(isFeatured)}
        onRequestBulkDelete={() => setBulkDeleteConfirmOpen(true)}
        onClearSelection={clearSelection}
      />

      <QuickStockModal
        product={quickStockProduct}
        onClose={() => setQuickStockProduct(null)}
        onSaved={handleQuickStockSaved}
      />

      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Eliminar productos en lote"
        message={`¿Estás seguro de eliminar permanentemente ${selectedProductIds.length} producto(s) seleccionado(s)? Esta acción es irreversible.`}
        confirmLabel="Eliminar definitivamente"
        isLoading={isBulkProcessing}
      />

      <UndoToast
        action={undoAction}
        onUndo={handleUndo}
        onDismiss={() => setUndoAction(null)}
      />

      {historyTarget && (
        <StatusHistoryModal
          productId={historyTarget.id}
          productCode={historyTarget.code}
          productTitle={historyTarget.title}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {productToDelete && (
        <ConfirmDeleteProductModal
          product={productToDelete}
          onClose={() => setProductToDelete(null)}
          onDeleted={(deletedId) => {
            setProducts((prev) => prev.filter((p) => p.id !== deletedId));
            setTotal((prev) => Math.max(0, prev - 1));
            if (isProductSelected(deletedId)) {
              toggleProductSelection(deletedId);
            }
          }}
        />
      )}
    </div>
  );
}
