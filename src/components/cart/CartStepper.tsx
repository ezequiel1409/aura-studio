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
    <nav aria-label="Progreso del pedido" className="w-full max-w-md mx-auto mb-5 sm:mb-6">
      <div className="relative flex items-center justify-between">
        {/* Barra de progreso de fondo */}
        <div className="absolute left-0 top-3 sm:top-3.5 h-[1.5px] w-full bg-[#e7e2da] z-0" />

        {/* Barra de progreso activa */}
        <div
          className="absolute left-0 top-3 sm:top-3.5 h-[1.5px] bg-stone-900 transition-all duration-300 z-0"
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
                className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border transition-all ${
                  isActive
                    ? "border-stone-900 bg-stone-900 text-white shadow-xs scale-105"
                    : isCompleted
                    ? "border-stone-900 bg-white text-stone-900 hover:bg-stone-50 cursor-pointer"
                    : "border-[#e7e2da] bg-white text-stone-300 cursor-not-allowed"
                } focus-visible:outline-2 focus-visible:outline-stone-900`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-stone-900" aria-hidden="true" />
                ) : (
                  <StepIcon className="h-3 w-3 sm:h-3 sm:w-3" aria-hidden="true" />
                )}
                <span className="sr-only">Paso {step.number}: {step.label}</span>
              </button>

              <span
                className={`mt-1 font-sans text-[10px] sm:text-[11px] transition-colors ${
                  isActive
                    ? "font-bold text-stone-900"
                    : isCompleted
                    ? "font-medium text-stone-700"
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

