"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  HelpCircle,
} from "lucide-react";

interface CustomerAuthClientProps {
  brandName?: string;
}

export function CustomerAuthClient({ brandName = "Aura Studio" }: CustomerAuthClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/cuenta";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Visibilidad de contraseñas
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showForgotHelper, setShowForgotHelper] = useState(false);

  // Campos de login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Campos de registro
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDni, setRegDni] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Cálculo de fortaleza de contraseña
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-stone-200" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score === 1) return { score: 1, label: "Débil", color: "bg-rose-500", text: "text-rose-600" };
    if (score === 2) return { score: 2, label: "Buena", color: "bg-amber-500", text: "text-amber-700" };
    return { score: 3, label: "Muy segura", color: "bg-emerald-500", text: "text-emerald-700" };
  };

  const regStrength = getPasswordStrength(regPassword);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo iniciar sesión.");
      }

      setSuccessMsg("¡Bienvenido nuevamente! Redirigiendo...");
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const dniDigits = regDni.replace(/\D/g, "");
    if (!dniDigits || dniDigits.length < 6) {
      setError("Por favor ingresá un número de DNI válido (mínimo 6 dígitos).");
      return;
    }

    if (regPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          dni: dniDigits,
          phone: regPhone || null,
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar la cuenta.");
      }

      setSuccessMsg("¡Cuenta creada exitosamente! Redirigiendo a tu espacio...");
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-14">
      {/* Encabezado */}
      <div className="text-center mb-8">
        <span className="text-[11px] tracking-[0.25em] font-semibold uppercase text-stone-500">
          Espacio de Clientes · {brandName}
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-light text-stone-900 tracking-tight">
          {mode === "login" ? "Accedé a tu Cuenta" : "Creá tu Cuenta"}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-600">
          {mode === "login"
            ? "Gestioná tus pedidos, direcciones de entrega y piezas guardadas."
            : "Completá tus datos para disfrutar de checkout ágil y seguimiento exclusivo."}
        </p>
      </div>

      {/* Selector de Pestañas */}
      <div className="grid grid-cols-2 rounded-2xl bg-[#f0eae1] p-1 mb-6 border border-[#e2dacf]">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setShowForgotHelper(false);
          }}
          className={`rounded-xl py-2.5 text-xs font-medium transition-all cursor-pointer ${
            mode === "login"
              ? "bg-white text-stone-900 shadow-xs font-semibold"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
            setShowForgotHelper(false);
          }}
          className={`rounded-xl py-2.5 text-xs font-medium transition-all cursor-pointer ${
            mode === "register"
              ? "bg-white text-stone-900 shadow-xs font-semibold"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Registrarme
        </button>
      </div>

      {/* Contenedor del Formulario */}
      <div className="rounded-3xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-xs">
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="leading-relaxed font-medium">{successMsg}</span>
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-stone-800 mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-10 pr-3.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-stone-800"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotHelper(!showForgotHelper)}
                  className="text-xs text-stone-600 hover:text-stone-900 underline underline-offset-2 cursor-pointer font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-10 pr-10 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showLoginPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Ayuda de contraseña olvidada */}
              {showForgotHelper && (
                <div className="mt-3 rounded-xl bg-stone-50 border border-stone-200 p-3 text-xs text-stone-600 flex items-start gap-2 animate-in fade-in-50">
                  <HelpCircle className="h-4 w-4 text-stone-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-stone-800">Recuperación de acceso</p>
                    <p className="mt-0.5">
                      Por motivos de privacidad, escribinos por WhatsApp indicando tu correo para restablecer tu contraseña en minutos.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a mi cuenta</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label
                htmlFor="reg-name"
                className="block text-sm font-medium text-stone-800 mb-1.5"
              >
                Nombre y Apellido
              </label>
              <div className="relative">
                <input
                  id="reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-10 pr-3.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-sm font-medium text-stone-800 mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-10 pr-3.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="reg-dni"
                  className="block text-sm font-medium text-stone-800 mb-1.5"
                >
                  DNI del titular *
                </label>
                <div className="relative">
                  <input
                    id="reg-dni"
                    type="text"
                    inputMode="numeric"
                    required
                    value={regDni}
                    onChange={(e) => setRegDni(e.target.value)}
                    placeholder="Ej: 40123456"
                    className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 px-3.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-phone"
                  className="block text-sm font-medium text-stone-800 mb-1.5"
                >
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="11 2345-6789"
                    className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-9 pr-3.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                </div>
              </div>
            </div>
            <p className="-mt-2 text-[11px] text-stone-500">
              Usamos tu DNI y WhatsApp para validar la titularidad al retirar o recibir tus piezas.
            </p>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-sm font-medium text-stone-800 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showRegPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-10 pr-10 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  aria-label={showRegPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showRegPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                >
                  {showRegPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Indicador de fortaleza */}
              {regPassword.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={`h-full transition-all ${
                        regStrength.score >= 1 ? regStrength.color : "bg-stone-200"
                      }`}
                      style={{ width: "33.3%" }}
                    />
                    <div
                      className={`h-full transition-all ${
                        regStrength.score >= 2 ? regStrength.color : "bg-stone-200"
                      }`}
                      style={{ width: "33.3%" }}
                    />
                    <div
                      className={`h-full transition-all ${
                        regStrength.score >= 3 ? regStrength.color : "bg-stone-200"
                      }`}
                      style={{ width: "33.4%" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500">Seguridad:</span>
                    <span className={`font-semibold ${regStrength.text}`}>
                      {regStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <span>Registrarme</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Enlace para continuar como invitado en checkout */}
      {redirectUrl.includes("carrito") && (
        <div className="mt-6 text-center">
          <Link
            href="/carrito"
            className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-4 transition-colors"
          >
            Continuar compra como invitado sin registrarme
          </Link>
        </div>
      )}
    </div>
  );
}
