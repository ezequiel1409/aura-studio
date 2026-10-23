"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import { AdminThemeToggle } from "../../../components/admin/AdminThemeToggle";

type RecoveryTab = "email" | "master-key";

export default function AdminRecoverPasswordPage() {
  const [tab, setTab] = useState<RecoveryTab>("email");

  // Estados Tab Email
  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  // Estados Tab Clave Maestra
  const [masterEmail, setMasterEmail] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [masterSuccess, setMasterSuccess] = useState<string | null>(null);
  const [masterError, setMasterError] = useState<string | null>(null);

  // WhatsApp para asistencia
  const [supportPhone, setSupportPhone] = useState("+5491100000000");

  useEffect(() => {
    fetch("/api/admin/login")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.whatsapp) {
          setSupportPhone(data.whatsapp);
        }
      })
      .catch(() => {});
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loadingEmail) return;

    setLoadingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);
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
        setEmailError(data.error || "Ocurrió un error al procesar la solicitud.");
        return;
      }

      setEmailSuccess(
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
      setEmailError("No se pudo conectar con el servidor. Revisá tu conexión.");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterEmail.trim() || !recoveryKey.trim() || !newPassword || loadingMaster) return;

    if (newPassword.length < 8) {
      setMasterError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoadingMaster(true);
    setMasterError(null);
    setMasterSuccess(null);

    try {
      const res = await fetch("/api/admin/password-reset/master-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: masterEmail.trim(),
          recoveryKey: recoveryKey.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMasterError(data.error || "No se pudo restablecer la contraseña con la Clave Maestra.");
        return;
      }

      setMasterSuccess(
        data.message || "¡Contraseña restablecida con éxito! Ya podés iniciar sesión con tu nueva contraseña."
      );
    } catch {
      setMasterError("Error al contactar al servidor. Comprobá tu conexión.");
    } finally {
      setLoadingMaster(false);
    }
  };

  const cleanPhone = supportPhone.replace(/\D/g, "");
  const whatsappHelpUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    "Hola, necesito asistencia con el acceso de administrador en Aura Studio."
  )}`;

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full max-w-full flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-end mb-3">
          <AdminThemeToggle />
        </div>

        {/* Cabecera */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-amber-300 mb-4 shadow-2xs">
            <KeyRound size={26} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-zinc-100">
            Aura Studio
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 uppercase tracking-widest font-semibold">
            Recuperar Contraseña
          </p>
        </div>

        {/* Selector de Pestaña / Método */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950/80 border border-zinc-800 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => {
              setTab("email");
              setEmailError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === "email"
                ? "bg-amber-200 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Mail size={14} aria-hidden="true" />
            <span>Por Email</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("master-key");
              setMasterError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === "master-key"
                ? "bg-amber-200 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Clave Maestra</span>
          </button>
        </div>

        {/* Tarjeta Principal */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-lg">
          {/* TAB 1: POR EMAIL */}
          {tab === "email" && (
            <>
              {emailSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-800 text-emerald-300">
                    <CheckCircle2 size={24} aria-hidden="true" />
                  </div>
                  <h2 className="text-sm font-bold text-zinc-100">
                    Solicitud procesada
                  </h2>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {emailSuccess}
                  </p>

                  {devResetLink && (
                    <div className="text-left p-3.5 rounded-xl bg-amber-950/30 border border-amber-800 space-y-2">
                      <p className="text-xs font-bold text-amber-300">
                        Enlace de emergencia generado:
                      </p>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Podés restablecer tu clave directamente accediendo a este enlace:
                      </p>
                      <a
                        href={devResetLink}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-200 text-zinc-950 font-bold text-xs hover:bg-amber-100 transition-colors w-full focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                      >
                        <span>Restablecer contraseña ahora</span>
                        <ArrowLeft size={13} className="rotate-180" aria-hidden="true" />
                      </a>
                    </div>
                  )}

                  {emailNotice && (
                    <div className="text-left p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs space-y-1">
                      <p className="font-bold">Aviso del servidor de correo:</p>
                      <p className="text-xs text-zinc-300 leading-relaxed">{emailNotice}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link prefetch={false}
                      href="/admin/login"
                      className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-zinc-200 hover:text-zinc-100 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors w-full border border-zinc-700 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                    >
                      <ArrowLeft size={14} aria-hidden="true" />
                      <span>Volver al inicio de sesión</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                    Ingresá tu correo electrónico registrado. Te enviaremos un enlace seguro para restablecer tu contraseña.
                  </p>

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
                        disabled={loadingEmail}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@aurastudio.com"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 transition-all disabled:opacity-50"
                        autoFocus
                        required
                      />
                      <Mail
                        size={16}
                        className="absolute right-3.5 top-3.5 text-zinc-500 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {emailError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl border bg-amber-950/40 border-amber-800 text-amber-300 text-xs font-medium"
                    >
                      {emailError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loadingEmail || !email.trim()}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-amber-200 text-zinc-950 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm mt-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
                  >
                    {loadingEmail ? (
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
                </form>
              )}
            </>
          )}

          {/* TAB 2: CON CLAVE MAESTRA */}
          {tab === "master-key" && (
            <>
              {masterSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-800 text-emerald-300">
                    <CheckCircle2 size={24} aria-hidden="true" />
                  </div>
                  <h2 className="text-sm font-bold text-zinc-100">
                    ¡Contraseña Actualizada!
                  </h2>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {masterSuccess}
                  </p>
                  <div className="pt-2">
                    <Link prefetch={false}
                      href="/admin/login"
                      className="inline-flex items-center justify-center gap-2 text-xs font-bold text-zinc-950 py-3 px-4 rounded-xl bg-amber-200 hover:bg-amber-100 transition-colors w-full focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none shadow-sm"
                    >
                      <ArrowLeft size={14} aria-hidden="true" />
                      <span>Ir a Iniciar Sesión</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleMasterSubmit} className="space-y-3.5">
                  <p className="text-xs text-zinc-300 leading-relaxed mb-1">
                    Permite restablecer la clave inmediatamente sin depender de envíos de email, usando la{" "}
                    <span className="font-semibold text-amber-300">Clave Maestra</span> configurada en las variables seguras de tu servidor.
                  </p>

                  <div>
                    <label
                      htmlFor="masterEmail"
                      className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
                    >
                      Correo del Administrador
                    </label>
                    <input
                      id="masterEmail"
                      type="email"
                      disabled={loadingMaster}
                      value={masterEmail}
                      onChange={(e) => setMasterEmail(e.target.value)}
                      placeholder="admin@aurastudio.com"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 transition-all disabled:opacity-50"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="recoveryKey"
                      className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
                    >
                      Clave Maestra de Rescate
                    </label>
                    <div className="relative">
                      <input
                        id="recoveryKey"
                        type={showKey ? "text" : "password"}
                        disabled={loadingMaster}
                        value={recoveryKey}
                        onChange={(e) => setRecoveryKey(e.target.value)}
                        placeholder="Clave maestra del servidor"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 transition-all disabled:opacity-50 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2.5 top-2.5 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                        aria-label={showKey ? "Ocultar clave" : "Mostrar clave"}
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
                    >
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        disabled={loadingMaster}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400 transition-all disabled:opacity-50 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-2.5 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                        aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {masterError && (
                    <div
                      role="alert"
                      className="p-3 rounded-xl border bg-rose-950/40 border-rose-800 text-rose-300 text-xs font-medium"
                    >
                      {masterError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loadingMaster || !masterEmail.trim() || !recoveryKey.trim() || !newPassword}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-amber-200 text-zinc-950 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm mt-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
                  >
                    {loadingMaster ? (
                      <>
                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        <span>Restableciendo contraseña...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} aria-hidden="true" />
                        <span>Aplicar Nueva Contraseña</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Enlace para volver */}
          {!emailSuccess && !masterSuccess && (
            <div className="text-center pt-4 border-t border-zinc-800/80 mt-5">
              <Link prefetch={false}
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors py-2 px-3 rounded-lg hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <ArrowLeft size={13} aria-hidden="true" />
                <span>Volver al inicio de sesión</span>
              </Link>
            </div>
          )}
        </div>

        {/* Tarjeta de Asistencia WhatsApp */}
        <div className="mt-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center flex flex-col items-center">
          <p className="text-xs text-zinc-400 mb-2.5">
            ¿No recordás tus credenciales ni tenés acceso a la clave maestra?
          </p>
          <a
            href={whatsappHelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 hover:border-zinc-600 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <MessageCircle size={15} className="text-emerald-400" aria-hidden="true" />
            <span>Contactar soporte por WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
