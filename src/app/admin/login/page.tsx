"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Lock, Mail, ShieldAlert, Sparkles, Loader2 } from "lucide-react";

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
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Cabecera / Identidad */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-amber-200 mb-4 shadow-inner">
            <Lock size={26} strokeWidth={1.75} />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-100">
            Aura Studio
          </h1>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-semibold">
            Panel de Administración
          </p>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={loading || isLocked}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aurastudio.com"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all disabled:opacity-50"
                  required
                />
                <Mail
                  size={16}
                  className="absolute right-3.5 top-3.5 text-zinc-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-zinc-300 uppercase tracking-wider"
                >
                  Contraseña
                </label>
                <Link
                  href="/admin/recuperar"
                  className="text-xs text-amber-300 hover:text-amber-200 hover:underline transition-colors py-1"
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
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all disabled:opacity-50"
                  autoFocus
                  required
                />
                <KeyRound
                  size={16}
                  className="absolute right-3.5 top-3.5 text-zinc-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Mensajes de error o bloqueo */}
            {errorMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  isLocked
                    ? "bg-red-950/40 border-red-800 text-red-200"
                    : "bg-amber-950/30 border-amber-800/80 text-amber-200"
                }`}
              >
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{errorMessage}</p>
                  {isLocked && (
                    <p className="mt-1 font-mono text-[11px] text-red-300 font-bold">
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
              className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-zinc-950 bg-amber-200 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-amber-950/20 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : isLocked ? (
                <span>Bloqueado temporalmente</span>
              ) : (
                <>
                  <span>Ingresar al Panel</span>
                  <Sparkles size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Pie de pantalla */}
        <p className="text-center text-xs text-zinc-500 mt-6">
          Acceso privado para el equipo de administración de showroom.
        </p>
      </div>
    </div>
  );
}
