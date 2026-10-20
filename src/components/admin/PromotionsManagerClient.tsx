"use client";

import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Copy,
  CreditCard,
  Edit3,
  Eye,
  Landmark,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  Bank,
  Promotion,
  PromotionModality,
  PromotionStatus,
  PromotionType,
} from "../../domain/promotion/types";
import { formatPriceARS } from "../../lib/format/currency";

interface PromotionsManagerClientProps {
  initialPromotions: Promotion[];
  initialBanks: Bank[];
}

const STATUS_BADGES: Record<
  PromotionStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Activa",
    className: "bg-emerald-950/70 text-emerald-300 border-emerald-800",
  },
  SCHEDULED: {
    label: "Programada",
    className: "bg-sky-950/70 text-sky-300 border-sky-800",
  },
  PAUSED: {
    label: "Pausada / Borrador",
    className: "bg-zinc-800 text-zinc-300 border-zinc-700",
  },
  EXPIRED: {
    label: "Vencida (Archivada)",
    className: "bg-rose-950/60 text-rose-300 border-rose-800",
  },
};

export function PromotionsManagerClient({
  initialPromotions,
  initialBanks,
}: PromotionsManagerClientProps) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [banks, setBanks] = useState<Bank[]>(initialBanks);

  // Estado del formulario de promoción
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [promoType, setPromoType] = useState<PromotionType>("BANK");
  const [bankId, setBankId] = useState<number | null>(
    initialBanks[0]?.id ?? null
  );
  const [benefitShort, setBenefitShort] = useState("");
  const [modality, setModality] = useState<PromotionModality>("REIMBURSEMENT");
  const [capPesos, setCapPesos] = useState("");
  const [minPurchasePesos, setMinPurchasePesos] = useState("");
  const [daysText, setDaysText] = useState("Jueves, Viernes");
  const [paymentMethodsText, setPaymentMethodsText] = useState(
    "Tarjetas de crédito Visa y Mastercard"
  );
  const [startsAt, setStartsAt] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [endsAt, setEndsAt] = useState<string>(() =>
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [organizer, setOrganizer] = useState("");
  const [portfolio, setPortfolio] = useState("Cartera de consumo");
  const [cftPercent, setCftPercent] = useState("0,00%");
  const [tnaPercent, setTnaPercent] = useState("0,00%");
  const [exclusions, setExclusions] = useState("");
  const [combinableWith, setCombinableWith] = useState(
    "Acumulable con productos en Sale de la tienda"
  );
  const [officialUrl, setOfficialUrl] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [isDraft, setIsDraft] = useState(false);

  // Vista previa ("card" vs "page")
  const [previewMode, setPreviewMode] = useState<"card" | "page">("card");

  // Alta rápida de nuevo banco
  const [newBankName, setNewBankName] = useState("");
  const [newBankColor, setNewBankColor] = useState("#1e3a8a");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setPromoType("BANK");
    setBankId(banks[0]?.id ?? null);
    setBenefitShort("");
    setModality("REIMBURSEMENT");
    setCapPesos("");
    setMinPurchasePesos("");
    setDaysText("Jueves, Viernes");
    setPaymentMethodsText("Tarjetas de crédito Visa y Mastercard");
    setStartsAt(new Date().toISOString().slice(0, 10));
    setEndsAt(
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );
    setOrganizer("");
    setPortfolio("Cartera de consumo");
    setCftPercent("0,00%");
    setTnaPercent("0,00%");
    setExclusions("");
    setCombinableWith("Acumulable con productos en Sale de la tienda");
    setOfficialUrl("");
    setTermsAndConditions("");
    setIsDraft(false);
  };

  const formatDateInput = (val: number | string) => {
    if (typeof val === "number") {
      return new Date(val).toISOString().slice(0, 10);
    }
    return String(val).slice(0, 10);
  };

  const startEdit = (promo: Promotion) => {
    setEditingId(promo.id);
    setTitle(promo.title);
    setPromoType(promo.promoType);
    setBankId(promo.bankId);
    setBenefitShort(promo.benefitShort);
    setModality(promo.modality);
    setCapPesos(promo.capCents !== null ? String(promo.capCents / 100) : "");
    setMinPurchasePesos(
      promo.minPurchaseCents !== null ? String(promo.minPurchaseCents / 100) : ""
    );
    setDaysText(promo.daysOfWeek.join(", "));
    setPaymentMethodsText(promo.paymentMethods.join(", "));
    setStartsAt(formatDateInput(promo.startsAt));
    setEndsAt(formatDateInput(promo.endsAt));
    setOrganizer(promo.organizer || "");
    setPortfolio(promo.portfolio || "Cartera de consumo");
    setCftPercent(promo.cftPercent || "0,00%");
    setTnaPercent(promo.tnaPercent || "0,00%");
    setExclusions(promo.exclusions || "");
    setCombinableWith(promo.combinableWith || "");
    setOfficialUrl(promo.officialUrl || "");
    setTermsAndConditions(promo.termsAndConditions);
    setIsDraft(promo.status === "PAUSED");
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!startsAt || !endsAt) {
      setFeedback({
        type: "error",
        text: "No se puede publicar una promoción sin fechas de vigencia.",
      });
      return;
    }

    if (!termsAndConditions.trim() || termsAndConditions.trim().length < 15) {
      setFeedback({
        type: "error",
        text: "Los Términos y Condiciones legales son obligatorios para publicar la promoción.",
      });
      return;
    }

    setSaving(true);
    try {
      const capCents = capPesos.trim()
        ? Math.round(Number(capPesos) * 100)
        : null;
      const minPurchaseCents = minPurchasePesos.trim()
        ? Math.round(Number(minPurchasePesos) * 100)
        : null;

      const payload = {
        id: editingId ?? undefined,
        title: title.trim(),
        promoType,
        bankId: promoType === "BANK" ? bankId : null,
        benefitShort: benefitShort.trim(),
        modality,
        capCents,
        minPurchaseCents,
        daysOfWeek: daysText
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        paymentMethods: paymentMethodsText
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean),
        startsAt: `${startsAt}T00:00:00.000Z`,
        endsAt: `${endsAt}T23:59:59.000Z`,
        organizer: organizer.trim() || null,
        portfolio: portfolio.trim() || null,
        cftPercent: cftPercent.trim() || null,
        tnaPercent: tnaPercent.trim() || null,
        exclusions: exclusions.trim() || null,
        combinableWith: combinableWith.trim() || null,
        officialUrl: officialUrl.trim() || null,
        termsAndConditions: termsAndConditions.trim(),
        status: isDraft ? "DRAFT" : undefined,
      };

      const res = await fetch("/api/admin/promotions", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar la promoción");
      }

      const reloadRes = await fetch("/api/admin/promotions");
      const reloadData = await reloadRes.json();
      if (reloadData.ok) {
        setPromotions(reloadData.promotions);
      }

      resetForm();
      setFeedback({
        type: "ok",
        text: editingId
          ? "Promoción actualizada con éxito."
          : "Promoción creada con éxito.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error al guardar promoción",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (id: number) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "duplicate", id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo duplicar la promoción");
      }
      setPromotions((prev) => [data.promotion, ...prev]);
      startEdit(data.promotion);
      setFeedback({
        type: "ok",
        text: "Promoción duplicada como borrador con vigencia renovada por 30 días.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error al duplicar",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/admin/promotions?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) resetForm();
      setFeedback({ type: "ok", text: "Promoción eliminada." });
    }
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "bank",
          name: newBankName.trim(),
          accentColor: newBankColor,
        }),
      });
      const data = await res.json();
      if (res.ok && data.bank) {
        setBanks((prev) => [...prev, data.bank]);
        setBankId(data.bank.id);
        setNewBankName("");
        setFeedback({
          type: "ok",
          text: `Banco "${data.bank.name}" agregado al catálogo.`,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedBankObj = banks.find((b) => b.id === bankId);

  return (
    <div className="space-y-8 pb-20">
      {/* Encabezado */}
      <div className="border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Landmark size={15} aria-hidden="true" />
          <span>Promociones Bancarias y Legales</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-100 mt-1">
          Gestión de Promociones Bancarias
        </h1>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
          Administrá las promociones informativas de bancos y billeteras con sus fechas de vigencia, topes y términos y condiciones obligatorios. Las promociones vencidas se archivan solas y podés duplicarlas mes a mes.
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === "ok"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : "bg-rose-950/40 border-rose-800 text-rose-300"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Listado de Promociones Cargadas */}
      <section className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Promociones registradas ({promotions.length})
          </h2>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:underline"
          >
            <Plus size={14} />
            <span>+ Nueva promoción</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {promotions.map((promo) => {
            const st = STATUS_BADGES[promo.status] || STATUS_BADGES.ACTIVE;
            return (
              <div
                key={promo.id}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-300">
                      {promo.bank?.name || "Beneficio Propio"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${st.className}`}
                    >
                      {st.label}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-zinc-100">
                    {promo.benefitShort}
                  </h3>
                  <p className="text-xs text-zinc-400">{promo.title}</p>
                  <p className="text-[11px] text-zinc-500">
                    Vigencia: {formatDateInput(promo.startsAt)} al{" "}
                    {formatDateInput(promo.endsAt)} · {promo.daysOfWeek.join(", ")}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(promo.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                    title="Duplicar para renovar el próximo mes"
                  >
                    <Copy size={12} />
                    <span>Duplicar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(promo)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-amber-300 font-semibold"
                  >
                    <Edit3 size={12} />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(promo.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-300 hover:bg-rose-950/50"
                    aria-label={`Eliminar promoción ${promo.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Editor Estructurado + Vista Previa en Vivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSavePromotion}
          className="lg:col-span-7 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              {editingId ? "Editar Promoción" : "Crear Nueva Promoción"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="promo-type" className="block text-xs font-bold text-zinc-200">
                Tipo de promoción
              </label>
              <select
                id="promo-type"
                value={promoType}
                onChange={(e) => setPromoType(e.target.value as PromotionType)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              >
                <option value="BANK">Bancaria o Billetera (Informativa)</option>
                <option value="STORE">Propia del Comercio</option>
              </select>
            </div>

            {promoType === "BANK" && (
              <div className="space-y-1">
                <label htmlFor="promo-bank" className="block text-xs font-bold text-zinc-200">
                  Banco o Billetera
                </label>
                <select
                  id="promo-bank"
                  value={bankId ?? ""}
                  onChange={(e) =>
                    setBankId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="promo-benefit" className="block text-xs font-bold text-zinc-200">
                Beneficio corto (Titular de tarjeta) *
              </label>
              <input
                id="promo-benefit"
                type="text"
                required
                value={benefitShort}
                onChange={(e) => setBenefitShort(e.target.value)}
                placeholder="Ej: 25% de ahorro + 3 cuotas sin interés"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="promo-title" className="block text-xs font-bold text-zinc-200">
                Nombre descriptivo *
              </label>
              <input
                id="promo-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Especial Jueves y Viernes con Banco Galicia"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="promo-modality" className="block text-xs text-zinc-300">
                Modalidad
              </label>
              <select
                id="promo-modality"
                value={modality}
                onChange={(e) =>
                  setModality(e.target.value as PromotionModality)
                }
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              >
                <option value="REIMBURSEMENT">Reintegro del banco</option>
                <option value="INSTANT">Descuento en el acto</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="promo-cap" className="block text-xs text-zinc-300">
                Tope de reintegro (ARS)
              </label>
              <input
                id="promo-cap"
                type="number"
                min={0}
                value={capPesos}
                onChange={(e) => setCapPesos(e.target.value)}
                placeholder="Vacío = Sin tope"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="promo-min" className="block text-xs text-zinc-300">
                Compra mínima (ARS)
              </label>
              <input
                id="promo-min"
                type="number"
                min={0}
                value={minPurchasePesos}
                onChange={(e) => setMinPurchasePesos(e.target.value)}
                placeholder="Vacío = Sin mínimo"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="promo-days" className="block text-xs text-zinc-300">
                Días que aplica (separados por coma)
              </label>
              <input
                id="promo-days"
                type="text"
                value={daysText}
                onChange={(e) => setDaysText(e.target.value)}
                placeholder="Ej: Jueves, Viernes o Todos los días"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="promo-methods" className="block text-xs text-zinc-300">
                Medios y tarjetas incluidas
              </label>
              <input
                id="promo-methods"
                type="text"
                value={paymentMethodsText}
                onChange={(e) => setPaymentMethodsText(e.target.value)}
                placeholder="Ej: Visa, Mastercard, MODO"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="promo-start" className="block text-xs font-bold text-zinc-200">
                Vigencia desde *
              </label>
              <input
                id="promo-start"
                type="date"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="promo-end" className="block text-xs font-bold text-zinc-200">
                Vigencia hasta *
              </label>
              <input
                id="promo-end"
                type="date"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-800">
            <div className="space-y-1 col-span-2">
              <label htmlFor="promo-org" className="block text-[11px] text-zinc-400">
                Entidad organizadora
              </label>
              <input
                id="promo-org"
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Ej: Banco de Galicia y Buenos Aires S.A.U."
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="promo-cft" className="block text-[11px] text-zinc-400">
                CFT
              </label>
              <input
                id="promo-cft"
                type="text"
                value={cftPercent}
                onChange={(e) => setCftPercent(e.target.value)}
                placeholder="0,00%"
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="promo-tna" className="block text-[11px] text-zinc-400">
                TNA
              </label>
              <input
                id="promo-tna"
                type="text"
                value={tnaPercent}
                onChange={(e) => setTnaPercent(e.target.value)}
                placeholder="0,00%"
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="promo-url" className="block text-xs text-zinc-300">
              Enlace oficial a bases del banco (opcional)
            </label>
            <input
              id="promo-url"
              type="url"
              value={officialUrl}
              onChange={(e) => setOfficialUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="promo-terms" className="block text-xs font-bold text-zinc-200">
              Términos y condiciones completos (Texto visible obligatorio) *
            </label>
            <textarea
              id="promo-terms"
              rows={4}
              required
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              placeholder="Escribí o pegá el texto legal completo: cartera, CFT, TNA, topes, plazos de acreditación y exclusiones..."
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-400"
              />
              <span>Guardar como borrador (no publicar aún)</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 font-bold text-xs transition-all cursor-pointer"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              <span>
                {editingId ? "Guardar promoción" : "Publicar promoción"}
              </span>
            </button>
          </div>
        </form>

        {/* Columna Derecha: Vista Previa en Vivo + Catálogo de Bancos */}
        <div className="lg:col-span-5 space-y-5">
          {/* Vista Previa de Tarjeta y Página */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Vista previa en vivo
                </h3>
              </div>

              <div className="flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewMode("card")}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    previewMode === "card"
                      ? "bg-zinc-800 text-amber-300"
                      : "text-zinc-400"
                  }`}
                >
                  Tarjeta Home
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("page")}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    previewMode === "page"
                      ? "bg-zinc-800 text-amber-300"
                      : "text-zinc-400"
                  }`}
                >
                  Página Legal
                </button>
              </div>
            </div>

            {previewMode === "card" ? (
              <div className="rounded-2xl bg-[#faf8f5] text-stone-900 p-4 border border-[#e7e2da] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase text-white"
                    style={{
                      backgroundColor:
                        selectedBankObj?.accentColor || "#292524",
                    }}
                  >
                    <CreditCard className="h-3 w-3" />
                    <span>{selectedBankObj?.name || "Banco"}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-stone-600">
                    {daysText || "Días"}
                  </span>
                </div>
                <p className="font-serif text-lg font-medium text-stone-900">
                  {benefitShort || "25% de ahorro + 3 cuotas sin interés"}
                </p>
                <p className="text-xs text-stone-600">
                  {title || "Nombre de la promoción"}
                  {capPesos &&
                    ` · Tope: ${formatPriceARS(Math.round(Number(capPesos) * 100))}`}
                </p>
                <div className="pt-2 border-t border-[#e7e2da] flex justify-between text-[11px] text-stone-500">
                  <span>Hasta {endsAt || "---"}</span>
                  <span className="font-bold text-stone-900">
                    Ver condiciones &gt;
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#faf8f5] text-stone-900 p-4 border border-[#e7e2da] space-y-2 text-xs">
                <p className="font-serif text-base font-bold">
                  {benefitShort || "Beneficio principal"}
                </p>
                <p className="text-[11px] text-stone-600">
                  CFT: {cftPercent || "0,00%"} · TNA: {tnaPercent || "0,00%"}
                </p>
                <p className="text-[11px] text-stone-700 whitespace-pre-line border-t border-[#e7e2da] pt-2">
                  {termsAndConditions ||
                    "Aquí se mostrará el texto legal visible de términos y condiciones."}
                </p>
              </div>
            )}
          </div>

          {/* Catálogo de Bancos */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Catálogo de Bancos y Billeteras ({banks.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {banks.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: b.accentColor || "#292524" }}
                >
                  {b.name}
                </span>
              ))}
            </div>

            <form
              onSubmit={handleCreateBank}
              className="flex items-center gap-2 pt-2 border-t border-zinc-800"
            >
              <input
                type="text"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder="Agregar otro banco (ej: ICBC)"
                aria-label="Nombre del nuevo banco"
                className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
              <input
                type="color"
                value={newBankColor}
                onChange={(e) => setNewBankColor(e.target.value)}
                aria-label="Color identificatorio del banco"
                className="h-8 w-8 rounded cursor-pointer bg-transparent"
              />
              <button
                type="submit"
                disabled={saving || !newBankName.trim()}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-bold disabled:opacity-50"
              >
                + Banco
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
