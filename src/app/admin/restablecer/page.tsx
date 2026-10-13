"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, KeyRound, Loader2, Lock, ShieldAlert, Sparkles } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setErrorMessage("No se encontró el token de restablecimiento en el enlace.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "No se pudo restablecer la contraseña.");
        return;
      }

      setSuccess(true);
    } catch {
      setErrorMessage("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white border border-[#e7e2da] rounded-2xl p-6 sm:p-7 shadow-xs text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-700">
          <ShieldAlert size={24} aria-hidden="true" />
        </div>
        <h2 className="text-sm font-semibold text-stone-900">Enlace inválido o incompleto</h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          El enlace no contiene el token necesario para restablecer tu clave. Por favor, solicita uno nuevo.
        </p>
        <Link
          href="/admin/recuperar"
          className="inline-block text-xs font-medium text-stone-700 hover:text-stone-950 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200/80 transition-colors w-full border border-stone-200/80 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:outline-none"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white border border-[#e7e2da] rounded-2xl p-6 sm:p-7 shadow-xs text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
          <CheckCircle2 size={24} aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-stone-900">¡Contraseña restablecida!</h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          Tu nueva clave se ha guardado de forma segura. Ya podés acceder a tu panel de administración.
        </p>
        <div className="pt-2">
          <button
            onClick={() => router.push("/admin/login")}
            className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-white bg-stone-900 hover:bg-stone-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
          >
            <span>Iniciar Sesión</span>
            <Sparkles size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e7e2da] rounded-2xl p-6 sm:p-7 shadow-xs">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-stone-600 leading-relaxed mb-1">
          Ingresá tu nueva clave (mínimo 8 caracteres). Será hasheada con altos estándares de seguridad (PBKDF2-HMAC-SHA512).
        </p>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2"
          >
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type="password"
              disabled={loading}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Al menos 8 caracteres"
              className="w-full bg-[#fcfbf9] border border-[#d8d2c7] rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all disabled:opacity-50"
              autoFocus
              required
            />
            <Lock
              size={16}
              className="absolute right-3.5 top-3.5 text-stone-400 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2"
          >
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type="password"
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetí la nueva contraseña"
              className="w-full bg-[#fcfbf9] border border-[#d8d2c7] rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all disabled:opacity-50"
              required
            />
            <KeyRound
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
          disabled={loading || !newPassword || !confirmPassword}
          className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-white bg-stone-900 hover:bg-stone-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-xs mt-2 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              <span>Guardando nueva clave...</span>
            </>
          ) : (
            <>
              <span>Actualizar Contraseña</span>
              <Sparkles size={14} aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-6rem)] w-full max-w-full flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Cabecera */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f5f0e8] border border-[#e2dcd2] text-[#926a3c] mb-4 shadow-2xs">
            <Lock size={26} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h1 className="font-serif text-3xl font-light tracking-wide text-stone-900">
            Aura Studio
          </h1>
          <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-semibold">
            Restablecer Contraseña
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white border border-[#e7e2da] rounded-2xl p-6 text-center text-stone-600 shadow-xs">
              <Loader2 size={24} className="animate-spin mx-auto text-[#926a3c] mb-2" aria-hidden="true" />
              <p className="text-xs">Cargando formulario...</p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

