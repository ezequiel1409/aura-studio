"use client";

import { Check, RotateCcw, XCircle } from "lucide-react";
import { OrderClaim } from "../../../domain/claim/types";

export interface OrderClaimCardProps {
  claim: OrderClaim;
  isInspectingClaim: boolean;
  onApproveRestock: (claimId: string) => void;
  onRejectCondition: (claim: OrderClaim) => void;
}

/**
 * Tarjeta de inspección y control de calidad para reclamos postventa de una orden.
 */
export function OrderClaimCard({
  claim,
  isInspectingClaim,
  onApproveRestock,
  onRejectCondition,
}: OrderClaimCardProps) {
  return (
    <section className="rounded-2xl border border-rose-800/70 bg-rose-950/30 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-rose-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-300">
            Solicitud de Arrepentimiento / Postventa
          </h2>
        </div>
        <span className="font-mono text-xs font-bold text-rose-200 bg-rose-950 border border-rose-800 px-2.5 py-0.5 rounded-lg">
          {claim.claimCode}
        </span>
      </div>

      <div className="text-xs text-zinc-300 space-y-1.5">
        <p>
          <strong className="text-zinc-400">Tipo de solicitud:</strong>{" "}
          {claim.type === "EXCHANGE"
            ? "Cambio de talle / prenda"
            : "Arrepentimiento de compra (Ley 24.240)"}
        </p>
        {claim.reason && (
          <p className="italic text-zinc-200 bg-zinc-950/70 p-3 rounded-xl border border-rose-900/40">
            &ldquo;{claim.reason}&rdquo;
          </p>
        )}
      </div>

      {claim.status === "PENDING" ? (
        <div className="pt-3 border-t border-rose-900/50 space-y-2.5">
          <p className="text-[11px] font-semibold text-rose-200">
            Control de Calidad al recibir la prenda:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isInspectingClaim}
              onClick={() => onApproveRestock(claim.id)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs px-3 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>Aprobar y Recircular (+1 stock)</span>
            </button>
            <button
              type="button"
              disabled={isInspectingClaim}
              onClick={() => onRejectCondition(claim)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 border border-rose-700 text-rose-100 font-semibold text-xs px-3 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              <span>Rechazar por Manchas / Uso</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-rose-900/50 text-xs">
          {claim.status === "APPROVED_RESTOCKED" ? (
            <span className="text-emerald-400 font-semibold">
              ✓ Control de calidad aprobado · Stock recirculado a la tienda
            </span>
          ) : (
            <div className="text-rose-300 space-y-0.5">
              <p className="font-semibold">✕ Devolución rechazada en control de calidad</p>
              {claim.rejectionReason && (
                <p className="text-zinc-400 text-[11px]">Motivo: {claim.rejectionReason}</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
