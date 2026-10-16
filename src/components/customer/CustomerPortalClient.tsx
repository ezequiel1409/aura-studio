"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  MapPin,
  User,
  LogOut,
  ShoppingBag,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { SafeCustomer, CustomerAddress } from "../../domain/customer/types";
import { Order, OrderStatus } from "../../domain/order/types";
import { formatOrderCode } from "../../domain/order/rules";
import { formatPrice } from "../../lib/format/currency";

interface CustomerPortalClientProps {
  customer: SafeCustomer;
  initialOrders: Order[];
  initialAddresses: CustomerAddress[];
  whatsappNumber?: string;
  brandName?: string;
}

export function CustomerPortalClient({
  customer,
  initialOrders,
  initialAddresses,
  whatsappNumber = "+5491100000000",
  brandName = "Aura Studio",
}: CustomerPortalClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "profile">("orders");
  const [orders] = useState<Order[]>(initialOrders);
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);

  // Estados de modal y acciones de dirección
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Formulario nueva dirección
  const [label, setLabel] = useState("Casa");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [recipientName, setRecipientName] = useState(customer.name || "");
  const [recipientPhone, setRecipientPhone] = useState(customer.phone || "");
  const [notes, setNotes] = useState("");
  const [isDefault, setIsDefault] = useState(addresses.length === 0);

  // Logout
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);
    setAddressLoading(true);

    try {
      const res = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          address: addressLine,
          city: city || null,
          postalCode: postalCode || null,
          recipientName: recipientName || null,
          recipientPhone: recipientPhone || null,
          notes: notes || null,
          isDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar la dirección.");
      }

      // Refrescar lista
      if (isDefault) {
        setAddresses((prev) => [
          ...prev.map((a) => ({ ...a, isDefault: false })),
          data.address,
        ]);
      } else {
        setAddresses((prev) => [...prev, data.address]);
      }

      setIsAddingAddress(false);
      setAddressLine("");
      setCity("");
      setPostalCode("");
      setNotes("");
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Error al guardar dirección.");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("¿Deseas eliminar esta dirección guardada?")) return;

    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Pendiente de pago",
          classes: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "CONFIRMED":
        return {
          label: "Confirmado",
          classes: "bg-sky-50 text-sky-800 border-sky-200",
        };
      case "PAID":
        return {
          label: "Abonado",
          classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "CANCELLED":
        return {
          label: "Cancelado",
          classes: "bg-stone-100 text-stone-600 border-stone-200",
        };
      default:
        return {
          label: status,
          classes: "bg-stone-50 text-stone-700 border-stone-200",
        };
    }
  };

  const getDeliveryLabel = (method: string) => {
    switch (method) {
      case "HOME_DELIVERY":
        return "Envío a domicilio";
      case "MOTORCYCLE":
        return "Motomensajería privada";
      case "PICKUP":
        return "Retiro en Showroom";
      default:
        return method;
    }
  };

  const cleanWhatsapp = whatsappNumber.replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Tarjeta de Saludo y Perfil */}
      <div className="rounded-3xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.25em] font-semibold uppercase text-stone-500">
            Mi Espacio Personal
          </span>
          <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-light text-stone-900">
            Hola, {customer.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600">
            {customer.email} {customer.phone ? `• ${customer.phone}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors focus-visible:outline-2 focus-visible:outline-stone-900"
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-[#e7e2da] mb-8 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "orders"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Mis Pedidos</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("addresses")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "addresses"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Mis Direcciones</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700">
            {addresses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "profile"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Mis Datos</span>
        </button>
      </div>

      {/* Pestaña: Mis Pedidos */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d8d2c7] bg-white/60 p-12 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-stone-300" />
              <h2 className="mt-4 font-serif text-xl font-light text-stone-900">
                Aún no realizaste ningún pedido
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-xs sm:text-sm text-stone-500">
                Tus pedidos aparecerán aquí para que puedas seguir su estado y contactarnos fácilmente.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800 transition-colors"
              >
                Explorar Colección
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const status = getStatusBadge(order.status);
              const formattedDate = new Date(order.createdAt * 1000).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const waUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                `Hola ${brandName}, quería consultar sobre mi pedido ${formatOrderCode(order.code)}.`
              )}`;

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-[#e7e2da] bg-white p-5 sm:p-7 shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0eae1] pb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm sm:text-base font-bold text-stone-900">
                        {formatOrderCode(order.code)}
                      </span>
                      <span className="text-xs text-stone-500">• {formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${status.classes}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Ítems del Pedido */}
                  <div className="divide-y divide-stone-100 my-4">
                    {order.items?.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {item.photoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.photoUrl}
                              alt={item.productTitle}
                              className="h-12 w-12 rounded-lg object-cover border border-[#e7e2da]"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400">
                              <ShoppingBag className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-stone-900">
                              {item.productTitle}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              {item.colorName} • Talle {item.size} • Cant: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-stone-900">
                          {formatPrice(item.unitPriceCents * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pie de Pedido y Contacto */}
                  <div className="pt-4 border-t border-[#f0eae1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-stone-600">
                      <p>
                        <span className="font-semibold text-stone-800">Método de entrega:</span>{" "}
                        {getDeliveryLabel(order.deliveryMethod)}
                      </p>
                      {order.deliveryAddress && (
                        <p className="mt-0.5 truncate max-w-md">
                          <span className="font-semibold text-stone-800">Destino:</span>{" "}
                          {order.deliveryAddress}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-stone-500 block">
                          Total abonado
                        </span>
                        <span className="font-serif text-lg sm:text-xl font-medium text-stone-900">
                          {formatPrice(order.totalCents)}
                        </span>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
                      >
                        <span>Consultar</span>
                        <ExternalLink className="h-3.5 w-3.5 text-stone-500" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pestaña: Mis Direcciones */}
      {activeTab === "addresses" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-stone-600">
              Guardá tus direcciones de entrega para agilizar tus compras en el checkout.
            </p>
            <button
              type="button"
              onClick={() => setIsAddingAddress(!isAddingAddress)}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Dirección</span>
            </button>
          </div>

          {/* Formulario desplegable para agregar dirección */}
          {isAddingAddress && (
            <div className="rounded-3xl border border-[#d8d2c7] bg-white p-6 shadow-xs animate-in fade-in-50">
              <div className="flex items-center justify-between border-b border-[#f0eae1] pb-3 mb-4">
                <h3 className="font-serif text-lg font-medium text-stone-900">
                  Agregar Nueva Dirección
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="rounded-full p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {addressError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{addressError}</span>
                </div>
              )}

              <form onSubmit={handleCreateAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Etiqueta / Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Ej: Casa, Trabajo, Showroom"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Calle, Número y Piso / Depto
                    </label>
                    <input
                      type="text"
                      required
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="Ej: Av. Santa Fe 1234, 4° B"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Ciudad / Localidad
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Palermo, CABA"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Ej: C1425"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Nombre del Destinatario
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Nombre de quien recibe"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="Teléfono para el repartidor"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Indicaciones de Entrega (opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Timbre no funciona, dejar en recepción..."
                    className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="is-default-checkbox"
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <label
                    htmlFor="is-default-checkbox"
                    className="text-xs text-stone-700 cursor-pointer font-medium"
                  >
                    Establecer como dirección predeterminada
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#f0eae1]">
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addressLoading}
                    className="rounded-xl bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    {addressLoading ? "Guardando..." : "Guardar Dirección"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Grilla de Direcciones */}
          {addresses.length === 0 && !isAddingAddress ? (
            <div className="rounded-3xl border border-dashed border-[#d8d2c7] bg-white/60 p-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-stone-300" />
              <h2 className="mt-4 font-serif text-xl font-light text-stone-900">
                No tenés direcciones registradas
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-xs sm:text-sm text-stone-500">
                Agregá tu dirección para no tener que escribirla cada vez que realizás un pedido.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingAddress(true)}
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Dirección</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`rounded-2xl border p-5 bg-white transition-all ${
                    addr.isDefault
                      ? "border-stone-900 ring-1 ring-stone-900 shadow-xs"
                      : "border-[#e7e2da] hover:border-stone-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs sm:text-sm text-stone-900">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Predeterminada</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-stone-800 font-medium">
                    {addr.address}
                  </p>
                  {(addr.city || addr.postalCode) && (
                    <p className="text-xs text-stone-500">
                      {[addr.city, addr.postalCode].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {addr.recipientName && (
                    <p className="text-xs text-stone-600 mt-2">
                      Recibe: <span className="font-medium text-stone-800">{addr.recipientName}</span>{" "}
                      {addr.recipientPhone ? `(${addr.recipientPhone})` : ""}
                    </p>
                  )}
                  {addr.notes && (
                    <p className="text-[11px] text-stone-500 italic mt-1">
                      &quot;{addr.notes}&quot;
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-[#f0eae1] flex items-center justify-between text-xs">
                    {!addr.isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-stone-600 hover:text-stone-900 underline underline-offset-2"
                      >
                        Establecer como principal
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 p-1"
                      title="Eliminar dirección"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pestaña: Mis Datos */}
      {activeTab === "profile" && (
        <div className="rounded-3xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-xs max-w-xl">
          <h2 className="font-serif text-xl font-medium text-stone-900 mb-6">
            Información de la Cuenta
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <User className="h-4 w-4 text-stone-500 mt-1" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-medium">
                  Nombre Completo
                </span>
                <span className="text-sm font-medium text-stone-900">
                  {customer.name}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <Mail className="h-4 w-4 text-stone-500 mt-1" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-medium">
                  Correo Electrónico
                </span>
                <span className="text-sm font-medium text-stone-900">
                  {customer.email}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <Phone className="h-4 w-4 text-stone-500 mt-1" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-medium">
                  Teléfono / WhatsApp
                </span>
                <span className="text-sm font-medium text-stone-900">
                  {customer.phone || "No especificado"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <Calendar className="h-4 w-4 text-stone-500 mt-1" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-medium">
                  Miembro desde
                </span>
                <span className="text-sm font-medium text-stone-900">
                  {new Date(customer.createdAt).toLocaleDateString("es-AR", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

