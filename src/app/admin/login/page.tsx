"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, ShieldAlert, Sparkles, Loader2 } from "lucide-react";

export default function AdminLoginPage({
  initialBrandName = "Aura Studio",
  initialStoreType = "Showroom",
}: {
  initialBrandName?: string;
  initialStoreType?: string;
} = {}) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(initialBrandName);
  const [storeType, setStoreType] = useState(initialStoreType);
  const [email, setEmail] = useState("admin@aurastudio.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState<number>(0);

  // Obtener nombre y tipo de tienda configurados
  useEffect(() => {
    fetch("/api/admin/login")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          if (data.storeName) setStoreName(data.storeName);
          if (data.storeType) setStoreType(data.storeType);
        }
      })
      .catch(() => {});
  }, []);

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
    if (loading || remainingLockSeconds > 0) return;

    if (!email.trim()) {
      setErrorMessage("Por favor, ingresá tu correo electrónico.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Por favor, ingresá tu contraseña.");
      return;
    }

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
    <div className="min-h-[calc(100vh-8rem)] w-full max-w-full flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm mx-auto">
        {/* Cabecera / Identidad */}
        <div className="text-center mb-7">
          <h1 className="font-serif text-3xl font-bold tracking-wide text-zinc-100">
            {storeName}
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 uppercase tracking-widest font-semibold">
            Panel de Administración
          </p>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
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
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 transition-all disabled:opacity-50"
                  required
                />
                <Mail
                  size={16}
                  className="absolute right-3.5 top-3.5 text-zinc-500 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider"
                >
                  Contraseña
                </label>
                <Link prefetch={false}
                  href="/admin/recuperar"
                  className="text-xs text-amber-300 hover:text-amber-200 hover:underline underline-offset-4 transition-colors py-1 font-semibold rounded focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  disabled={loading || isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-4 pr-11 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 transition-all disabled:opacity-50"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || isLocked}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute right-2 p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-colors cursor-pointer disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensajes de error o bloqueo */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  isLocked
                    ? "bg-rose-950/40 border-rose-800 text-rose-300"
                    : "bg-amber-950/40 border-amber-800 text-amber-300"
                }`}
              >
                <ShieldAlert
                  size={16}
                  className={`shrink-0 mt-0.5 ${isLocked ? "text-rose-400" : "text-amber-400"}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold">{errorMessage}</p>
                  {isLocked && (
                    <p className="mt-1 font-mono text-xs text-rose-300 font-bold">
                      Desbloqueo en: {remainingLockSeconds}s
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botón de Ingreso Táctil */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-amber-200 text-zinc-950 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm mt-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
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
                  <Sparkles size={15} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Enlace de regreso a la tienda */}
          <div className="mt-5 pt-4 border-t border-zinc-800 text-center">
            <Link
              href="/"
              prefetch={true}
              className="inline-flex items-center text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors py-2 px-3 rounded-lg hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <span>Volver a la tienda</span>
            </Link>
          </div>
        </div>

        {/* Pie de pantalla */}
        <p className="text-center text-xs text-zinc-400 mt-6">
          Acceso privado para el equipo de administración de {storeName}.
        </p>
      </div>
    </div>
  );
}
