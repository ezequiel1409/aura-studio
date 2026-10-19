"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldAlert, Sparkles } from "lucide-react";
import { AdminThemeToggle } from "../../../components/admin/AdminThemeToggle";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-lg text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-950/40 border border-rose-800 text-rose-300">
          <ShieldAlert size={24} aria-hidden="true" />
        </div>
        <h2 className="text-sm font-bold text-zinc-100">Enlace inválido o incompleto</h2>
        <p className="text-xs text-zinc-300 leading-relaxed">
          El enlace no contiene el token necesario para restablecer tu clave. Por favor, solicita uno nuevo.
        </p>
        <Link
          href="/admin/recuperar"
          className="inline-block text-xs font-semibold text-zinc-200 hover:text-zinc-100 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors w-full border border-zinc-700 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-lg text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-800 text-emerald-300">
          <CheckCircle2 size={24} aria-hidden="true" />
        </div>
        <h2 className="text-base font-bold text-zinc-100">¡Contraseña restablecida!</h2>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Tu nueva clave se ha guardado de forma segura. Ya podés acceder a tu panel de administración.
        </p>
        <div className="pt-2">
          <button
            onClick={() => router.push("/admin/login")}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-amber-200 text-zinc-950 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
          >
            <span>Iniciar Sesión</span>
            <Sparkles size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-zinc-300 leading-relaxed mb-1">
          Ingresá tu nueva clave (mínimo 8 caracteres). Será hasheada con altos estándares de seguridad (PBKDF2-HMAC-SHA512).
        </p>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
          >
            Nueva contraseña
          </label>
          <div className="relative flex items-center">
            <input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              disabled={loading}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Al menos 8 caracteres"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-4 pr-11 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 transition-all disabled:opacity-50"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              disabled={loading}
              aria-label={showNewPassword ? "Ocultar nueva contraseña" : "Ver nueva contraseña"}
              title={showNewPassword ? "Ocultar nueva contraseña" : "Ver nueva contraseña"}
              className="absolute right-2 p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-colors cursor-pointer disabled:opacity-50"
            >
              {showNewPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
          >
            Confirmar contraseña
          </label>
          <div className="relative flex items-center">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetí la nueva contraseña"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-4 pr-11 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 transition-all disabled:opacity-50"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
              aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Ver confirmación de contraseña"}
              title={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Ver confirmación de contraseña"}
              className="absolute right-2 p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-colors cursor-pointer disabled:opacity-50"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl border bg-amber-950/40 border-amber-800 text-amber-300 text-xs font-medium"
          >
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !newPassword || !confirmPassword}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-amber-200 text-zinc-950 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm mt-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
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
    <div className="min-h-[calc(100vh-8rem)] w-full max-w-full flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex justify-end mb-3">
          <AdminThemeToggle />
        </div>

        {/* Cabecera */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-amber-300 mb-4 shadow-2xs">
            <Lock size={26} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-zinc-100">
            Aura Studio
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 uppercase tracking-widest font-semibold">
            Restablecer Contraseña
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-300 shadow-lg">
              <Loader2 size={24} className="animate-spin mx-auto text-amber-300 mb-2" aria-hidden="true" />
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
