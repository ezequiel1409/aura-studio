import { Search, MessageCircle, PackageCheck } from "lucide-react";

export function HowToBuySection() {
  const steps = [
    {
      number: "01",
      title: "Elegí tu pieza",
      description:
        "Explorá nuestra curaduría de piezas únicas. Cada prenda cuenta con medidas exactas en centímetros y fotos detalladas.",
      icon: Search,
    },
    {
      number: "02",
      title: "Reservala por WhatsApp",
      description:
        "Generá tu orden en la bolsa o consultanos directamente. Apartamos tu pieza por 30 minutos mientras coordinamos el pago.",
      icon: MessageCircle,
    },
    {
      number: "03",
      title: "Retirala o recibila",
      description:
        "Retiro inmediato y gratuito en nuestro Showroom de Palermo Soho, o envíos seguros a todo el país por correo y mensajería express.",
      icon: PackageCheck,
    },
  ];

  return (
    <section
      id="como-comprar"
      aria-label="Cómo comprar en Aura Studio"
      className="my-16 sm:my-20 rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-10 shadow-xs"
    >
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
          Proceso Simple & Transparente
        </span>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-light text-stone-900 tracking-wide">
          Cómo comprar en nuestro Showroom
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
          Un modelo de atención personalizada pensado para prendas irrepetibles. Sin intermediarios fríos: trato directo con el equipo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="relative rounded-xl border border-[#f0ece1] bg-[#faf8f5] p-5 sm:p-6 transition-all hover:border-[#ddd6c7] hover:bg-white hover:shadow-2xs"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold text-stone-300">
                  {step.number}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#e7e2da] text-stone-800 shadow-2xs">
                  <Icon className="h-5 w-5 text-[#926a3c]" />
                </div>
              </div>

              <h3 className="font-serif text-lg font-medium text-stone-900">
                {step.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

