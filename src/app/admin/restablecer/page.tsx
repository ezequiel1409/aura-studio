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
      <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 shadow-xl text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-950/60 border border-red-800 text-red-400">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-sm font-semibold text-zinc-100">Enlace inválido o incompleto</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          El enlace no contiene el token necesario para restablecer tu clave. Por favor, solicita uno nuevo.
        </p>
        <Link
          href="/admin/recuperar"
          className="inline-block text-xs font-medium text-amber-200 hover:text-amber-100 py-2.5 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 transition-colors w-full"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 shadow-xl text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400">
          <CheckCircle2 size={24} />
        </div>
        <h2 className="text-base font-semibold text-zinc-100">¡Contraseña restablecida!</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Tu nueva clave se ha guardado de forma segura. Ya podés acceder a tu panel de administración.
        </p>
        <div className="pt-2">
          <button
            onClick={() => router.push("/admin/login")}
            className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-zinc-950 bg-amber-200 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Iniciar Sesión</span>
            <Sparkles size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-zinc-400 leading-relaxed mb-1">
          Ingresá tu nueva clave (mínimo 8 caracteres). Será hasheada con altos estándares de seguridad (PBKDF2-HMAC-SHA512).
        </p>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2"
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
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all disabled:opacity-50"
              autoFocus
              required
            />
            <Lock
              size={16}
              className="absolute right-3.5 top-3.5 text-zinc-500 pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2"
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
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all disabled:opacity-50"
              required
            />
            <KeyRound
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
          disabled={loading || !newPassword || !confirmPassword}
          className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-zinc-950 bg-amber-200 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-amber-950/20 mt-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Guardando nueva clave...</span>
            </>
          ) : (
            <>
              <span>Actualizar Contraseña</span>
              <Sparkles size={14} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Cabecera */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-amber-200 mb-4 shadow-inner">
            <Lock size={26} strokeWidth={1.75} />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-100">
            Aura Studio
          </h1>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-semibold">
            Restablecer Contraseña
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 text-center text-zinc-400">
              <Loader2 size={24} className="animate-spin mx-auto text-amber-200 mb-2" />
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

