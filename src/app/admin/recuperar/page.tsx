"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail, Send } from "lucide-react";

export default function AdminRecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/admin/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Ocurrió un error al procesar la solicitud.");
        return;
      }

      setSuccessMessage(
        data.message ||
          "Si el correo se encuentra registrado, recibirás un enlace de restablecimiento válido por 1 hora."
      );
    } catch {
      setErrorMessage("No se pudo conectar con el servidor. Revisá tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Cabecera */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-amber-200 mb-4 shadow-inner">
            <KeyRound size={26} strokeWidth={1.75} />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-100">
            Aura Studio
          </h1>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-semibold">
            Recuperar Contraseña
          </p>
        </div>

        {/* Tarjeta */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          {successMessage ? (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Solicitud procesada
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {successMessage}
              </p>
              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center gap-2 text-xs font-medium text-amber-200 hover:text-amber-100 py-2.5 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 transition-colors w-full"
                >
                  <ArrowLeft size={14} />
                  <span>Volver al inicio de sesión</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                Ingresá tu correo electrónico registrado. Te enviaremos un enlace seguro para restablecer tu contraseña.
              </p>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@aurastudio.com"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all disabled:opacity-50"
                    autoFocus
                    required
                  />
                  <Mail
                    size={16}
                    className="absolute right-3.5 top-3.5 text-zinc-500 pointer-events-none"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl border bg-amber-950/30 border-amber-800/80 text-amber-200 text-xs">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-zinc-950 bg-amber-200 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-amber-950/20 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Enviando enlace...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar instrucciones</span>
                    <Send size={14} />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1"
                >
                  <ArrowLeft size={13} />
                  <span>Volver al inicio de sesión</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

