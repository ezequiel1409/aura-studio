"use client";

import { useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Package,
  HelpCircle,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { OrderClaim } from "../../domain/claim/types";

interface RevocationFormClientProps {
  brandName?: string;
  whatsappNumber?: string | null;
}

export function RevocationFormClient({
  brandName = "Aura Studio",
  whatsappNumber,
}: RevocationFormClientProps) {
  const [orderCode, setOrderCode] = useState("");
  const [customerDni, setCustomerDni] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reason, setReason] = useState("");
  const [conditionAccepted, setConditionAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<OrderClaim | null>(null);

  const cleanPhone = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, "") : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOrderNum = parseInt(orderCode.replace(/[^0-9]/g, ""), 10);
    if (!cleanOrderNum || cleanOrderNum <= 0) {
      setErrorMessage("Por favor ingresá un número de pedido válido (ej: #004 o 4).");
      return;
    }

    if (!customerDni.trim() || customerDni.replace(/[^0-9]/g, "").length < 6) {
      setErrorMessage("Por favor ingresá un número de DNI válido.");
      return;
    }

    if (!contactValue.trim()) {
      setErrorMessage("Por favor ingresá el email o teléfono con el que realizaste la compra.");
      return;
    }

    if (!conditionAccepted) {
      setErrorMessage(
        "Debes aceptar las condiciones obligatorias de recirculación (prenda sin uso, con etiqueta y sin manchas)."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/claims/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: cleanOrderNum,
          customerDni: customerDni.trim(),
          contactValue: contactValue.trim(),
          customerName: customerName.trim() || undefined,
          reason: reason.trim() || undefined,
          conditionAccepted: true,
          type: "REVOCATION",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "No se pudo procesar la solicitud de arrepentimiento.");
        return;
      }

      setClaimSuccess(data.claim);
    } catch {
      setErrorMessage("Ocurrió un error de conexión al enviar el formulario. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (claimSuccess) {
    const waText = encodeURIComponent(
      `Hola! Realicé una solicitud de arrepentimiento de compra con código de trámite ${claimSuccess.claimCode} para el pedido #${String(claimSuccess.orderCode).padStart(3, "0")}.`
    );
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : null;

    return (
      <div className="mx-auto max-w-xl p-6 sm:p-8 rounded-2xl bg-white border border-[#e7e2da] shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 border-b border-[#f0ece1] pb-4">
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-700 font-bold">
              Trámite Registrado
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-stone-900">
              Solicitud de Arrepentimiento Aceptada
            </h2>
          </div>
        </div>

        <div className="rounded-xl bg-[#faf8f5] p-5 border border-[#e7e2da] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">Código de trámite oficial:</span>
            <span className="font-mono text-sm sm:text-base font-bold text-stone-900 bg-white px-3 py-1 rounded-lg border border-[#e7e2da]">
              {claimSuccess.claimCode}
            </span>
          </div>

          <div className="text-xs text-stone-600 space-y-1 pt-1 border-t border-[#e7e2da]">
            <p>
              <strong>Pedido asociado:</strong> #{String(claimSuccess.orderCode).padStart(3, "0")}
            </p>
            <p>
              <strong>Titular:</strong> {claimSuccess.customerName} (DNI {claimSuccess.customerDni})
            </p>
            <p>
              <strong>Fecha:</strong> {new Date().toLocaleDateString("es-AR")}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-stone-600">
          <h3 className="font-semibold text-stone-900 flex items-center gap-2">
            <Package className="h-4 w-4 text-[#926a3c]" />
            <span>Próximos pasos para la devolución:</span>
          </h3>
          <ol className="list-decimal pl-4 space-y-1.5 text-stone-600">
            <li>
              Conservá el código de trámite <strong>{claimSuccess.claimCode}</strong> como constancia legal de tu solicitud conforme a la Resolución 424/2020.
            </li>
            <li>
              Nos comunicaremos dentro de las 24 hs hábiles por WhatsApp o Email para coordinar el retiro o recepción de la prenda en nuestro showroom.
            </li>
            <li>
              Al recibir la prenda, se realiza el control de calidad (etiqueta original, sin uso ni manchas). Una vez aprobada para recirculación, se procesa la devolución del dinero.
            </li>
          </ol>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#155e42] hover:bg-[#0f4631] text-white text-xs font-semibold text-center transition-colors inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Avisar por WhatsApp</span>
            </a>
          )}
          <Link
            href="/"
            className="w-full sm:w-auto py-3 px-5 rounded-xl border border-[#e7e2da] hover:bg-stone-50 text-stone-700 text-xs font-semibold text-center transition-colors"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-6 sm:p-8 rounded-2xl bg-white border border-[#e7e2da] shadow-sm space-y-6">
      <div className="border-b border-[#f0ece1] pb-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#926a3c] font-semibold">
          Defensa del Consumidor · Res. 424/2020
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 mt-1">
          Botón de Arrepentimiento
        </h1>
        <p className="text-xs text-stone-600 mt-2 leading-relaxed">
          Si realizaste una compra en nuestra tienda online, tenés derecho a revocarla dentro de los <strong>10 días corridos</strong> contados a partir de la fecha de compra o entrega del producto (Art. 34 de la Ley 24.240).
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">No se pudo procesar la solicitud</p>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Número de Pedido */}
        <div className="space-y-1">
          <label htmlFor="order-code" className="font-semibold text-stone-800 block">
            Número o código de pedido *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-stone-400 font-bold">
              #
            </span>
            <input
              id="order-code"
              type="text"
              required
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="004"
              className="w-full rounded-xl border border-[#e7e2da] bg-[#faf8f5] pl-8 pr-3.5 py-2.5 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-800 focus:outline-none transition-colors"
            />
          </div>
          <span className="text-[11px] text-stone-400">
            Podés encontrarlo en el mensaje de confirmación de tu pedido (ej. #004).
          </span>
        </div>

        {/* DNI del Titular */}
        <div className="space-y-1">
          <label htmlFor="customer-dni" className="font-semibold text-stone-800 block">
            DNI del titular de la compra *
          </label>
          <input
            id="customer-dni"
            type="text"
            required
            value={customerDni}
            onChange={(e) => setCustomerDni(e.target.value)}
            placeholder="Ej: 38491203"
            className="w-full rounded-xl border border-[#e7e2da] bg-[#faf8f5] px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-800 focus:outline-none transition-colors"
          />
        </div>

        {/* Email o Teléfono registrado */}
        <div className="space-y-1">
          <label htmlFor="contact-val" className="font-semibold text-stone-800 block">
            Email o Teléfono utilizado en la compra *
          </label>
          <input
            id="contact-val"
            type="text"
            required
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            placeholder="ejemplo@email.com o +54 9 11..."
            className="w-full rounded-xl border border-[#e7e2da] bg-[#faf8f5] px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-800 focus:outline-none transition-colors"
          />
          <span className="text-[11px] text-stone-400">
            Debe coincidir con los datos cargados al momento de realizar la compra.
          </span>
        </div>

        {/* Nombre completo */}
        <div className="space-y-1">
          <label htmlFor="customer-name" className="font-semibold text-stone-800 block">
            Nombre y Apellido
          </label>
          <input
            id="customer-name"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nombre completo"
            className="w-full rounded-xl border border-[#e7e2da] bg-[#faf8f5] px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-800 focus:outline-none transition-colors"
          />
        </div>

        {/* Observaciones opcionales */}
        <div className="space-y-1">
          <label htmlFor="claim-reason" className="font-semibold text-stone-800 block">
            Aclaración u observaciones (Opcional)
          </label>
          <textarea
            id="claim-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="¿Querés dejarnos algún comentario sobre la devolución?"
            className="w-full rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-800 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Condiciones de Recirculación Obligatorias */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2.5 mt-2">
          <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span>Condiciones obligatorias para aceptar la devolución:</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-600">
            <li>La prenda debe entregarse con su <strong>etiqueta original</strong> y empaque intacto.</li>
            <li><strong>Sin uso, sin lavar</strong> y libre de olores (perfume, humo, etc.).</li>
            <li><strong>Sin manchas</strong> (maquillaje, desodorante) ni alteraciones de costura.</li>
            <li>Toda prenda pasa por control de calidad al llegar al showroom antes de aprobar el reembolso.</li>
          </ul>

          <div className="pt-2 border-t border-stone-200/80 flex items-start gap-2.5">
            <input
              id="condition-accept"
              type="checkbox"
              required
              checked={conditionAccepted}
              onChange={(e) => setConditionAccepted(e.target.checked)}
              className="w-4 h-4 rounded-md accent-stone-900 cursor-pointer mt-0.5"
            />
            <label htmlFor="condition-accept" className="text-xs text-stone-800 font-medium cursor-pointer leading-tight">
              Declaro que la prenda se encuentra impecable, con etiqueta original, sin uso ni manchas para su revisión.
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !conditionAccepted}
          className="w-full py-3.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span>Procesando solicitud...</span>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              <span>Solicitar Arrepentimiento de Compra</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-stone-400 pt-1">
          Al confirmar, el sistema emitirá tu código de trámite legal conforme al Art. 34 de la Ley 24.240.
        </p>
      </form>
    </div>
  );
}
