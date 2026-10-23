"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, Eye, Sparkles, X } from "lucide-react";

interface OnboardingChecklistProps {
  hasBusinessData: boolean;
  hasBranding: boolean;
  hasProducts: boolean;
  hasPaymentsAndShipping: boolean;
  hasTestOrder: boolean;
  storeStatus?: "DRAFT" | "PUBLISHED";
}

export function OnboardingChecklist({
  hasBusinessData,
  hasBranding,
  hasProducts,
  hasPaymentsAndShipping,
  hasTestOrder,
  storeStatus = "PUBLISHED",
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<"DRAFT" | "PUBLISHED">(storeStatus);

  useEffect(() => {
    const saved = localStorage.getItem("aura_admin_onboarding_dismissed");
    if (saved === "true") {
      setIsDismissed(true);
    }
  }, []);

  const steps = [
    {
      id: "business",
      title: "1. Completar datos del negocio",
      desc: "Nombre, WhatsApp de contacto y rubro comercial",
      completed: hasBusinessData,
      href: "/admin/configuracion?seccion=top",
    },
    {
      id: "branding",
      title: "2. Personalizar logo y colores",
      desc: "Identidad visual y paleta accesible para la tienda",
      completed: hasBranding,
      href: "/admin/configuracion?seccion=main",
    },
    {
      id: "products",
      title: "3. Cargar los primeros 3 productos",
      desc: "Fotos, precios, talles y stock de tus piezas",
      completed: hasProducts,
      href: "/admin/productos/nuevo",
    },
    {
      id: "shipping",
      title: "4. Configurar medios de entrega y pago",
      desc: "Retiro en showroom o envíos a domicilio",
      completed: hasPaymentsAndShipping,
      href: "/admin/configuracion?seccion=footer",
    },
    {
      id: "test_order",
      title: "5. Realizar una prueba de compra",
      desc: "Probar el flujo de reserva y confirmación por WhatsApp",
      completed: hasTestOrder,
      href: "/",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const allCompleted = completedCount === steps.length;

  if (isDismissed || allCompleted) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("aura_admin_onboarding_dismissed", "true");
  };

  const toggleStoreStatus = () => {
    setCurrentStatus(currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED");
  };

  return (
    <section
      aria-label="Puesta en marcha de la tienda"
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4"
    >
      {/* Encabezado con estado y botón de descartar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
              <Sparkles size={12} aria-hidden="true" />
              <span>Puesta en marcha</span>
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {completedCount} de {steps.length} completados ({progressPercent}%)
            </span>
          </div>
          <h2 className="font-serif text-lg md:text-xl font-bold text-zinc-100 mt-1.5">
            Prepará tu tienda para empezar a vender
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch de estado Borrador / Publicada */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="text-zinc-400 text-xs">Estado:</span>
            <button
              type="button"
              onClick={toggleStoreStatus}
              className={`font-bold transition-colors ${
                currentStatus === "PUBLISHED"
                  ? "text-emerald-400 hover:text-emerald-300"
                  : "text-amber-400 hover:text-amber-300"
              }`}
            >
              {currentStatus === "PUBLISHED" ? "● Publicada" : "○ Borrador"}
            </button>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            <Eye size={13} aria-hidden="true" />
            <span>Ver tienda</span>
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Ocultar checklist de puesta en marcha"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Ocultar checklist"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800/80">
        <div
          className="bg-amber-300 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Lista de pasos con enlaces directos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
        {steps.map((step) => (
          <Link prefetch={false}
            key={step.id}
            href={step.href}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
              step.completed
                ? "bg-zinc-950/40 border-zinc-800/50 text-zinc-400 hover:border-zinc-700"
                : "bg-zinc-950 border-zinc-800 text-zinc-200 hover:border-amber-400/50 hover:bg-zinc-950/80"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {step.completed ? (
                <CheckCircle2 size={16} className="text-emerald-400" aria-hidden="true" />
              ) : (
                <Circle size={16} className="text-zinc-500" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-bold ${
                  step.completed ? "line-through text-zinc-400" : "text-zinc-100"
                }`}
              >
                {step.title}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">{step.desc}</p>
            </div>
            <ArrowRight size={13} className="text-zinc-500 mt-1 shrink-0" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

