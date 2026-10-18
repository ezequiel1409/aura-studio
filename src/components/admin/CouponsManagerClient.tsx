"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  FolderPlus,
  HelpCircle,
  Loader2,
  Mail,
  Percent,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Users,
  X,
} from "lucide-react";
import { Coupon, CouponType } from "../../domain/coupon/types";
import { formatPriceARS } from "../../lib/format/currency";

interface CouponsManagerClientProps {
  initialCoupons: Coupon[];
  brandName: string;
}

export function CouponsManagerClient({
  initialCoupons,
  brandName,
}: CouponsManagerClientProps) {
  const [couponsList, setCouponsList] = useState<Coupon[]>(initialCoupons);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: "PERCENTAGE" as CouponType,
    value: 10,
    minOrderPesos: 0,
    maxDiscountPesos: 0,
    usageLimit: 0,
    maxUsesPerEmail: 1, // Por defecto 1 por email
    hasEmailLimit: true,
    expiresAtDate: "",
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleGenerateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let random = "";
    for (let i = 0; i < 5; i++) {
      random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = brandName.split(" ")[0]?.toUpperCase().replace(/[^A-Z]/g, "") || "AURA";
    setFormData((prev) => ({ ...prev, code: `${prefix}-${random}` }));
  };

  const applyPreset = (preset: "WELCOME" | "FIXED_5K" | "FREE_SHIPPING") => {
    if (preset === "WELCOME") {
      setFormData({
        code: "BIENVENIDA10",
        description: "10% de descuento en tu primera compra",
        type: "PERCENTAGE",
        value: 10,
        minOrderPesos: 0,
        maxDiscountPesos: 15000,
        usageLimit: 100,
        maxUsesPerEmail: 1,
        hasEmailLimit: true,
        expiresAtDate: "",
      });
    } else if (preset === "FIXED_5K") {
      setFormData({
        code: "PROMO5000",
        description: "$5.000 de descuento en compras mayores a $40.000",
        type: "FIXED_AMOUNT",
        value: 5000,
        minOrderPesos: 40000,
        maxDiscountPesos: 0,
        usageLimit: 50,
        maxUsesPerEmail: 1,
        hasEmailLimit: true,
        expiresAtDate: "",
      });
    } else if (preset === "FREE_SHIPPING") {
      setFormData({
        code: "ENVIOGRATIS",
        description: "Envío bonificado a partir de $60.000",
        type: "FREE_SHIPPING",
        value: 1,
        minOrderPesos: 60000,
        maxDiscountPesos: 0,
        usageLimit: 0,
        maxUsesPerEmail: 1,
        hasEmailLimit: true,
        expiresAtDate: "",
      });
    }
  };

  const handleToggleStatus = async (couponId: number) => {
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status" }),
      });
      const data = await res.json();
      if (data.ok && data.coupon) {
        setCouponsList((prev) =>
          prev.map((c) => (c.id === couponId ? data.coupon : c))
        );
      }
    } catch {
      // Ignorar fallo transitorio
    }
  };

  const handleDelete = async (couponId: number, code: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente el cupón ${code}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCouponsList((prev) => prev.filter((c) => c.id !== couponId));
      }
    } catch {
      // Ignorar fallo
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        type: formData.type,
        value: formData.type === "FIXED_AMOUNT" ? formData.value * 100 : formData.value,
        minOrderCents: formData.minOrderPesos > 0 ? formData.minOrderPesos * 100 : 0,
        maxDiscountCents: formData.maxDiscountPesos > 0 ? formData.maxDiscountPesos * 100 : null,
        usageLimit: formData.usageLimit > 0 ? formData.usageLimit : null,
        maxUsesPerEmail: formData.hasEmailLimit ? formData.maxUsesPerEmail : null,
        expiresAt: formData.expiresAtDate ? new Date(formData.expiresAtDate).getTime() : null,
      };

      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al crear cupón.");
      }

      setCouponsList((prev) => [data.coupon, ...prev]);
      setIsModalOpen(false);
      setSuccessMessage(`Cupón ${data.coupon.code} creado exitosamente.`);
      setTimeout(() => setSuccessMessage(null), 4000);

      // Reset form
      setFormData({
        code: "",
        description: "",
        type: "PERCENTAGE",
        value: 10,
        minOrderPesos: 0,
        maxDiscountPesos: 0,
        usageLimit: 0,
        maxUsesPerEmail: 1,
        hasEmailLimit: true,
        expiresAtDate: "",
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrado de cupones
  const filteredCoupons = useMemo(() => {
    return couponsList.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === "ACTIVE") return c.isActive;
      if (statusFilter === "PAUSED") return !c.isActive;
      return true;
    });
  }, [couponsList, searchQuery, statusFilter]);

  // Estadísticas rápidas
  const activeCount = couponsList.filter((c) => c.isActive).length;
  const totalRedemptions = couponsList.reduce((acc, c) => acc + c.usedCount, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header con Título y Botón Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-amber-400" aria-hidden="true" />
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">
              Cupones y Descuentos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gestioná promociones, límites por email y cupones de compra para {brandName}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setErrorMessage(null);
          }}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-amber-400 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>+ Nuevo cupón</span>
        </button>
      </div>

      {/* Alerta de éxito */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/60 p-4 text-xs font-semibold text-emerald-300 flex items-center justify-between">
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Cupones Activos</span>
            <Tag className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-zinc-100">{activeCount}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Disponibles para compras</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total de Canjes</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-zinc-100">{totalRedemptions}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Órdenes con descuento</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Control Antifraude</span>
            <Mail className="w-4 h-4 text-blue-400" />
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-200">Tope por Email Activo</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Evita compras repetidas con el mismo cupón</p>
        </div>
      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código o descripción..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-4 py-2 text-base sm:text-xs text-zinc-100 placeholder-zinc-500 focus-visible:outline-2 focus-visible:outline-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-zinc-800 bg-zinc-900/60 self-start sm:self-auto">
          {(["ALL", "ACTIVE", "PAUSED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === tab
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab === "ALL" ? "Todos" : tab === "ACTIVE" ? "Activos" : "Pausados"}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Tabla / Listado de Cupones */}
      {filteredCoupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <Tag className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="mt-3 text-sm font-semibold text-zinc-300">No hay cupones encontrados</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "No hay resultados para tu búsqueda. Probá con otro término."
              : "Todavía no creaste ningún cupón de descuento para tu tienda."}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-300"
            >
              <Plus className="w-4 h-4" />
              <span>Crear mi primer cupón</span>
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-3.5">Código</th>
                  <th className="px-4 py-3.5">Descuento</th>
                  <th className="px-4 py-3.5">Condiciones</th>
                  <th className="px-4 py-3.5">Tope Email</th>
                  <th className="px-4 py-3.5">Usos</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredCoupons.map((coupon) => {
                  const isExpired = coupon.expiresAt && Date.now() > coupon.expiresAt;
                  const isExhausted =
                    coupon.usageLimit !== null &&
                    coupon.usageLimit !== undefined &&
                    coupon.usedCount >= coupon.usageLimit;

                  return (
                    <tr key={coupon.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Código */}
                      <td className="px-4 py-3.5 font-medium text-zinc-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-amber-300 border border-zinc-700/60">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code)}
                            title="Copiar código"
                            className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-[11px] text-zinc-400 mt-1 max-w-xs truncate">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Beneficio / Tipo */}
                      <td className="px-4 py-3.5 font-medium text-zinc-200">
                        {coupon.type === "PERCENTAGE" && (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-300">
                            <Percent className="w-3.5 h-3.5" />
                            {coupon.value}% OFF
                          </span>
                        )}
                        {coupon.type === "FIXED_AMOUNT" && (
                          <span className="font-mono font-bold text-emerald-400">
                            {formatPriceARS(coupon.value)} OFF
                          </span>
                        )}
                        {coupon.type === "FREE_SHIPPING" && (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-400">
                            <Truck className="w-3.5 h-3.5" />
                            Envío Gratis
                          </span>
                        )}
                      </td>

                      {/* Condiciones */}
                      <td className="px-4 py-3.5 text-zinc-400">
                        {coupon.minOrderCents && coupon.minOrderCents > 0 ? (
                          <p>Mín: <span className="font-mono text-zinc-300">{formatPriceARS(coupon.minOrderCents)}</span></p>
                        ) : (
                          <p className="text-zinc-500">Sin mínimo</p>
                        )}
                        {coupon.maxDiscountCents && (
                          <p className="text-[11px] text-zinc-500">
                            Tope: <span className="font-mono">{formatPriceARS(coupon.maxDiscountCents)}</span>
                          </p>
                        )}
                      </td>

                      {/* Tope por email */}
                      <td className="px-4 py-3.5 text-zinc-300 font-medium">
                        {coupon.maxUsesPerEmail ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/80 text-[11px] font-semibold text-blue-300">
                            <Mail className="w-3 h-3" />
                            {coupon.maxUsesPerEmail === 1 ? "1 por email" : `${coupon.maxUsesPerEmail} por email`}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">Ilimitado</span>
                        )}
                      </td>

                      {/* Usos */}
                      <td className="px-4 py-3.5 font-mono text-zinc-300">
                        <span>{coupon.usedCount}</span>
                        {coupon.usageLimit ? (
                          <span className="text-zinc-500"> / {coupon.usageLimit}</span>
                        ) : (
                          <span className="text-zinc-500"> canjes</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3.5">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-400 border border-rose-800/80 text-[11px] font-semibold">
                            Vencido
                          </span>
                        ) : isExhausted ? (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px] font-semibold">
                            Agotado
                          </span>
                        ) : coupon.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(coupon.id)}
                            title="Hacé clic para pausar"
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Activo</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(coupon.id)}
                            title="Hacé clic para activar"
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-700 transition-colors cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            <span>Pausado</span>
                          </button>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                          title="Eliminar cupón"
                          className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modal / Drawer para Crear Nuevo Cupón */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-zinc-100">Crear Nuevo Cupón</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-rose-800/80 bg-rose-950/60 p-3 text-xs text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* Plantillas Rápidas con un clic */}
            <div className="mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Plantillas rápidas recomendadas
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("WELCOME")}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Bienvenida 10% (1 por email)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("FIXED_5K")}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  $5.000 off en +$40.000 (1 por email)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("FREE_SHIPPING")}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Envío gratis en +$60.000
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              {/* Código */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Código del cupón <span className="text-amber-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    placeholder="EJ: BIENVENIDA10"
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/90 px-3.5 py-2.5 text-base sm:text-xs font-mono font-bold uppercase text-zinc-100 placeholder-zinc-500 focus-visible:outline-2 focus-visible:outline-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-[11px] font-semibold text-zinc-300 hover:text-zinc-100 cursor-pointer"
                  >
                    Aleatorio
                  </button>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Descripción o mensaje para el cliente
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej: 10% de descuento en tu primera compra"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/90 px-3.5 py-2 text-base sm:text-xs text-zinc-100 placeholder-zinc-500 focus-visible:outline-2 focus-visible:outline-amber-400"
                />
              </div>

              {/* Tipo de Descuento */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  Tipo de descuento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "PERCENTAGE", label: "Porcentaje (%)", icon: Percent },
                    { id: "FIXED_AMOUNT", label: "Monto Fijo ($)", icon: Tag },
                    { id: "FREE_SHIPPING", label: "Envío Gratis", icon: Truck },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = formData.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            type: t.id as CouponType,
                            value: t.id === "PERCENTAGE" ? 10 : t.id === "FIXED_AMOUNT" ? 3000 : 1,
                          }))
                        }
                        className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-amber-400 bg-amber-400/10 text-amber-300 font-bold"
                            : "border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px]">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Valor del descuento */}
              {formData.type !== "FREE_SHIPPING" && (
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    {formData.type === "PERCENTAGE" ? "Porcentaje de descuento (%)" : "Monto a descontar ($ ARS)"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={formData.type === "PERCENTAGE" ? 100 : 10000000}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, value: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/90 px-3.5 py-2 text-base sm:text-xs font-mono font-bold text-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-400"
                  />
                </div>
              )}

              {/* TOPE POR EMAIL / USUARIO (REQUERIMIENTO PRINCIPAL) */}
              <div className="rounded-xl border border-blue-900/60 bg-blue-950/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="hasEmailLimit" className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="hasEmailLimit"
                      checked={formData.hasEmailLimit}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hasEmailLimit: e.target.checked }))
                      }
                      className="rounded border-zinc-600 text-amber-400 focus:ring-amber-400 w-4 h-4"
                    />
                    <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      Limitar uso por email / usuario
                    </span>
                  </label>
                  <span className="text-[10px] font-semibold text-blue-400 uppercase">Antifraude</span>
                </div>

                {formData.hasEmailLimit && (
                  <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-zinc-300">
                      Cantidad máxima de veces que un mismo email puede canjearlo:
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.maxUsesPerEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxUsesPerEmail: Math.max(1, Number(e.target.value)),
                        }))
                      }
                      className="w-20 rounded-lg border border-blue-800 bg-blue-950/80 px-2 py-1 text-center font-mono font-bold text-zinc-100"
                    />
                  </div>
                )}
                <p className="text-[11px] text-zinc-400">
                  {formData.hasEmailLimit
                    ? `Cada cliente solo podrá canjear este cupón ${formData.maxUsesPerEmail} vez con su correo.`
                    : "Cualquier persona puede usarlo repetidas veces con el mismo correo."}
                </p>
              </div>

              {/* Compra mínima y Tope opcional */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Compra mínima ($ ARS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={formData.minOrderPesos}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minOrderPesos: Number(e.target.value) }))
                    }
                    placeholder="0 = sin mínimo"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/90 px-3 py-2 text-base sm:text-xs font-mono text-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Límite global de usos
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, usageLimit: Number(e.target.value) }))
                    }
                    placeholder="0 = ilimitado"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/90 px-3 py-2 text-base sm:text-xs font-mono text-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-400"
                  />
                </div>
              </div>

              {/* Fecha de Expiración */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Fecha de vencimiento (opcional)
                </label>
                <input
                  type="date"
                  value={formData.expiresAtDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, expiresAtDate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/90 px-3.5 py-2 text-base sm:text-xs text-zinc-100 focus-visible:outline-2 focus-visible:outline-amber-400"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Crear cupón</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
