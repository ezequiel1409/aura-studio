"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderTree,
  KeyRound,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

interface GeneralSystemSettingsSectionProps {
  reservationHours: number;
  onReservationHoursChange: (val: number) => void;
}

interface EmailStatusData {
  provider: string;
  configured: boolean;
  keyMasked: string;
  fromEmail: string;
  orderNotificationsEmail?: string;
}

export function GeneralSystemSettingsSection({
  reservationHours,
  onReservationHoursChange,
}: GeneralSystemSettingsSectionProps) {
  // Estado de conexión del servidor de correo
  const [emailStatus, setEmailStatus] = useState<EmailStatusData | null>(null);
  const [recoveryKeyConfigured, setRecoveryKeyConfigured] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);

  // Envío de correo de prueba
  const [testRecipient, setTestRecipient] = useState<string>("");
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [testFeedback, setTestFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/email/status")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.ok) {
          setEmailStatus(data.email);
          setRecoveryKeyConfigured(Boolean(data.security?.recoveryKeyConfigured));
          if (data.email?.orderNotificationsEmail) {
            setTestRecipient(data.email.orderNotificationsEmail);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingStatus(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim() || sendingTest) return;

    setSendingTest(true);
    setTestFeedback(null);

    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: testRecipient.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setTestFeedback({
          ok: false,
          text: data.error || "No se pudo enviar el correo de prueba.",
        });
        return;
      }

      setTestFeedback({
        ok: true,
        text: data.message || `¡Correo de prueba enviado correctamente a ${testRecipient}!`,
      });
    } catch {
      setTestFeedback({
        ok: false,
        text: "Error de red al intentar enviar el correo de prueba.",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const isResendSandbox = emailStatus?.fromEmail?.includes("onboarding@resend.dev");

  return (
    <div
      id="settings-panel-general"
      role="tabpanel"
      aria-labelledby="settings-tab-general"
      className="space-y-5"
    >
      {/* Bloque 1: Reglas Operativas del Catálogo */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-300" aria-hidden="true" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Reglas de Reserva e Inventario
            </h2>
            <p className="text-[11px] text-zinc-400">
              Configurá el tiempo predeterminado cuando marcás una prenda como reservada.
            </p>
          </div>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <label htmlFor="reservationHoursInput" className="text-xs font-medium text-zinc-300">
            Duración de Reserva Temporal (en horas)
          </label>
          <input
            id="reservationHoursInput"
            type="number"
            min={1}
            max={720}
            value={reservationHours}
            onChange={(e) =>
              onReservationHoursChange(Math.max(1, parseInt(e.target.value, 10) || 48))
            }
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
          />
          <p className="text-[11px] text-zinc-500">
            Valor por defecto: 48 horas. Al cumplirse el plazo, la prenda vuelve a estar
            Disponible automáticamente.
          </p>
        </div>
      </div>

      {/* Bloque 2: Servicio de Correos Transaccionales (Resend) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-amber-300" aria-hidden="true" />
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Correos Transaccionales & Resend
              </h2>
              <p className="text-[11px] text-zinc-400">
                Avisos de compra, confirmación de pago, orden despachada y recupero de clave.
              </p>
            </div>
          </div>

          {!loadingStatus && (
            <div>
              {emailStatus?.configured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                  <CheckCircle2 size={13} />
                  <span>Resend Conectado</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/60 border border-amber-800 text-amber-300">
                  <AlertCircle size={13} />
                  <span>Sin API Key (Modo Simulación)</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Diagnóstico del Servidor (Sin exponer secretos al cliente) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Remitente de Salida (FROM)
            </span>
            <p className="text-zinc-200 font-mono text-[11px] break-all">
              {emailStatus?.fromEmail || "Aura Studio <onboarding@resend.dev>"}
            </p>
            {isResendSandbox && (
              <p className="text-[10px] text-amber-400/90 pt-1 leading-relaxed">
                Dominio sandbox de Resend activo. Solo permite enviar al correo titular de tu cuenta en Resend.
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Notificaciones de Ventas al Admin
            </span>
            <p className="text-zinc-200 font-mono text-[11px] break-all">
              {emailStatus?.orderNotificationsEmail || "No configurado (ORDER_NOTIFICATIONS_EMAIL)"}
            </p>
            <p className="text-[10px] text-zinc-500 pt-1">
              Recibe avisos automáticos cada vez que un cliente confirma un pedido.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Clave de API Resend (Servidor)
            </span>
            <p className="text-zinc-200 font-mono text-[11px]">
              {emailStatus?.keyMasked || "No detectada en variables de entorno"}
            </p>
            <p className="text-[10px] text-zinc-500 pt-1">
              Gestionada como secreto rotativo en el servidor (RESEND_API_KEY).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Clave Maestra de Rescate Offline
            </span>
            <div className="flex items-center gap-1.5">
              <KeyRound size={13} className={recoveryKeyConfigured ? "text-emerald-400" : "text-amber-400"} />
              <p className="text-zinc-200 text-[11px] font-semibold">
                {recoveryKeyConfigured ? "Configurada y activa" : "Sin configurar (ADMIN_RECOVERY_KEY)"}
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 pt-1">
              Permite restablecer la contraseña en <code>/admin/recuperar</code> sin requerir email.
            </p>
          </div>
        </div>

        {/* Formulario para Enviar Correo de Prueba */}
        <div className="pt-2">
          <form onSubmit={handleSendTestEmail} className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800 space-y-3">
            <div>
              <label htmlFor="testRecipientInput" className="text-xs font-semibold text-zinc-300 block mb-1">
                Probar envío de correo en vivo:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="testRecipientInput"
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="tu-email@ejemplo.com"
                  disabled={sendingTest || !emailStatus?.configured}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400 disabled:opacity-50"
                  required
                />
                <button
                  type="submit"
                  disabled={sendingTest || !testRecipient.trim() || !emailStatus?.configured}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-200 text-zinc-950 font-bold text-xs hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
                >
                  {sendingTest ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Enviar Prueba</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {testFeedback && (
              <div
                role="alert"
                className={`p-3 rounded-lg text-xs leading-relaxed ${
                  testFeedback.ok
                    ? "bg-emerald-950/50 border border-emerald-800 text-emerald-300"
                    : "bg-rose-950/50 border border-rose-800 text-rose-300"
                }`}
              >
                {testFeedback.text}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Bloque 3: Accesos a Módulos de Sistema (Equipo y Categorías) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Administración de Equipo y Estructura
          </h2>
          <p className="text-[11px] text-zinc-400 mt-1">
            Gestioná los permisos de tu equipo de trabajo y la jerarquía de categorías del
            catálogo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link prefetch={false}
            href="/admin/usuarios"
            className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-amber-400/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-300">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-100">Equipo y Administradoras</p>
                <p className="text-[11px] text-zinc-400">Crear cuentas y gestionar accesos</p>
              </div>
            </div>
            <ArrowRight
              size={15}
              className="text-zinc-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all"
            />
          </Link>

          <Link prefetch={false}
            href="/admin/categorias"
            className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-amber-400/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-200">
                <FolderTree size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-100">Árbol de Categorías</p>
                <p className="text-[11px] text-zinc-400">Ordenar rubros y subcategorías</p>
              </div>
            </div>
            <ArrowRight
              size={15}
              className="text-zinc-500 group-hover:text-amber-200 group-hover:translate-x-0.5 transition-all"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
