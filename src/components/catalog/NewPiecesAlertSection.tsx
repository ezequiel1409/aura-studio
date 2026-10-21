"use client";

import { useState } from "react";
import { Bell, CheckCircle2, Send, Sparkles } from "lucide-react";

export function NewPiecesAlertSection() {
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [contactValue, setContactValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactValue.trim()) return;

    setLoading(true);
    setTimeout(() => {
      try {
        const stored = localStorage.getItem("aura_alert_subscribers") || "[]";
        const list = JSON.parse(stored);
        list.push({ channel, contact: contactValue.trim(), date: new Date().toISOString() });
        localStorage.setItem("aura_alert_subscribers", JSON.stringify(list));
      } catch {}

      setLoading(false);
      setSubmitted(true);
    }, 400);
  };

  return (
    <section
      aria-label="Aviso de nuevas piezas"
      className="my-8 sm:my-10 rounded-2xl border border-[#e7e2da] bg-stone-900 text-white p-5 sm:p-7 shadow-sm relative overflow-hidden"
    >
      <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

      <div className="max-w-xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-amber-300 font-medium mb-3 backdrop-blur-xs">
          <Bell className="h-3.5 w-3.5" />
          <span>Acceso Prioritario a Drops</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-light text-white tracking-wide">
          Avisame cuando ingresen nuevas piezas
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed max-w-md mx-auto">
          Al ser prendas únicas, suelen reservarse en las primeras horas. Dejanos tu contacto para recibir el adelanto antes de la publicación general.
        </p>

        {submitted ? (
          <div
            role="status"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-900/60 border border-emerald-500/50 px-5 py-3 text-xs text-emerald-200 animate-in fade-in zoom-in-95 duration-200"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">
              ¡Listo! Te avisaremos ni bien entre la próxima selección de piezas exclusivas.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 max-w-md mx-auto space-y-3">
            {/* Selector de Canal */}
            <div className="flex justify-center gap-4 text-xs font-medium text-stone-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="channel"
                  value="whatsapp"
                  checked={channel === "whatsapp"}
                  onChange={() => setChannel("whatsapp")}
                  className="accent-amber-400"
                />
                <span>Por WhatsApp</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="channel"
                  value="email"
                  checked={channel === "email"}
                  onChange={() => setChannel("email")}
                  className="accent-amber-400"
                />
                <span>Por Correo</span>
              </label>
            </div>

            {/* Input y Botón */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type={channel === "whatsapp" ? "tel" : "email"}
                required
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={
                  channel === "whatsapp"
                    ? "Tu WhatsApp (ej: 11 5555-4444)"
                    : "Tu correo electrónico"
                }
                className="flex-1 rounded-xl border border-stone-700 bg-stone-950/80 px-4 py-3 text-xs text-white placeholder:text-stone-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-200 hover:bg-amber-100 text-stone-950 px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-sm"
              >
                <span>Avisarme</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-stone-400">
              Cero spam. Solo un mensaje breve cuando se abra una nueva curaduría.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

