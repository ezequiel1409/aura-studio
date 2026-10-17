"use client";

import { ShoppingBag, Truck, ClipboardCheck, Check } from "lucide-react";

export type CheckoutStep = "cart" | "shipping" | "payment";

interface CartStepperProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
}

const STEPS: Array<{ id: CheckoutStep; label: string; icon: typeof ShoppingBag; number: number }> = [
  { id: "cart", label: "Tu bolsa", icon: ShoppingBag, number: 1 },
  { id: "shipping", label: "Entrega y Datos", icon: Truck, number: 2 },
  { id: "payment", label: "Revisión", icon: ClipboardCheck, number: 3 },
];

export function CartStepper({ currentStep, onStepClick }: CartStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Progreso del pedido" className="w-full max-w-md mx-auto mb-6 sm:mb-8">
      <div className="relative flex items-center justify-between">
        {/* Barra de progreso de fondo */}
        <div className="absolute left-0 top-3.5 sm:top-4 h-[2px] w-full bg-[#d8d2c7] z-0" />

        {/* Barra de progreso activa */}
        <div
          className="absolute left-0 top-3.5 sm:top-4 h-[2px] bg-stone-900 transition-all duration-300 z-0"
          style={{
            width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={idx > currentIndex && !isCompleted}
                onClick={() => onStepClick && onStepClick(step.id)}
                aria-current={isActive ? "step" : undefined}
                className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition-all font-mono text-xs font-bold ${
                  isActive
                    ? "border-stone-900 bg-stone-900 text-white shadow-xs scale-105"
                    : isCompleted
                    ? "border-stone-900 bg-white text-stone-900 hover:bg-stone-50 cursor-pointer"
                    : "border-stone-400 bg-[#f5f2eb] text-stone-600 cursor-not-allowed"
                } focus-visible:outline-2 focus-visible:outline-stone-900`}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5 stroke-[3] text-stone-900" aria-hidden="true" />
                ) : (
                  <span>{step.number}</span>
                )}
                <span className="sr-only">Paso {step.number}: {step.label}</span>
              </button>

              <span
                className={`mt-1.5 font-sans text-xs sm:text-[13px] transition-colors ${
                  isActive
                    ? "font-bold text-stone-900"
                    : isCompleted
                    ? "font-medium text-stone-700"
                    : "font-medium text-stone-500"
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
