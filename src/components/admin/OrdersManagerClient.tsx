"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Search,
  ShoppingBag,
  Store,
  Truck,
  Bike,
  X,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Order, OrderStatus } from "../../domain/order/types";
import { formatOrderCode } from "../../domain/order/rules";
import { formatPriceARS } from "../../lib/format/currency";

interface OrdersManagerClientProps {
  initialOrders: Order[];
  brandName?: string;
  whatsappNumber?: string;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: typeof Clock }
> = {
  PENDING: {
    label: "Pendiente",
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-800/80",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmado",
    bg: "bg-sky-950/60",
    text: "text-sky-300",
    border: "border-sky-800/80",
    icon: CheckCircle2,
  },
  PAID: {
    label: "Pagado",
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/80",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelado",
    bg: "bg-zinc-900",
    text: "text-zinc-400",
    border: "border-zinc-700",
    icon: XCircle,
  },
};

export function OrdersManagerClient({
  initialOrders,
  brandName = "Aura Studio",
}: OrdersManagerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Si llega ?id= desde algún enlace legado, redirigimos a la vista dedicada de página completa
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      const parsed = parseInt(idParam, 10);
      if (!Number.isNaN(parsed)) {
        router.replace(`/admin/ordenes/${parsed}`);
      }
    }
  }, [searchParams, router]);

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

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
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

      setToastMessage(
        `Pedido ${formatOrderCode(data.order.code)} marcado como ${STATUS_CONFIG[newStatus].label}`
      );
      setTimeout(() => setToastMessage(null), 3000);
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
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
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

  // Generador de plantillas de WhatsApp según el estado
  const getWhatsAppMessage = (
    order: Order,
    type: "receipt" | "confirmed" | "ready"
  ) => {
    const code = formatOrderCode(order.code);
    const name = order.customerName.split(" ")[0];

    if (type === "receipt") {
      return `¡Hola ${name}! Recibimos tu pedido ${code} en ${brandName}. Te pasamos los datos para coordinar el pago o la entrega.`;
    }
    if (type === "confirmed") {
      return `¡Hola ${name}! Tu pedido ${code} ya está confirmado y estamos preparando tus prendas.`;
    }
    if (type === "ready") {
      if (order.deliveryMethod === "PICKUP") {
        return `¡Hola ${name}! Tu pedido ${code} ya está listo para retirar en nuestro showroom. ¡Te esperamos!`;
      }
      return `¡Hola ${name}! Tu paquete del pedido ${code} ya está listo y en camino a tu domicilio.`;
    }
    return `¡Hola ${name}! Te contactamos por tu pedido ${code} en ${brandName}.`;
  };

  const getWhatsAppLink = (
    order: Order,
    type: "receipt" | "confirmed" | "ready"
  ) => {
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(getWhatsAppMessage(order, type));
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

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

      {/* Banner de error accesible */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-950/60 border border-rose-700/80 text-rose-200 text-xs font-medium shadow-sm"
        >
          <div className="flex items-center gap-2">
            <AlertCircle
              size={16}
              className="text-rose-400 shrink-0"
              aria-hidden="true"
            />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Cerrar aviso de error"
            className="p-1 rounded-lg text-rose-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
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
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown de Estado */}
          <select
            value={activeTab}
            onChange={(e) => {
              setActiveTab(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filtrar por estado"
            className="text-xs py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
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
            className="text-xs py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
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
            className="text-xs py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
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
            className="text-xs py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
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
          {paginatedOrders.map((order) => {
                      const config =
                        STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                      const Icon = config.icon;
                      const isExpanded = expandedOrderIds.includes(order.id);
                      const isUpdating = updatingId === order.id;
                      const orderCodeLabel = formatOrderCode(order.code);

                      return (
                        <div
                          key={order.id}
                          className="transition-colors hover:bg-zinc-900/40"
                        >
                          {/* Fila Principal (Nivel 1) */}
                          <div
                            className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 ${
                              density === "compact" ? "py-2" : "py-3.5"
                            }`}
                          >
                            {/* Columna Izquierda: Botón Acordeón + Código + Cliente + Badges */}
                            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => toggleOrderExpand(order.id)}
                                aria-expanded={isExpanded}
                                aria-label={`${
                                  isExpanded ? "Ocultar" : "Desplegar"
                                } resumen rápido del pedido ${orderCodeLabel}`}
                                title={
                                  isExpanded
                                    ? "Ocultar resumen rápido"
                                    : "Desplegar prendas y entrega sin salir de la lista"
                                }
                                className="mt-0.5 sm:mt-0 w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-400/60 flex items-center justify-center text-zinc-300 hover:text-amber-300 text-xs shrink-0 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                              >
                                <span aria-hidden="true">
                                  {isExpanded ? "▴" : "▾"}
                                </span>
                              </button>

                              <Link prefetch={false}
                                href={`/admin/ordenes/${order.id}`}
                                className={`${
                                  density === "compact"
                                    ? "px-2 py-1 text-xs"
                                    : "px-2.5 py-1.5 text-xs"
                                } rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-400 font-mono font-bold text-amber-300 shrink-0 transition-colors`}
                                title={`Abrir ficha completa de ${orderCodeLabel}`}
                              >
                                {orderCodeLabel}
                              </Link>

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link prefetch={false}
                                    href={`/admin/ordenes/${order.id}`}
                                    className="text-sm font-bold text-zinc-100 hover:text-amber-300 transition-colors truncate"
                                  >
                                    {order.customerName}
                                  </Link>

                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.bg} ${config.text} ${config.border}`}
                                  >
                                    <Icon size={11} />
                                    <span>{config.label}</span>
                                  </span>


                                  {order.paymentMethod && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                                      {order.paymentMethod === "TRANSFER"
                                        ? "Transferencia"
                                        : order.paymentMethod === "MERCADOPAGO"
                                        ? "Mercado Pago"
                                        : order.paymentMethod === "PAYWAY"
                                        ? "Payway"
                                        : order.paymentMethod === "GETNET"
                                        ? "Getnet"
                                        : order.paymentMethod === "MODO"
                                        ? "MODO"
                                        : order.paymentMethod === "GOOGLEPAY"
                                        ? "Google Pay"
                                        : order.paymentMethod === "CASH"
                                        ? "Efectivo"
                                        : "WhatsApp"}
                                    </span>
                                  )}

                                  {order.claim && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        order.claim.status === "PENDING"
                                          ? "bg-rose-950/90 text-rose-200 border-rose-600/80 animate-pulse"
                                          : order.claim.status === "APPROVED_RESTOCKED"
                                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/80"
                                          : "bg-zinc-900 text-rose-300 border-rose-800/80"
                                      }`}
                                    >
                                      <RotateCcw size={10} />
                                      <span>
                                        {order.claim.status === "PENDING"
                                          ? `Postventa: ${order.claim.claimCode}`
                                          : order.claim.status === "APPROVED_RESTOCKED"
                                          ? "Devolución Aprobada"
                                          : "Devolución Rechazada"}
                                      </span>
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-zinc-300">{order.customerPhone}</span>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-1 text-zinc-300">
                                    {order.deliveryMethod === "PICKUP" ? (
                                      <>
                                        <Store size={11} className="text-amber-400" />
                                        Retiro Showroom
                                      </>
                                    ) : order.deliveryMethod === "MOTORCYCLE" ? (
                                      <>
                                        <Bike size={11} className="text-amber-400" />
                                        Moto Express
                                      </>
                                    ) : (
                                      <>
                                        <Truck size={11} className="text-amber-400" />
                                        A Domicilio
                                      </>
                                    )}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {order.items?.length || 1}{" "}
                                    {order.items?.length === 1 ? "prenda" : "prendas"}
                                  </span>
                                  <span>·</span>
                                  <span className="text-zinc-400">
                                    {new Date(order.createdAt * 1000).toLocaleDateString(
                                      "es-AR",
                                      {
                                        day: "2-digit",
                                        month: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Columna Derecha: Selector Rápido de Estado + Total + Link a Ficha Completa */}
                            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-zinc-800/60">
                              {/* Selector Rápido de Estado Inline (Patrón ProductListClient) */}
                              <div
                                role="group"
                                aria-label={`Cambiar estado de pedido ${orderCodeLabel}`}
                                className="inline-flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800"
                              >
                                {(
                                  [
                                    { key: "PENDING", label: "Pendiente" },
                                    { key: "CONFIRMED", label: "Confirmado" },
                                    { key: "PAID", label: "Pagado" },
                                    { key: "CANCELLED", label: "Cancelado" },
                                  ] as const
                                ).map((st) => {
                                  const active = order.status === st.key;
                                  return (
                                    <button
                                      key={st.key}
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleStatusChange(order.id, st.key)}
                                      aria-pressed={active}
                                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                                        active
                                          ? st.key === "PAID"
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                                            : st.key === "CONFIRMED"
                                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold"
                                            : st.key === "PENDING"
                                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold"
                                          : "text-zinc-400 hover:text-zinc-200"
                                      } ${isUpdating ? "opacity-50" : ""}`}
                                    >
                                      {st.label}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Total del Pedido */}
                              <div className="text-right min-w-[95px]">
                                <p className="font-serif text-sm sm:text-base font-bold text-zinc-100 font-mono lining-nums tabular-nums">
                                  {formatPriceARS(order.totalCents)}
                                </p>
                              </div>

                              {/* Acciones Directas: WhatsApp Chat de Alta Legibilidad y Ficha Completa */}
                              <div className="flex items-center gap-2">
                                <a
                                  href={getWhatsAppLink(
                                    order,
                                    order.status === "PENDING"
                                      ? "receipt"
                                      : order.status === "CONFIRMED"
                                      ? "confirmed"
                                      : "ready"
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Abrir chat de WhatsApp con ${order.customerName}`}
                                  aria-label={`Abrir chat de WhatsApp con ${order.customerName}`}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none shrink-0 cursor-pointer"
                                >
                                  <MessageCircle size={15} className="fill-white" />
                                  <span className="font-semibold text-xs">Chat</span>
                                </a>

                                <Link prefetch={false}
                                  href={`/admin/ordenes/${order.id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-amber-300 text-zinc-100 hover:text-zinc-950 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none shrink-0"
                                >
                                  <span>Ver ficha</span>
                                  <ArrowRight size={13} />
                                </Link>
                              </div>
                            </div>
                          </div>

                          {/* Panel Desplegable Inline (Nivel 2: Resumen de Prendas, Entrega y WhatsApp sin tapar la pantalla) */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 bg-zinc-950/60 border-t border-zinc-800/60 space-y-3">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Prendas del pedido */}
                                <div className="lg:col-span-2 space-y-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                                    Prendas reservadas ({order.items?.length || 0})
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {(order.items || []).map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          {item.photoUrl ? (
                                            <div className="relative w-9 h-11 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                                              <Image
                                                src={item.photoUrl}
                                                alt={item.productTitle}
                                                fill
                                                sizes="36px"
                                                className="object-cover"
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-9 h-11 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                                              <Package size={14} />
                                            </div>
                                          )}
                                          <div className="min-w-0">
                                            <p className="font-semibold text-zinc-200 truncate">
                                              #{String(item.productCode).padStart(3, "0")} ·{" "}
                                              {item.productTitle}
                                            </p>
                                            <p className="text-[11px] text-zinc-400">
                                              {item.colorName} · Talle {item.size} ·{" "}
                                              <strong className="text-zinc-200">
                                                x{item.quantity}
                                              </strong>
                                            </p>
                                          </div>
                                        </div>
                                        <span className="font-mono font-semibold text-zinc-200 shrink-0">
                                          {formatPriceARS(item.subtotalCents)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Resumen de Entrega y Acciones Rápidas */}
                                <div className="space-y-2.5 text-xs bg-zinc-900/70 p-3 rounded-xl border border-zinc-800">
                                  <div className="flex items-start gap-2">
                                    <MapPin
                                      size={14}
                                      className="text-amber-400 shrink-0 mt-0.5"
                                    />
                                    <div className="min-w-0">
                                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                                        Destino / Entrega
                                      </span>
                                      <p className="text-zinc-200 font-medium">
                                        {order.deliveryAddress ||
                                          "Retiro presencial en Showroom"}
                                      </p>
                                      {order.deliveryNotes && (
                                        <p className="text-[11px] text-zinc-400 italic mt-0.5">
                                          Nota: {order.deliveryNotes}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <a
                                        href={getWhatsAppLink(order, "receipt")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/60 text-emerald-300 text-[11px] font-medium transition-colors"
                                      >
                                        WA Pago
                                      </a>
                                      <a
                                        href={getWhatsAppLink(order, "confirmed")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1 rounded-md bg-sky-950/60 hover:bg-sky-900/70 border border-sky-800/60 text-sky-300 text-[11px] font-medium transition-colors"
                                      >
                                        WA Confirmado
                                      </a>
                                      <a
                                        href={getWhatsAppLink(order, "ready")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1 rounded-md bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800/60 text-amber-300 text-[11px] font-medium transition-colors"
                                      >
                                        WA Listo
                                      </a>
                                    </div>

                                    <Link prefetch={false}
                                      href={`/admin/ordenes/${order.id}`}
                                      className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold hover:underline"
                                    >
                                      <span>Ficha completa e impresión</span>
                                      <ExternalLink size={11} />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
        </div>
      )}

      {/* Barra de Paginación Inferior (Para manejar grandes volúmenes sin perder visibilidad) */}
      {totalPages > 1 && (
        <nav
          aria-label="Paginación de pedidos"
          className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-xs"
        >
          <span className="text-zinc-400">
            Página <strong className="text-zinc-100">{safePage}</strong> de{" "}
            <strong className="text-zinc-100">{totalPages}</strong> (
            {filteredOrders.length} pedidos en total)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 hover:border-amber-400 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 hover:border-amber-400 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <span>Siguiente</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
