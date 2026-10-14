"use client";

import { ShoppingBag, Truck, CheckCircle2 } from "lucide-react";

export type CheckoutStep = "cart" | "shipping" | "payment";

interface CartStepperProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
}

const STEPS: Array<{ id: CheckoutStep; label: string; icon: typeof ShoppingBag; number: number }> = [
  { id: "cart", label: "Artículos", icon: ShoppingBag, number: 1 },
  { id: "shipping", label: "Envío y Datos", icon: Truck, number: 2 },
  { id: "payment", label: "Confirmación", icon: CheckCircle2, number: 3 },
];

export function CartStepper({ currentStep, onStepClick }: CartStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Progreso del pedido" className="w-full max-w-2xl mx-auto mb-8 sm:mb-12">
      <div className="relative flex items-center justify-between">
        {/* Barra de progreso de fondo */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-[#e7e2da] z-0" />

        {/* Barra de progreso activa */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-stone-900 transition-all duration-300 z-0"
          style={{
            width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={idx > currentIndex && !isCompleted}
                onClick={() => onStepClick && onStepClick(step.id)}
                aria-current={isActive ? "step" : undefined}
                className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 transition-all ${
                  isActive
                    ? "border-stone-900 bg-stone-900 text-white shadow-md ring-4 ring-stone-900/10 scale-105"
                    : isCompleted
                    ? "border-stone-900 bg-white text-stone-900 hover:bg-stone-50 cursor-pointer"
                    : "border-[#e7e2da] bg-white text-stone-400 cursor-not-allowed"
                } focus-visible:outline-2 focus-visible:outline-stone-900`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-stone-900" aria-hidden="true" />
                ) : (
                  <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                )}
                <span className="sr-only">Paso {step.number}: {step.label}</span>
              </button>

              <span
                className={`mt-2 font-sans text-[11px] sm:text-xs font-medium tracking-wider uppercase transition-colors ${
                  isActive
                    ? "font-bold text-stone-900"
                    : isCompleted
                    ? "text-stone-700"
                    : "text-stone-400"
                }`}
              >
                {step.number}. {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
