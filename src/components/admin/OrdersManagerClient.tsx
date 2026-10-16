"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
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
  XCircle,
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
    label: "Confirmada",
    bg: "bg-sky-950/60",
    text: "text-sky-300",
    border: "border-sky-800/80",
    icon: CheckCircle2,
  },
  PAID: {
    label: "Pagada",
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/80",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelada",
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
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(new Set());
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    const previousOrders = [...orders];
    setUpdatingId(orderId);

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
      alert(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setUpdatingId(null);
    }
  };

  // Conteo de pedidos por estado
  const counts = useMemo(() => {
    const map = {
      ALL: orders.length,
      PENDING: 0,
      CONFIRMED: 0,
      PAID: 0,
      CANCELLED: 0,
    };
    for (const o of orders) {
      if (map[o.status] !== undefined) {
        map[o.status] += 1;
      }
    }
    return map;
  }, [orders]);

  // Filtrado reactivo
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab !== "ALL" && o.status !== activeTab) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const codeNum = String(o.code);
        const codeStr = formatOrderCode(o.code).toLowerCase();
        const nameMatch = o.customerName.toLowerCase().includes(query);
        const phoneMatch = o.customerPhone.includes(query);
        const codeMatch = codeNum.includes(query) || codeStr.includes(query);
        return nameMatch || phoneMatch || codeMatch;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast de confirmación de acción en backoffice */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 rounded-xl border border-emerald-800 bg-emerald-950/95 px-4 py-2.5 text-xs font-semibold text-emerald-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2"
        >
          {toastMessage}
        </div>
      )}

      {/* Encabezado y resumen métrico */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 font-serif">
              Gestión de Pedidos & Órdenes
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Control de órdenes de compra recibidas vía WhatsApp y logística de {brandName}.
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

      {/* Pestañas de filtrado por estado con contadores */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "ALL", label: "Todas", count: counts.ALL },
          { id: "PENDING", label: "Pendientes", count: counts.PENDING },
          { id: "CONFIRMED", label: "Confirmadas", count: counts.CONFIRMED },
          { id: "PAID", label: "Pagadas", count: counts.PAID },
          { id: "CANCELLED", label: "Canceladas", count: counts.CANCELLED },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-400 text-zinc-950 shadow-sm"
                  : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  isActive ? "bg-zinc-950 text-amber-400" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Buscador de pedidos */}
      <div className="relative">
        <label htmlFor="search-orders" className="sr-only">
          Buscar por código de orden o nombre de cliente
        </label>
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
          aria-hidden="true"
        />
        <input
          id="search-orders"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por #ORD-001, nombre de cliente o teléfono..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
        />
      </div>

      {/* Lista de Órdenes */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center">
          <Package className="mx-auto h-8 w-8 text-zinc-600" />
          <h2 className="mt-3 text-sm font-bold text-zinc-200">
            No se encontraron pedidos
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {searchQuery
              ? "No hay resultados para tu criterio de búsqueda."
              : "No hay órdenes registradas en este estado."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const formattedCode = formatOrderCode(order.code);
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const isExpanded = expandedOrderIds.has(order.id);
            const dateStr = new Date(order.createdAt * 1000).toLocaleString("es-AR", {
              dateStyle: "medium",
              timeStyle: "short",
            });
            const cleanPhone = order.customerPhone.replace(/\D/g, "");

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-sm overflow-hidden transition-all hover:border-zinc-700"
              >
                {/* Cabecera de la Tarjeta de Pedido */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 bg-zinc-900/90">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/admin/ordenes/${order.id}`}
                      className="font-mono text-sm font-bold text-amber-300 hover:text-amber-100 hover:underline transition-colors flex items-center gap-1"
                      title={`Ingresar a la ficha del pedido ${formattedCode}`}
                    >
                      <span>{formattedCode}</span>
                    </Link>
                    <span className="text-zinc-600">•</span>
                    <span className="text-xs text-zinc-400 font-sans">{dateStr}</span>
                    <span className="text-zinc-600">•</span>

                    {/* Badge de Estado */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      <statusCfg.icon className="h-3 w-3" />
                      <span>{statusCfg.label}</span>
                    </span>

                    {/* Badge Logístico */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                      {order.deliveryMethod === "HOME_DELIVERY" ? (
                        <>
                          <Truck className="h-2.5 w-2.5 text-zinc-400" />
                          <span>Envío a domicilio</span>
                        </>
                      ) : order.deliveryMethod === "MOTORCYCLE" ? (
                        <>
                          <Bike className="h-2.5 w-2.5 text-zinc-400" />
                          <span>Motomensajería</span>
                        </>
                      ) : (
                        <>
                          <Store className="h-2.5 w-2.5 text-zinc-400" />
                          <span>Retiro Showroom</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Total y botón desplegable */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                    <div className="text-right">
                      <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                        Total
                      </span>
                      <span className="font-mono text-sm sm:text-base font-bold text-zinc-100">
                        {formatPriceARS(order.totalCents, order.currency)}
                      </span>
                    </div>

                    <Link
                      href={`/admin/ordenes/${order.id}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-amber-400 hover:bg-amber-300 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-colors shadow-xs"
                      title={`Ingresar a la ficha del pedido ${formattedCode}`}
                    >
                      <span>Abrir</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleExpand(order.id)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Ocultar" : "Ver"} detalle rápido de ${formattedCode}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-zinc-800 hover:bg-zinc-750 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? "Ocultar" : "Detalles"}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Cuerpo Resumen: Datos del Comprador y Enlace WhatsApp */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Comprador:
                    </span>
                    <p className="mt-1 font-semibold text-zinc-200">{order.customerName}</p>
                    {order.customerEmail && (
                      <p className="text-zinc-400 truncate">{order.customerEmail}</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Contacto WhatsApp:
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-zinc-300">{order.customerPhone}</span>
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-900 transition-colors"
                          title="Abrir chat de WhatsApp con el comprador"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>Chat</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Entrega / Destino:
                    </span>
                    <p className="mt-1 text-zinc-300">
                      {order.deliveryAddress || "A coordinar / Retiro en Showroom"}
                    </p>
                    {order.deliveryNotes && (
                      <p className="text-[11px] text-zinc-400 italic mt-0.5">
                        Nota: {order.deliveryNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Detalle Desplegable: Artículos y Cambio de Estado */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/60 bg-zinc-950/40 p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Prendas en este pedido ({(order.items || []).length}):
                    </span>

                    <div className="divide-y divide-zinc-800/60 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                      {(order.items || []).map((item) => (
                        <div
                          key={item.id}
                          className="p-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-8 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {item.photoUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={item.photoUrl}
                                  alt={item.productTitle}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-zinc-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-200 truncate">
                                #{String(item.productCode).padStart(3, "0")} · {item.productTitle}
                              </p>
                              <p className="text-[11px] text-zinc-400">
                                {item.colorName !== "Único" ? `${item.colorName} · ` : ""}
                                Talle {item.size} · Cantidad:{" "}
                                <strong className="text-zinc-200">{item.quantity}u</strong>
                              </p>
                            </div>
                          </div>

                          <span className="font-mono font-bold text-zinc-200 shrink-0">
                            {formatPriceARS(item.subtotalCents, order.currency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Desglose de Totales */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs border-t border-zinc-800/40">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-400 text-[11px] font-mono">
                        <span>
                          Subtotal:{" "}
                          <strong className="text-zinc-200">
                            {formatPriceARS(order.subtotalCents, order.currency)}
                          </strong>
                        </span>
                        {order.discountCents > 0 && (
                          <span className="text-emerald-400">
                            Descuento: -{formatPriceARS(order.discountCents, order.currency)}
                            {order.couponCode ? ` (${order.couponCode})` : ""}
                          </span>
                        )}
                        <span>
                          Envío:{" "}
                          <strong className="text-zinc-200">
                            {order.shippingCents > 0
                              ? formatPriceARS(order.shippingCents, order.currency)
                              : "Bonificado / A convenir"}
                          </strong>
                        </span>
                      </div>

                      {/* Selector Rápido de Estado para la Administradora */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-zinc-400 font-medium">
                          Cambiar estado:
                        </span>
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          aria-label={`Cambiar estado de ${formattedCode}`}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-100 focus:border-amber-400 focus:outline-none cursor-pointer"
                        >
                          <option value="PENDING">Pendiente</option>
                          <option value="CONFIRMED">Confirmada</option>
                          <option value="PAID">Pagada</option>
                          <option value="CANCELLED">Cancelada (restaura stock)</option>
                        </select>
                        {updatingId === order.id && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/30 text-xs">
                      <Link
                        href={`/admin/ordenes/${order.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
                      >
                        <span>Ver ficha técnica completa e impresión</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
