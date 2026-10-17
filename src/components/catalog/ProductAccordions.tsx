"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, Ruler, HeartHandshake, RefreshCw, Truck } from "lucide-react";

interface ProductAccordionsProps {
  rawDescription?: string | null;
  categoryName?: string | null;
}

export function ProductAccordions({ rawDescription, categoryName }: ProductAccordionsProps) {
  const [openSection, setOpenSection] = useState<string | null>("details");

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const sections = [
    {
      id: "details",
      title: "Detalles & Materiales",
      icon: Sparkles,
      content: (
        <div className="space-y-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
          {rawDescription && (
            <p className="whitespace-pre-line text-stone-700">{rawDescription}</p>
          )}
          <ul className="mt-2 list-disc pl-4 space-y-1 text-stone-600">
            <li>Pieza única seleccionada con curaduría de showroom.</li>
            <li>Confección con terminaciones de alta costura y telas premium.</li>
            <li>Diseño atemporal pensado para perdurar.</li>
            {categoryName && <li>Categoría: {categoryName}</li>}
          </ul>
        </div>
      ),
    },
    {
      id: "measurements",
      title: "Medidas & Guía de talles",
      icon: Ruler,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-stone-600 sm:text-sm">
          <p>
            Al tratarse de piezas únicas de showroom, tomamos las medidas de cada prenda en plano (de costura a costura):
          </p>
          <div className="overflow-x-auto rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-white border border-[#e7e2da]">
                <span className="text-stone-400 block uppercase">Pecho / Busto</span>
                <span className="font-bold text-stone-800">46 - 50 cm</span>
              </div>
              <div className="p-2 rounded bg-white border border-[#e7e2da]">
                <span className="text-stone-400 block uppercase">Cintura</span>
                <span className="font-bold text-stone-800">38 - 42 cm</span>
              </div>
              <div className="p-2 rounded bg-white border border-[#e7e2da]">
                <span className="text-stone-400 block uppercase">Cadera</span>
                <span className="font-bold text-stone-800">48 - 54 cm</span>
              </div>
              <div className="p-2 rounded bg-white border border-[#e7e2da]">
                <span className="text-stone-400 block uppercase">Largo Total</span>
                <span className="font-bold text-stone-800">Regular</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-stone-500 italic">
            ¿Dudas sobre cómo te va a quedar? Escribinos por WhatsApp y te pasamos un video o fotos con cinta métrica.
          </p>
        </div>
      ),
    },
    {
      id: "care",
      title: "Cuidados de la prenda",
      icon: HeartHandshake,
      content: (
        <div className="space-y-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
          <ul className="list-disc pl-4 space-y-1">
            <li>Lavar a mano con agua fría y jabón neutro suave para fibras finas.</li>
            <li>No retorcer ni usar secadora de tambor.</li>
            <li>Secar en plano o colgado a la sombra para proteger el color natural.</li>
            <li>Planchado a baja temperatura con paño intermedio de algodón si es necesario.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "shipping",
      title: "Envíos, Retiro & Cambios",
      icon: Truck,
      content: (
        <div className="space-y-2.5 text-xs leading-relaxed text-stone-600 sm:text-sm">
          <p>
            <strong className="text-stone-800">Retiro en Showroom:</strong> Gratuito, coordinando previamente horario por WhatsApp.
          </p>
          <p>
            <strong className="text-stone-800">Envíos a todo el país:</strong> A domicilio o sucursal por correo privado (3 a 5 días hábiles con seguimiento).
          </p>
          <p>
            <strong className="text-stone-800">Moto Express (CABA / AMBA):</strong> Entregas en el día o dentro de las 24 hs hábiles.
          </p>
          <div className="mt-2 rounded-lg bg-stone-100 p-2.5 text-[11px] text-stone-700">
            <div className="flex items-center gap-1.5 font-semibold text-stone-900 mb-0.5">
              <RefreshCw className="h-3 w-3 text-stone-600" />
              <span>Política de Cambios</span>
            </div>
            <span>Las prendas tienen cambio dentro de los 15 días posteriores a la compra con etiqueta original y sin uso.</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-8 divide-y divide-[#e7e2da] border-t border-b border-[#e7e2da]">
      {sections.map((section) => {
        const isOpen = openSection === section.id;
        const Icon = section.icon;

        return (
          <div key={section.id} className="py-3">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between py-1 text-left font-serif text-sm font-medium tracking-wide text-stone-900 transition-colors hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#926a3c]" aria-hidden="true" />
                <span>{section.title}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-stone-500 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-stone-900" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {isOpen && (
              <div className="mt-2.5 pb-2 animate-in fade-in slide-in-from-top-1 duration-150">
                {section.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

