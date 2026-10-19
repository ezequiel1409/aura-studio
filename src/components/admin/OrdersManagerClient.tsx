"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  ShoppingBag,
  Store,
  Truck,
  Bike,
  Calendar,
  X,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Order, OrderStatus } from "../../domain/order/types";
import { OrderClaim } from "../../domain/claim/types";
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
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // 1. Pestaña inicial 'Pendientes' por defecto (o ALL si no hay ninguno)
  const initialPendingCount = initialOrders.filter((o) => o.status === "PENDING").length;
  const [activeTab, setActiveTab] = useState<string>(
    initialPendingCount > 0 ? "PENDING" : "ALL"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(() => {
    const idParam = searchParams.get("id");
    return idParam ? parseInt(idParam, 10) : null;
  });

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Escuchar si cambia el search param 'id'
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      const parsed = parseInt(idParam, 10);
      if (!Number.isNaN(parsed)) {
        setSelectedOrderId(parsed);
      }
    }
  }, [searchParams]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Actualizar estado de orden
  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    const previousOrders = [...orders];
    setUpdatingId(orderId);
    setErrorMessage(null);

    // Actualización optimista
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
        `Pedido #${data.order.code.toString().padStart(3, "0")} marcado como ${
          STATUS_CONFIG[newStatus].label
        }`
      );
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      setOrders(previousOrders);
      setErrorMessage(err instanceof Error ? err.message : "Error al actualizar el pedido");
    } finally {
      setUpdatingId(null);
    }
  };

  // Inspección de calidad del reclamo/arrepentimiento
  const [inspectingClaimId, setInspectingClaimId] = useState<string | null>(null);

  const handleInspectClaim = async (
    claimId: string,
    decision: "APPROVE_RESTOCK" | "REJECT_CONDITION",
    rejectionReason?: string
  ) => {
    setInspectingClaimId(claimId);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/claims/${claimId}/inspect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo procesar la inspección.");
      }

      setOrders((prev) =>
        prev.map((o) => {
          if (o.claim?.id === claimId) {
            return {
              ...o,
              status: decision === "APPROVE_RESTOCK" ? "CANCELLED" : o.status,
              claim: data.claim,
            };
          }
          return o;
        })
      );

      setToastMessage(
        decision === "APPROVE_RESTOCK"
          ? "Devolución aprobada. El stock fue recirculado automáticamente a la tienda."
          : "Devolución rechazada por no cumplir las condiciones de recirculación."
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error al procesar la inspección.");
    } finally {
      setInspectingClaimId(null);
    }
  };

  const handleRejectCondition = (claim: OrderClaim) => {
    const reason = window.prompt(
      "Ingresá el motivo del rechazo del producto (ej: Manchas de maquillaje en cuello, olor a perfume, sin etiqueta original):",
      "Prenda recibida con manchas o señales de uso que impiden su recirculación."
    );
    if (reason === null) return;
    handleInspectClaim(claim.id, "REJECT_CONDITION", reason);

    const cleanPhone = claim.customerPhone.replace(/[^0-9]/g, "");
    const waText = encodeURIComponent(
      `Hola ${claim.customerName.split(" ")[0]}! Te contactamos de ${brandName} por tu trámite ${claim.claimCode}. Recibimos la prenda en el showroom pero durante el control de calidad detectamos que no se encuentra en condiciones de recirculación (${reason}). Te enviamos fotos para coordinar.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${waText}`, "_blank");
  };

  // Conteo de pedidos por pestaña
  const counts = useMemo(() => {
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const inProgress = orders.filter((o) => o.status === "CONFIRMED" || o.status === "PAID").length;
    const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
    const claims = orders.filter((o) => o.claim && o.claim.status === "PENDING").length;
    const all = orders.length;

    return {
      PENDING: pending,
      IN_PROGRESS: inProgress,
      CANCELLED: cancelled,
      CLAIMS: claims,
      ALL: all,
    };
  }, [orders]);

  // Limpieza de filtros
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    deliveryMethodFilter !== "ALL" ||
    dateRangeFilter !== "ALL" ||
    activeTab !== "ALL";

  const handleClearFilters = () => {
    setSearchQuery("");
    setDeliveryMethodFilter("ALL");
    setDateRangeFilter("ALL");
    setActiveTab("ALL");
  };

  // Filtrado reactivo por pestaña, método de entrega, fecha y búsqueda omnicanal
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((o) => {
      // 1. Filtro por Pestaña de Estado
      if (activeTab === "PENDING" && o.status !== "PENDING") return false;
      if (activeTab === "IN_PROGRESS" && o.status !== "CONFIRMED" && o.status !== "PAID") return false;
      if (activeTab === "CANCELLED" && o.status !== "CANCELLED") return false;
      if (activeTab === "CLAIMS" && !o.claim) return false;

      // 2. Filtro por Método de Entrega
      if (deliveryMethodFilter !== "ALL" && o.deliveryMethod !== deliveryMethodFilter) {
        return false;
      }

      // 3. Filtro por Rango de Fecha
      const orderDateMs = o.createdAt * 1000;
      if (dateRangeFilter === "TODAY" && orderDateMs < todayStart) return false;
      if (dateRangeFilter === "WEEK" && orderDateMs < weekAgo) return false;
      if (dateRangeFilter === "MONTH" && orderDateMs < monthStart) return false;

      // 4. Búsqueda Omnicanal (DNI, Código, Email, Teléfono, Nombre, Trámite, Cupón, Prenda)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const queryDigits = query.replace(/\D/g, "");

        // A. Código de orden (#ORD-001, 1, 001)
        const codeNum = String(o.code);
        const codeStr = formatOrderCode(o.code).toLowerCase();
        const codeMatch =
          codeNum.includes(query) ||
          codeStr.includes(query) ||
          (queryDigits !== "" && queryDigits === codeNum);

        // B. DNI del comprador (en orden o en reclamo de arrepentimiento)
        const dniDigits = o.customerDni ? o.customerDni.replace(/\D/g, "") : "";
        const claimDniDigits = o.claim?.customerDni ? o.claim.customerDni.replace(/\D/g, "") : "";
        const dniMatch =
          Boolean(o.customerDni && o.customerDni.toLowerCase().includes(query)) ||
          (queryDigits.length >= 3 && dniDigits.includes(queryDigits)) ||
          Boolean(o.claim?.customerDni && o.claim.customerDni.toLowerCase().includes(query)) ||
          (queryDigits.length >= 3 && claimDniDigits.includes(queryDigits));

        // C. Nombre del comprador
        const nameMatch = o.customerName.toLowerCase().includes(query);

        // D. Teléfono / WhatsApp (con o sin símbolos)
        const phoneDigits = o.customerPhone.replace(/\D/g, "");
        const phoneMatch =
          o.customerPhone.toLowerCase().includes(query) ||
          (queryDigits.length >= 3 && phoneDigits.includes(queryDigits));

        // E. Email del comprador
        const emailMatch = Boolean(o.customerEmail && o.customerEmail.toLowerCase().includes(query));

        // F. Código de trámite / arrepentimiento (REV-#ORD-001-XXXX o CAM-...)
        const claimMatch = Boolean(o.claim?.claimCode && o.claim.claimCode.toLowerCase().includes(query));

        // G. Cupón de descuento aplicado
        const couponMatch = Boolean(o.couponCode && o.couponCode.toLowerCase().includes(query));

        // H. Prendas o código de producto dentro de la orden
        const itemMatch = Boolean(
          o.items?.some(
            (i) =>
              i.productTitle.toLowerCase().includes(query) ||
              String(i.productCode).includes(query) ||
              i.colorName.toLowerCase().includes(query) ||
              i.size.toLowerCase().includes(query)
          )
        );

        // I. Dirección de entrega / notas
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
  }, [orders, activeTab, deliveryMethodFilter, dateRangeFilter, searchQuery]);

  // Generador de plantillas de WhatsApp según el estado
  const getWhatsAppMessage = (order: Order, type: "receipt" | "confirmed" | "ready") => {
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

  const getWhatsAppLink = (order: Order, type: "receipt" | "confirmed" | "ready") => {
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(getWhatsAppMessage(order, type));
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="space-y-6">
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
            <AlertCircle size={16} className="text-rose-400 shrink-0" aria-hidden="true" />
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 font-serif">
              Gestión de Pedidos
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Control del flujo de ventas, reservas y coordinación con clientes de {brandName}.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-zinc-300">
            Total: <strong className="text-zinc-100">{orders.length}</strong>
          </span>
          {counts.PENDING > 0 && (
            <span className="rounded-lg bg-amber-950/70 border border-amber-800/80 px-3 py-1.5 text-amber-300 font-semibold animate-pulse">
              {counts.PENDING} {counts.PENDING === 1 ? "pendiente" : "pendientes"}
            </span>
          )}
        </div>
      </div>

      {/* Barra de Filtros, Buscador y Selectores */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Pestañas de filtrado con badge destacado para pendientes */}
          <div
            role="tablist"
            aria-label="Filtros de estado de órdenes"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs"
          >
            {[
              { id: "PENDING", label: "Pendientes", count: counts.PENDING, highlight: true },
              { id: "IN_PROGRESS", label: "En curso", count: counts.IN_PROGRESS },
              { id: "CLAIMS", label: "Arrepentimientos", count: counts.CLAIMS, highlight: true },
              { id: "CANCELLED", label: "Cancelados", count: counts.CANCELLED },
              { id: "ALL", label: "Todos", count: counts.ALL },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    isActive
                      ? "bg-amber-300 text-zinc-950 font-bold shadow-xs"
                      : tab.highlight && tab.count > 0
                      ? "bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-950/60"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? "bg-zinc-950 text-amber-300"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Buscador Omnicanal y Filtros Dropdowns */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            {/* Buscador Omnicanal */}
            <div className="relative flex-1 sm:w-72 lg:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por DNI, #orden, cliente, tel, cupón..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  aria-label="Borrar búsqueda"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Dropdown Método de Entrega */}
            <div className="relative">
              <select
                value={deliveryMethodFilter}
                onChange={(e) => setDeliveryMethodFilter(e.target.value)}
                aria-label="Filtrar por método de entrega"
                className="w-full sm:w-auto text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="ALL">Entrega: Todas</option>
                <option value="PICKUP">Retiro Showroom</option>
                <option value="MOTORCYCLE">Moto Express</option>
                <option value="HOME_DELIVERY">A Domicilio</option>
              </select>
            </div>

            {/* Dropdown Rango de Fecha */}
            <div className="relative">
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                aria-label="Filtrar por fecha"
                className="w-full sm:w-auto text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="ALL">Fecha: Todas</option>
                <option value="TODAY">Hoy</option>
                <option value="WEEK">Últimos 7 días</option>
                <option value="MONTH">Este mes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resumen de Resultados y Botón de Limpiar Filtros */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-0.5">
          <span>
            Mostrando <strong className="text-zinc-200">{filteredOrders.length}</strong> de{" "}
            <strong className="text-zinc-200">{orders.length}</strong> pedidos
            {filteredOrders.length < orders.length && " (filtrados)"}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 hover:underline cursor-pointer font-medium"
            >
              <X size={13} />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista de Pedidos en Tarjetas Interactivas */}
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
        <div className="space-y-2.5">
          {filteredOrders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const Icon = config.icon;
            const isSelected = selectedOrderId === order.id;

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                  isSelected
                    ? "bg-zinc-900 border-amber-400 shadow-md ring-1 ring-amber-400/50"
                    : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                {/* Lado Izquierdo: Código, Cliente, Teléfono, Método */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-amber-300 shrink-0">
                    {formatOrderCode(order.code)}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                        {order.customerName}
                      </h3>
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
                            : order.paymentMethod === "CASH"
                            ? "Efectivo"
                            : "WhatsApp"}
                        </span>
                      )}

                      {order.paymentStatus === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                          Cobrado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80">
                          Por Cobrar
                        </span>
                      )}

                      {order.claim && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            order.claim.status === "PENDING"
                              ? "bg-amber-950/80 text-amber-300 border-amber-600/80 animate-pulse"
                              : order.claim.status === "APPROVED_RESTOCKED"
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/80"
                              : "bg-rose-950/80 text-rose-300 border-rose-800/80"
                          }`}
                        >
                          <RotateCcw size={10} />
                          <span>
                            {order.claim.status === "PENDING"
                              ? `Arrepentimiento: ${order.claim.claimCode}`
                              : order.claim.status === "APPROVED_RESTOCKED"
                              ? "Arrepentimiento Aprobado"
                              : "Devolución Rechazada"}
                          </span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
                      <span>{order.customerPhone}</span>
                      {order.customerDni && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-zinc-300">DNI {order.customerDni}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>
                        {order.deliveryMethod === "PICKUP"
                          ? "Retiro en Showroom"
                          : order.deliveryMethod === "MOTORCYCLE"
                          ? "Envío Moto Express"
                          : "Envío a Domicilio"}
                      </span>
                      {order.couponCode && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded text-[10px] border border-amber-800/60">
                            Cupón {order.couponCode}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>
                        {order.items?.length || 1} {order.items?.length === 1 ? "pieza" : "piezas"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Lado Derecho: Total y Flecha / CTA */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/80">
                  <div className="text-left sm:text-right">
                    <p className="font-serif text-base font-bold text-zinc-100 font-mono lining-nums tabular-nums">
                      {formatPriceARS(order.totalCents)}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {new Date(order.createdAt * 1000).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderId(order.id);
                    }}
                    className="p-2 rounded-xl bg-zinc-950 group-hover:bg-amber-300 group-hover:text-zinc-950 text-zinc-400 transition-colors"
                    aria-label={`Ver detalle del pedido ${formatOrderCode(order.code)}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Slide-over Drawer: Detalle Completo del Pedido sin salir de la lista */}
      {selectedOrder && (
        <>
          <div
            className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedOrderId(null)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-order-title"
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-zinc-900 border-l border-zinc-800 shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right"
          >
            {/* Encabezado del Drawer */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2
                    id="drawer-order-title"
                    className="font-serif text-xl font-bold text-zinc-100 font-mono"
                  >
                    Pedido {formatOrderCode(selectedOrder.code)}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      STATUS_CONFIG[selectedOrder.status].bg
                    } ${STATUS_CONFIG[selectedOrder.status].text} ${
                      STATUS_CONFIG[selectedOrder.status].border
                    }`}
                  >
                    {STATUS_CONFIG[selectedOrder.status].label}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Registrado el{" "}
                  {new Date(selectedOrder.createdAt * 1000).toLocaleString("es-AR")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                aria-label="Cerrar panel de pedido"
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tarjeta Anidada: Solicitud de Arrepentimiento / Postventa (Res. 424/2020) */}
            {selectedOrder.claim && (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/40 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={15} className="text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      {selectedOrder.claim.type === "EXCHANGE" ? "Solicitud de Cambio" : "Solicitud de Arrepentimiento"}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-zinc-100 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                    {selectedOrder.claim.claimCode}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Titular / DNI:</span>
                    <span className="font-medium text-zinc-200">
                      {selectedOrder.claim.customerName} (DNI {selectedOrder.claim.customerDni})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Fecha de solicitud:</span>
                    <span>{new Date(selectedOrder.claim.createdAt * 1000).toLocaleString("es-AR")}</span>
                  </div>
                  {selectedOrder.claim.reason && (
                    <div className="pt-1 text-[11px] bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-zinc-300">
                      <span className="text-zinc-400 block font-semibold">Observación del cliente:</span>
                      <p className="italic mt-0.5">"{selectedOrder.claim.reason}"</p>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>Cliente declaró prenda con etiqueta, sin uso ni manchas para recircular.</span>
                  </div>
                </div>

                {/* Estado de Inspección y Acciones del Comercio */}
                {selectedOrder.claim.status === "PENDING" ? (
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <span className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wide">
                      Control de Calidad & Recirculación:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={inspectingClaimId === selectedOrder.claim.id}
                        onClick={() => handleInspectClaim(selectedOrder.claim!.id, "APPROVE_RESTOCK")}
                        className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {inspectingClaimId === selectedOrder.claim.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        <span>Aprobar y Recircular (+1 stock)</span>
                      </button>

                      <button
                        type="button"
                        disabled={inspectingClaimId === selectedOrder.claim.id}
                        onClick={() => handleRejectCondition(selectedOrder.claim!)}
                        className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-rose-300 border border-rose-900/40 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle size={13} />
                        <span>Rechazar por Manchas / Uso</span>
                      </button>
                    </div>
                  </div>
                ) : selectedOrder.claim.status === "APPROVED_RESTOCKED" ? (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Devolución aprobada y finalizada</p>
                      <p className="text-[11px] text-emerald-400/80 mt-0.5">
                        La orden fue cancelada y el stock de cada variante volvió a estar disponible en tienda.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 space-y-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <XCircle size={15} />
                      <span>Devolución rechazada por control de calidad</span>
                    </div>
                    {selectedOrder.claim.rejectionReason && (
                      <p className="text-[11px] text-zinc-400 italic">
                        Motivo: {selectedOrder.claim.rejectionReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botón de Acción Principal Contextual */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Acción contextual
              </span>

              {selectedOrder.status === "PENDING" && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={updatingId === selectedOrder.id}
                    onClick={() => handleStatusChange(selectedOrder.id, "CONFIRMED")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {updatingId === selectedOrder.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    <span>Confirmar pedido</span>
                  </button>

                  <button
                    type="button"
                    disabled={updatingId === selectedOrder.id}
                    onClick={() => handleStatusChange(selectedOrder.id, "CANCELLED")}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-rose-300 border border-zinc-800 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span>Rechazar / Cancelar</span>
                  </button>
                </div>
              )}

              {selectedOrder.status === "CONFIRMED" && (
                <button
                  type="button"
                  disabled={updatingId === selectedOrder.id}
                  onClick={() => handleStatusChange(selectedOrder.id, "PAID")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {updatingId === selectedOrder.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Marcar como pagado</span>
                </button>
              )}

              {selectedOrder.status === "PAID" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 size={15} />
                    <span>Pago confirmado</span>
                  </div>
                  <button
                    type="button"
                    disabled={updatingId === selectedOrder.id}
                    onClick={() => handleStatusChange(selectedOrder.id, "CONFIRMED")}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                  >
                    Revertir a confirmado
                  </button>
                </div>
              )}

              {selectedOrder.status === "CANCELLED" && (
                <button
                  type="button"
                  disabled={updatingId === selectedOrder.id}
                  onClick={() => handleStatusChange(selectedOrder.id, "PENDING")}
                  className="w-full py-2 px-4 rounded-xl bg-zinc-900 text-amber-300 border border-zinc-800 text-xs font-bold hover:bg-zinc-800 transition-colors"
                >
                  Restaurar a pendiente
                </button>
              )}
            </div>

            {/* Mensajes Predefinidos de WhatsApp */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <MessageCircle size={15} className="text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200">
                  Mensajes rápidos por WhatsApp
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={getWhatsAppLink(selectedOrder, "receipt")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-200 transition-colors"
                >
                  <span>1. Enviar datos de pago / recepción</span>
                  <ExternalLink size={13} className="text-emerald-400" />
                </a>

                <a
                  href={getWhatsAppLink(selectedOrder, "confirmed")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-200 transition-colors"
                >
                  <span>2. Avisar que el pedido está confirmado</span>
                  <ExternalLink size={13} className="text-emerald-400" />
                </a>

                <a
                  href={getWhatsAppLink(selectedOrder, "ready")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-200 transition-colors"
                >
                  <span>3. Avisar que está listo / en camino</span>
                  <ExternalLink size={13} className="text-emerald-400" />
                </a>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Datos del cliente
              </h3>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Nombre:</span>
                  <strong className="text-zinc-200">{selectedOrder.customerName}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Teléfono:</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedOrder.customerPhone}`}
                      className="text-amber-300 hover:underline font-mono"
                    >
                      {selectedOrder.customerPhone}
                    </a>
                    <a
                      href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800"
                    >
                      <MessageCircle size={12} />
                    </a>
                  </div>
                </div>

                {selectedOrder.customerEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Email:</span>
                    <span className="text-zinc-300 font-mono">{selectedOrder.customerEmail}</span>
                  </div>
                )}

                {selectedOrder.customerDni && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">DNI:</span>
                    <span className="text-zinc-200 font-mono font-medium">{selectedOrder.customerDni}</span>
                  </div>
                )}

                {selectedOrder.couponCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Cupón aplicado:</span>
                    <span className="font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded text-xs border border-amber-800/60 font-semibold">
                      {selectedOrder.couponCode}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-800/80 flex items-start justify-between gap-2">
                  <span className="text-zinc-400">Entrega:</span>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-200">
                      {selectedOrder.deliveryMethod === "PICKUP"
                        ? "Retiro en Showroom"
                        : selectedOrder.deliveryMethod === "MOTORCYCLE"
                        ? "Moto Express"
                        : "Envío a Domicilio"}
                    </p>
                    {selectedOrder.deliveryAddress && (
                      <p className="text-zinc-400 text-[11px] max-w-[240px]">
                        {selectedOrder.deliveryAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Piezas Pedidas */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Piezas del pedido ({selectedOrder.items?.length || 1})
              </h3>

              <div className="space-y-2">
                {selectedOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                        {item.photoUrl ? (
                          <Image
                            src={item.photoUrl}
                            alt={item.productTitle}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Package size={16} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-200 truncate">
                          {item.productTitle}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {item.colorName} · Talle {item.size} · Cant: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-zinc-100 font-mono">
                        {formatPriceARS(item.subtotalCents)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen Financiero y Enlace a Comprobante */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono">{formatPriceARS(selectedOrder.subtotalCents)}</span>
              </div>
              {selectedOrder.discountCents > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Descuento aplicado</span>
                  <span className="font-mono">-{formatPriceARS(selectedOrder.discountCents)}</span>
                </div>
              )}
              {selectedOrder.paymentDiscountCents && selectedOrder.paymentDiscountCents > 0 ? (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Bonificación Transferencia</span>
                  <span className="font-mono">-{formatPriceARS(selectedOrder.paymentDiscountCents)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-zinc-400">
                <span>Envío</span>
                <span className="font-mono">
                  {selectedOrder.shippingCents > 0
                    ? formatPriceARS(selectedOrder.shippingCents)
                    : "Gratis"}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-sm font-bold text-zinc-100">
                <span>Total</span>
                <span className="font-mono lining-nums tabular-nums">
                  {formatPriceARS(selectedOrder.totalCents)}
                </span>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 text-center">
                <Link
                  href={`/admin/ordenes/${selectedOrder.id}`}
                  className="text-xs font-semibold text-amber-300 hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Ver comprobante completo e impresión</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
