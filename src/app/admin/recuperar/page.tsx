"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail, Send } from "lucide-react";

export default function AdminRecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setDevResetLink(null);
    setEmailNotice(null);

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
      if (data.devResetLink) {
        setDevResetLink(data.devResetLink);
      }
      if (data.emailError) {
        setEmailNotice(data.emailError);
      }
    } catch {
      setErrorMessage("No se pudo conectar con el servidor. Revisá tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] w-full max-w-full flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Cabecera */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f5f0e8] border border-[#e2dcd2] text-[#926a3c] mb-4 shadow-2xs">
            <KeyRound size={26} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h1 className="font-serif text-3xl font-light tracking-wide text-stone-900">
            Aura Studio
          </h1>
          <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-semibold">
            Recuperar Contraseña
          </p>
        </div>

        {/* Tarjeta */}
        <div className="bg-white border border-[#e7e2da] rounded-2xl p-6 sm:p-7 shadow-xs">
          {successMessage ? (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                <CheckCircle2 size={24} aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-stone-900">
                Solicitud procesada
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                {successMessage}
              </p>

              {devResetLink && (
                <div className="text-left p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                  <p className="text-xs font-semibold text-amber-900">
                    Aviso (Servidor de correo no enlazado):
                  </p>
                  <p className="text-[11px] text-stone-700 leading-relaxed">
                    Aún no se ha configurado la variable de entorno <code className="text-amber-800 font-mono font-bold">RESEND_API_KEY</code> para el envío de correos salientes. Podés restablecer tu clave directamente accediendo a este enlace:
                  </p>
                  <a
                    href={devResetLink}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 text-white font-medium text-xs hover:bg-stone-800 transition-colors w-full focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:outline-none"
                  >
                    <span>Restablecer contraseña ahora</span>
                    <ArrowLeft size={13} className="rotate-180" aria-hidden="true" />
                  </a>
                </div>
              )}

              {emailNotice && (
                <div className="text-left p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                  <p className="font-semibold text-rose-800">Aviso del proveedor de correo:</p>
                  <p className="text-[11px] text-stone-700 leading-relaxed">{emailNotice}</p>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center gap-2 text-xs font-medium text-stone-700 hover:text-stone-950 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200/80 transition-colors w-full border border-stone-200/80 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:outline-none"
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  <span>Volver al inicio de sesión</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed mb-2">
                Ingresá tu correo electrónico registrado. Te enviaremos un enlace seguro para restablecer tu contraseña.
              </p>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2"
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
                    className="w-full bg-[#fcfbf9] border border-[#d8d2c7] rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all disabled:opacity-50"
                    autoFocus
                    required
                  />
                  <Mail
                    size={16}
                    className="absolute right-3.5 top-3.5 text-stone-400 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {errorMessage && (
                <div role="alert" className="p-3.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 text-xs">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-white bg-stone-900 hover:bg-stone-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-xs mt-2 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    <span>Enviando enlace...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar instrucciones</span>
                    <Send size={14} aria-hidden="true" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:outline-none"
                >
                  <ArrowLeft size={13} aria-hidden="true" />
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

