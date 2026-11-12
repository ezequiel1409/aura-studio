"use client";

import { useCallback, useMemo, useState } from "react";
import { ADMIN_ORDERS_UPDATED_EVENT } from "./navigation/AdminNavContext";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { Order, OrderStatus } from "../../domain/order/types";
import { formatOrderCode } from "../../domain/order/rules";
import { useAutoDismiss } from "../../hooks/useAutoDismiss";
import { AdminFeedbackBanner } from "./ui/AdminFeedbackBanner";
import { ORDER_STATUS_CONFIG } from "./orders/order-ui.config";
import { OrderListRow } from "./orders/OrderListRow";

interface OrdersManagerClientProps {
  initialOrders: Order[];
  initialTotalCount?: number;
  brandName?: string;
  whatsappNumber?: string;
}

export function OrdersManagerClient({
  initialOrders,
  initialTotalCount,
  brandName = "Mi Tienda",
}: OrdersManagerClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [totalServerCount, setTotalServerCount] = useState<number>(
    initialTotalCount ?? initialOrders.length
  );
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);

  // 1. Filtros principales y búsqueda omnicanal
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState<string>("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // 2. Densidad y Acordeón Inline (resumen de prendas desplegable)
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [expandedOrderIds, setExpandedOrderIds] = useState<number[]>([]);

  // 3. Paginación para escalar con cientos de pedidos sin perder visibilidad
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const clearToast = useCallback(() => setToastMessage(null), []);
  useAutoDismiss(toastMessage, clearToast, 3000);

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const hasMoreServerOrders = orders.length < totalServerCount;

  const handleLoadMoreOrders = async () => {
    if (loadingMoreOrders || !hasMoreServerOrders) return;
    setLoadingMoreOrders(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/orders?limit=100&offset=${orders.length}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudieron cargar más pedidos.");
      }

      const fetched = Array.isArray(data.orders) ? (data.orders as Order[]) : [];
      setOrders((prev) => {
        const seen = new Set(prev.map((o) => o.id));
        const merged = [...prev];
        for (const item of fetched) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
        return merged;
      });
      if (typeof data.total === "number") {
        setTotalServerCount(data.total);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error de conexión al cargar más pedidos."
      );
    } finally {
      setLoadingMoreOrders(false);
    }
  };

  // Actualizar estado de orden inline
  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    const previousOrders = [...orders];
    setUpdatingId(orderId);
    setErrorMessage(null);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar el estado");
      }

      window.dispatchEvent(new Event(ADMIN_ORDERS_UPDATED_EVENT));
      setToastMessage(
        `Pedido ${formatOrderCode(data.order.code)} marcado como ${ORDER_STATUS_CONFIG[newStatus].label}`
      );
    } catch (err: unknown) {
      setOrders(previousOrders);
      setErrorMessage(err instanceof Error ? err.message : "Error al actualizar el pedido");
    } finally {
      setUpdatingId(null);
    }
  };


  // Conteo de pedidos por pestaña
  const counts = useMemo(() => {
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const inProgress = orders.filter(
      (o) => o.status === "CONFIRMED" || o.status === "PAID"
    ).length;
    const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
    const claims = orders.filter((o) => o.claim && o.claim.status === "PENDING").length;
    const all = orders.length;

    return {
      ALL: all,
      PENDING: pending,
      IN_PROGRESS: inProgress,
      CLAIMS: claims,
      CANCELLED: cancelled,
    };
  }, [orders]);

  // Limpieza de filtros
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    deliveryMethodFilter !== "ALL" ||
    paymentStatusFilter !== "ALL" ||
    dateRangeFilter !== "ALL" ||
    startDate !== "" ||
    endDate !== "" ||
    activeTab !== "ALL";

  const handleClearFilters = () => {
    setSearchQuery("");
    setDeliveryMethodFilter("ALL");
    setPaymentStatusFilter("ALL");
    setDateRangeFilter("ALL");
    setStartDate("");
    setEndDate("");
    setActiveTab("ALL");
    setCurrentPage(1);
  };

  // Filtrado reactivo por pestaña, método de entrega, cobro, fecha y búsqueda omnicanal
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const parseLocalDate = (dateStr: string, endOfDay = false): number | null => {
      if (!dateStr) return null;
      const parts = dateStr.split("-").map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return null;
      const [year, month, day] = parts;
      if (endOfDay) {
        return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
      }
      return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
    };

    return orders.filter((o) => {
      // 1. Filtro por Pestaña / Selector de Estado
      if (activeTab === "PENDING" && o.status !== "PENDING") return false;
      if (
        activeTab === "IN_PROGRESS" &&
        o.status !== "CONFIRMED" &&
        o.status !== "PAID"
      ) {
        return false;
      }
      if (activeTab === "CANCELLED" && o.status !== "CANCELLED") return false;
      if (activeTab === "CLAIMS" && !o.claim) return false;

      // 2. Filtro por Método de Entrega
      if (deliveryMethodFilter !== "ALL" && o.deliveryMethod !== deliveryMethodFilter) {
        return false;
      }

      // 3. Filtro por Estado de Cobro
      if (paymentStatusFilter === "PAID" && o.paymentStatus !== "PAID") return false;
      if (paymentStatusFilter === "PENDING" && o.paymentStatus === "PAID") return false;

      // 4. Filtro por Rango de Fecha (Presets y Rango Personalizado Desde / Hasta)
      const orderDateMs = o.createdAt * 1000;
      if (dateRangeFilter === "TODAY" && orderDateMs < todayStart) return false;
      if (dateRangeFilter === "YESTERDAY") {
        const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
        if (orderDateMs < yesterdayStart || orderDateMs >= todayStart) return false;
      }
      if (dateRangeFilter === "WEEK" && orderDateMs < weekAgo) return false;
      if (dateRangeFilter === "MONTH" && orderDateMs < monthStart) return false;
      if (dateRangeFilter === "CUSTOM") {
        const startMs = parseLocalDate(startDate, false);
        if (startMs !== null && orderDateMs < startMs) return false;
        const endMs = parseLocalDate(endDate, true);
        if (endMs !== null && orderDateMs > endMs) return false;
      }

      // 5. Búsqueda Omnicanal (DNI, Código, Email, Teléfono, Nombre, Trámite, Cupón, Prenda)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const queryDigits = query.replace(/\D/g, "");

        const codeNum = String(o.code);
        const codeStr = formatOrderCode(o.code).toLowerCase();
        const codeMatch =
          codeNum.includes(query) ||
          codeStr.includes(query) ||
          (queryDigits !== "" && queryDigits === codeNum);

        const dniDigits = o.customerDni ? o.customerDni.replace(/\D/g, "") : "";
        const claimDniDigits = o.claim?.customerDni
          ? o.claim.customerDni.replace(/\D/g, "")
          : "";
        const dniMatch =
          Boolean(o.customerDni && o.customerDni.toLowerCase().includes(query)) ||
          (queryDigits.length >= 3 && dniDigits.includes(queryDigits)) ||
          Boolean(
            o.claim?.customerDni && o.claim.customerDni.toLowerCase().includes(query)
          ) ||
          (queryDigits.length >= 3 && claimDniDigits.includes(queryDigits));

        const nameMatch = o.customerName.toLowerCase().includes(query);

        const phoneDigits = o.customerPhone.replace(/\D/g, "");
        const phoneMatch =
          o.customerPhone.toLowerCase().includes(query) ||
          (queryDigits.length >= 3 && phoneDigits.includes(queryDigits));

        const emailMatch = Boolean(
          o.customerEmail && o.customerEmail.toLowerCase().includes(query)
        );

        const claimMatch = Boolean(
          o.claim?.claimCode && o.claim.claimCode.toLowerCase().includes(query)
        );

        const couponMatch = Boolean(
          o.couponCode && o.couponCode.toLowerCase().includes(query)
        );

        const itemMatch = Boolean(
          o.items?.some(
            (i) =>
              i.productTitle.toLowerCase().includes(query) ||
              String(i.productCode).includes(query) ||
              i.colorName.toLowerCase().includes(query) ||
              i.size.toLowerCase().includes(query)
          )
        );

        const addressMatch = Boolean(
          (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(query)) ||
            (o.deliveryNotes && o.deliveryNotes.toLowerCase().includes(query))
        );

        return (
          codeMatch ||
          dniMatch ||
          nameMatch ||
          phoneMatch ||
          emailMatch ||
          claimMatch ||
          couponMatch ||
          itemMatch ||
          addressMatch
        );
      }

      return true;
    });
  }, [
    orders,
    activeTab,
    deliveryMethodFilter,
    paymentStatusFilter,
    dateRangeFilter,
    startDate,
    endDate,
    searchQuery,
  ]);

  // Paginación segura
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, safePage, pageSize]);

  return (
    <div className="space-y-5">
      {/* Toast de confirmación de acción */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 rounded-xl border border-emerald-800 bg-emerald-950/95 px-4 py-2.5 text-xs font-semibold text-emerald-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2"
        >
          {toastMessage}
        </div>
      )}

      {errorMessage && (
        <AdminFeedbackBanner
          type="error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 font-serif">
              Gestión de Pedidos
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Vista jerárquica con agrupación inteligente, acciones rápidas en línea y ficha completa por orden.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-zinc-300">
            Total pedidos: <strong className="text-zinc-100">{orders.length}</strong>
          </span>
          {counts.PENDING > 0 && (
            <span className="rounded-lg bg-amber-950/70 border border-amber-800/80 px-3 py-1.5 text-amber-300 font-semibold">
              {counts.PENDING} {counts.PENDING === 1 ? "pendiente" : "pendientes"}
            </span>
          )}
        </div>
      </div>

      {/* Barra de Filtros, Buscador y Selectores */}
      <div className="space-y-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        {/* Fila 1: Buscador Omnicanal a Ancho Completo */}
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="search"
            aria-label="Buscar pedido por DNI, número de orden, cliente, teléfono o prenda"
            placeholder="Buscar por DNI, #orden, cliente, tel, prenda..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-400 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer p-1"
              aria-label="Borrar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Fila 2: Filtros desplegables en Dropdown (Estado, Entrega, Cobro, Fecha con Desde/Hasta) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2.5">
          {/* Dropdown de Estado */}
          <select
            value={activeTab}
            onChange={(e) => {
              setActiveTab(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filtrar por estado"
            className="min-h-[44px] text-xs py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
          >
            <option value="ALL">Estado: Todos ({counts.ALL})</option>
            <option value="PENDING">Pendientes ({counts.PENDING})</option>
            <option value="IN_PROGRESS">En curso / Pagados ({counts.IN_PROGRESS})</option>
            <option value="CLAIMS">Arrepentimientos ({counts.CLAIMS})</option>
            <option value="CANCELLED">Cancelados ({counts.CANCELLED})</option>
          </select>

          {/* Dropdown de Método de Entrega */}
          <select
            value={deliveryMethodFilter}
            onChange={(e) => {
              setDeliveryMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filtrar por método de entrega"
            className="min-h-[44px] text-xs py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
          >
            <option value="ALL">Entrega: Todas</option>
            <option value="PICKUP">Retiro Showroom</option>
            <option value="MOTORCYCLE">Moto Express</option>
            <option value="HOME_DELIVERY">A Domicilio</option>
          </select>

          {/* Dropdown de Estado de Cobro */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filtrar por estado de cobro"
            className="min-h-[44px] text-xs py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
          >
            <option value="ALL">Cobro: Todos</option>
            <option value="PENDING">Por Cobrar</option>
            <option value="PAID">Cobrados</option>
          </select>

          {/* Dropdown de Rango de Fecha */}
          <select
            value={dateRangeFilter}
            onChange={(e) => {
              setDateRangeFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filtrar por fecha"
            className="min-h-[44px] text-xs py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
          >
            <option value="ALL">Fecha: Todas</option>
            <option value="TODAY">Hoy</option>
            <option value="YESTERDAY">Ayer</option>
            <option value="WEEK">Últimos 7 días</option>
            <option value="MONTH">Este mes</option>
            <option value="CUSTOM">Personalizada (Desde / Hasta)</option>
          </select>

          {/* Selector de Rango Personalizado (Desde / Hasta) */}
          {dateRangeFilter === "CUSTOM" && (
            <div className="flex flex-wrap items-center gap-2 p-1 bg-zinc-950/80 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-1.5 px-2">
                <label htmlFor="order-filter-start" className="text-xs text-zinc-400 font-medium">
                  Desde:
                </label>
                <input
                  id="order-filter-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs py-1 px-2 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5 px-2">
                <label htmlFor="order-filter-end" className="text-xs text-zinc-400 font-medium">
                  Hasta:
                </label>
                <input
                  id="order-filter-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs py-1 px-2 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 hover:underline cursor-pointer font-medium ml-auto"
            >
              <X size={13} />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Fila 3: Controles de Vista, Densidad y Paginación (sin Agrupar) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span>
              Mostrando <strong className="text-zinc-100">{paginatedOrders.length}</strong> de{" "}
              <strong className="text-zinc-100">{filteredOrders.length}</strong> pedidos
              {filteredOrders.length < orders.length && ` (filtrado de ${orders.length} totales)`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Expandir / Colapsar todos los pedidos */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpandedOrderIds(paginatedOrders.map((o) => o.id))}
                className="px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                title="Desplegar resumen de prendas y entrega en todas las filas visibles"
              >
                + Ver detalles
              </button>
              <button
                type="button"
                onClick={() => setExpandedOrderIds([])}
                className="px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                title="Colapsar detalles de todas las filas"
              >
                - Vista compacta
              </button>
            </div>

            {/* Densidad */}
            <div className="inline-flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800">
              <button
                type="button"
                onClick={() => setDensity("comfortable")}
                aria-pressed={density === "comfortable"}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  density === "comfortable"
                    ? "bg-amber-300 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Cómoda
              </button>
              <button
                type="button"
                onClick={() => setDensity("compact")}
                aria-pressed={density === "compact"}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  density === "compact"
                    ? "bg-amber-300 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Compacta
              </button>
            </div>

            {/* Selector de Filas por página */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="orders-page-size" className="text-zinc-400">
                Filas:
              </label>
              <select
                id="orders-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-md bg-zinc-950 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos (sin agrupación redundante) */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <ShoppingBag size={32} className="mx-auto text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-300">
            {activeTab === "PENDING" && !hasActiveFilters
              ? "No tenés pedidos pendientes de confirmación. ¡Todo al día! ✨"
              : "No se encontraron pedidos con los filtros o búsqueda actuales."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-amber-300 cursor-pointer transition-colors"
            >
              <X size={13} />
              <span>Restablecer y ver todos los pedidos</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/80 shadow-xs">
          {paginatedOrders.map((order) => (
            <OrderListRow
              key={order.id}
              order={order}
              density={density}
              isExpanded={expandedOrderIds.includes(order.id)}
              isUpdating={updatingId === order.id}
              brandName={brandName}
              onToggleExpand={toggleOrderExpand}
              onStatusChange={(orderId, status) => void handleStatusChange(orderId, status)}
            />
          ))}
        </div>
      )}

      {/* Barra de Paginación Inferior y Carga Histórica (>100 pedidos) */}
      {(totalPages > 1 || hasMoreServerOrders) && (
        <nav
          aria-label="Paginación de pedidos"
          className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-xs"
        >
          <span className="text-zinc-400">
            Página <strong className="text-zinc-100">{safePage}</strong> de{" "}
            <strong className="text-zinc-100">{totalPages}</strong> (
            {filteredOrders.length} mostrados · {totalServerCount} totales)
          </span>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {hasMoreServerOrders && (
              <button
                type="button"
                disabled={loadingMoreOrders}
                onClick={() => void handleLoadMoreOrders()}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-amber-300/15 border border-amber-400/40 text-amber-200 hover:bg-amber-300/25 disabled:opacity-50 cursor-pointer transition-colors font-semibold"
              >
                {loadingMoreOrders && <Loader2 size={14} className="animate-spin" />}
                <span>
                  {loadingMoreOrders
                    ? "Cargando..."
                    : `Cargar más pedidos (${orders.length}/${totalServerCount})`}
                </span>
              </button>
            )}

            {totalPages > 1 && (
              <>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="min-h-[44px] inline-flex items-center gap-1 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 hover:border-amber-400 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  <ChevronLeft size={14} />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="min-h-[44px] inline-flex items-center gap-1 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 hover:border-amber-400 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
