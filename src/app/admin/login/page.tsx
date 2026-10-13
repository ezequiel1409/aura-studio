"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound, Lock, Mail, ShieldAlert, Sparkles, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@aurastudio.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState<number>(0);

  // Cuenta regresiva del bloqueo de fuerza bruta (BR-11)
  useEffect(() => {
    if (remainingLockSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingLockSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingLockSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !email.trim() || loading || remainingLockSeconds > 0) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (data.remainingLockSeconds) {
          setRemainingLockSeconds(data.remainingLockSeconds);
        }
        setErrorMessage(
          data.error || "Credenciales incorrectas. Por favor, verificá tus datos."
        );
        return;
      }

      // Redirigir al panel principal
      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage("No se pudo conectar con el servidor. Revisá tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const isLocked = remainingLockSeconds > 0;

  return (
    <div className="min-h-[calc(100vh-6rem)] w-full max-w-full flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Retorno rápido a la tienda */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            prefetch={true}
            aria-label="Volver a la tienda y catálogo público"
            className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-200/60 border border-stone-200/80 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:outline-none bg-white/70 shadow-2xs"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Volver a la tienda</span>
          </Link>
          <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500">
            Showroom
          </span>
        </div>

        {/* Cabecera / Identidad */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f5f0e8] border border-[#e2dcd2] text-[#926a3c] mb-4 shadow-2xs">
            <Lock size={26} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h1 className="font-serif text-3xl font-light tracking-wide text-stone-900">
            Aura Studio
          </h1>
          <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-semibold">
            Panel de Administración
          </p>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-white border border-[#e7e2da] rounded-2xl p-6 sm:p-7 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={loading || isLocked}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aurastudio.com"
                  className="w-full bg-[#fcfbf9] border border-[#d8d2c7] rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all disabled:opacity-50"
                  required
                />
                <Mail
                  size={16}
                  className="absolute right-3.5 top-3.5 text-stone-400 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-stone-700 uppercase tracking-wider"
                >
                  Contraseña
                </label>
                <Link
                  href="/admin/recuperar"
                  className="text-xs text-[#926a3c] hover:text-[#78532c] hover:underline underline-offset-4 transition-colors py-1 font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  disabled={loading || isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña"
                  className="w-full bg-[#fcfbf9] border border-[#d8d2c7] rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all disabled:opacity-50"
                  autoFocus
                  required
                />
                <KeyRound
                  size={16}
                  className="absolute right-3.5 top-3.5 text-stone-400 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Mensajes de error o bloqueo */}
            {errorMessage && (
              <div
                role="alert"
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  isLocked
                    ? "bg-red-50 border-red-200 text-red-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <ShieldAlert
                  size={16}
                  className={`shrink-0 mt-0.5 ${isLocked ? "text-red-600" : "text-amber-700"}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">{errorMessage}</p>
                  {isLocked && (
                    <p className="mt-1 font-mono text-[11px] text-red-800 font-bold">
                      Desbloqueo en: {remainingLockSeconds}s
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botón de Ingreso Táctil */}
            <button
              type="submit"
              disabled={loading || isLocked || !password.trim() || !email.trim()}
              className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-white bg-stone-900 hover:bg-stone-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-xs mt-2 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  <span>Verificando credenciales...</span>
                </>
              ) : isLocked ? (
                <span>Bloqueado temporalmente</span>
              ) : (
                <>
                  <span>Ingresar al Panel</span>
                  <Sparkles size={14} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Enlace secundario de regreso al catálogo */}
          <div className="mt-5 pt-4 border-t border-[#f0ece1] text-center">
            <Link
              href="/"
              prefetch={true}
              aria-label="Volver al catálogo de la tienda"
              className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:outline-none"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              <span>Volver a la tienda</span>
            </Link>
          </div>
        </div>

        {/* Pie de pantalla */}
        <p className="text-center text-xs text-stone-500 mt-6">
          Acceso privado para el equipo de administración de showroom.
        </p>
      </div>
    </div>
  );
}
