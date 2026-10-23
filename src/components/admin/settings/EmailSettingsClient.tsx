"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FolderPlus,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Loader2,
  Mail,
  Monitor,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import {
  DEFAULT_EMAIL_CUSTOMIZATION,
  EmailCustomizationConfig,
  EmailEventTemplateConfig,
  EmailLayoutConfig,
  interpolateVariables,
} from "../../../domain/email/customization";
import { ShowroomSettings } from "../../../services/settings.service";

interface EmailSettingsClientProps {
  initialSettings: ShowroomSettings;
}

type EmailTab = "general" | "events" | "preview" | "server";

export function EmailSettingsClient({ initialSettings }: EmailSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<EmailTab>("general");

  // Configuración de correos (Layout y Eventos)
  const [customization, setCustomization] = useState<EmailCustomizationConfig>(() => {
    return initialSettings.emailCustomization || DEFAULT_EMAIL_CUSTOMIZATION;
  });

  // Evento actualmente seleccionado en la pestaña de eventos y preview
  const [selectedEventId, setSelectedEventId] = useState<string>("order_created");

  // Modo de previsualización (desktop o mobile)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Estados de guardado
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Estados de conexión con Resend (Servidor)
  const [emailStatus, setEmailStatus] = useState<{
    configured: boolean;
    keyMasked: string | null;
    fromEmail: string;
    orderNotificationsEmail: string | null;
    brandName: string;
  } | null>(null);
  const [testRecipient, setTestRecipient] = useState<string>("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/email/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.email) {
          setEmailStatus(data.email);
          if (data.email.orderNotificationsEmail) {
            setTestRecipient(data.email.orderNotificationsEmail);
          }
        }
      })
      .catch(() => {});
  }, []);

  const storeBrandName =
    initialSettings.showroomName || emailStatus?.brandName || "Aura Studio";

  // Manejo de actualización de layout general
  const updateLayout = (updates: Partial<EmailLayoutConfig>) => {
    setCustomization((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        ...updates,
      },
    }));
  };

  // Manejo de actualización de un evento específico
  const updateEvent = (eventId: string, updates: Partial<EmailEventTemplateConfig>) => {
    setCustomization((prev) => ({
      ...prev,
      events: prev.events.map((evt) => (evt.id === eventId ? { ...evt, ...updates } : evt)),
    }));
  };

  // Agregar evento personalizado
  const handleAddCustomEvent = () => {
    const customId = `custom_${Date.now()}`;
    const newEvent: EmailEventTemplateConfig = {
      id: customId,
      trigger: "custom",
      name: "Evento Personalizado",
      description: "Disparador personalizado configurado por el comercio.",
      enabled: true,
      subject: "Aviso especial de {{nombre_tienda}}",
      headline: "¡Hola {{nombre}}, tenemos una novedad para vos!",
      bodyText:
        "Queríamos compartirte una propuesta pensada especialmente para vos. Escribinos para coordinar cualquier detalle.",
      buttonText: "Ver Más Detalles",
      buttonUrl: "{{link_pedido}}",
      triggerCondition: "Cuando ocurra la condición personalizada definida en el sistema.",
      availableVariables: ["{{nombre}}", "{{nombre_tienda}}", "{{link_pedido}}", "{{whatsapp}}"],
    };

    setCustomization((prev) => ({
      ...prev,
      events: [...prev.events, newEvent],
    }));
    setSelectedEventId(customId);
  };

  // Eliminar evento personalizado
  const handleDeleteCustomEvent = (eventId: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar este evento personalizado?")) return;
    setCustomization((prev) => ({
      ...prev,
      events: prev.events.filter((evt) => evt.id !== eventId),
    }));
    setSelectedEventId("order_created");
  };

  // Carga de logo de correo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("El logo no debe superar los 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateLayout({ logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // Guardar configuración general
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailCustomization: customization,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar la configuración de correos.");
      }

      setFeedback({
        type: "ok",
        text: "¡Configuración de diseño de correos y eventos guardada con éxito!",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error inesperado al guardar.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Enviar correo de prueba en vivo
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

  // Evento activo actual
  const currentEvent =
    customization.events.find((evt) => evt.id === selectedEventId) || customization.events[0];

  // Datos simulados para previsualización realista
  const sampleVariables: Record<string, string> = {
    nombre: "Valentina Rossi",
    codigo_pedido: "#000101",
    nombre_tienda: storeBrandName,
    total: "$45.000",
    link_pedido: "https://tutienda.com/api/orders/101/receipt",
    carrito_url: "https://tutienda.com/carrito",
    catalogo_url: "https://tutienda.com/catalogo",
    producto_url: "https://tutienda.com/p/50",
    whatsapp: initialSettings.whatsappNumber || "+54 9 11 0000-0000",
  };

  const previewSubject = interpolateVariables(currentEvent?.subject || "", sampleVariables);
  const previewHeadline = interpolateVariables(currentEvent?.headline || "", sampleVariables);
  const previewBody = interpolateVariables(currentEvent?.bodyText || "", sampleVariables);

  return (
    <div className="space-y-6 max-w-6xl pb-24">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail size={22} className="text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
              Correos y Notificaciones
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Diseñá el formato visual de tus correos (logo, cabecera y pie repetibles) y personalizá el mensaje para cada evento de compra o retargeting.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-300 transition-colors cursor-pointer disabled:opacity-50 shadow-sm shrink-0"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            feedback.type === "ok"
              ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
              : "bg-rose-950/60 border border-rose-800 text-rose-300"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Selector de Pestañas Superiores */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "general"
              ? "bg-amber-400 text-zinc-950 shadow-xs"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Layers size={14} />
          <span>Diseño General (Cabecera & Pie)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "events"
              ? "bg-amber-400 text-zinc-950 shadow-xs"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Bell size={14} />
          <span>Eventos & Mensajes ({customization.events.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "preview"
              ? "bg-amber-400 text-zinc-950 shadow-xs"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Eye size={14} />
          <span>Vista Previa en Vivo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("server")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "server"
              ? "bg-amber-400 text-zinc-950 shadow-xs"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Send size={14} />
          <span>Servidor & Prueba Resend</span>
        </button>
      </div>

      {/* PESTAÑA 1: DISEÑO GENERAL (FORMATO REPETIBLE) */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tarjeta Logo e Imagen de Marca */}
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <ImageIcon size={18} className="text-amber-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Logo e Imagen de Marca en el Correo
                </h2>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Este logo aparecerá centrado en la parte superior de todos los correos enviados por la tienda.
                </p>

                {customization.layout.logoUrl ? (
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={customization.layout.logoUrl}
                        alt="Logo de correo"
                        className="max-h-12 max-w-[160px] object-contain rounded bg-white/5 p-1"
                      />
                      <span className="text-xs text-zinc-300 font-medium">Logo configurado</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateLayout({ logoUrl: null })}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                      title="Eliminar logo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 text-center space-y-2">
                    <p className="text-xs text-zinc-400">
                      Actualmente se muestra el nombre de la tienda en texto estilizado:{" "}
                      <strong className="text-zinc-200">{storeBrandName}</strong>
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer transition-colors">
                      <Upload size={14} />
                      <span>Subir logo personalizado</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {initialSettings.logoUrl && !customization.layout.logoUrl && (
                  <button
                    type="button"
                    onClick={() => updateLayout({ logoUrl: initialSettings.logoUrl })}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:underline"
                  >
                    <Sparkles size={13} />
                    <span>Usar el logo oficial de la tienda ({initialSettings.showroomName})</span>
                  </button>
                )}
              </div>

              {/* Color de Marca y Botones */}
              <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Color de Acento en Botones y Enlaces
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customization.layout.brandColor || "#1C1917"}
                    onChange={(e) => updateLayout({ brandColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-zinc-700 p-0.5"
                  />
                  <input
                    type="text"
                    value={customization.layout.brandColor || "#1C1917"}
                    onChange={(e) => updateLayout({ brandColor: e.target.value })}
                    placeholder="#1C1917"
                    className="w-28 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-400"
                  />
                  <span
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: customization.layout.brandColor || "#1C1917" }}
                  >
                    Botón de muestra
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta Cabecera Superior y Pie Repetible */}
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Layers size={18} className="text-amber-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Cabecera Superior & Pie Repetible
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Saludo o Eslogan Superior Repetible
                  </label>
                  <input
                    type="text"
                    value={customization.layout.headerGreeting || ""}
                    onChange={(e) => updateLayout({ headerGreeting: e.target.value })}
                    placeholder="Espacio de Moda & Selección Exclusiva"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Aparece en tipografía sutil debajo del logo o nombre en todos los correos.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Texto Institucional de Pie de Página
                  </label>
                  <textarea
                    rows={3}
                    value={customization.layout.footerText || ""}
                    onChange={(e) => updateLayout({ footerText: e.target.value })}
                    placeholder="Si tenés alguna consulta, podés responder a este correo o escribirnos por WhatsApp."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 leading-relaxed"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <span className="text-[11px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Elementos en el Pie de Página:
                  </span>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={customization.layout.showSocialLinks ?? true}
                      onChange={(e) => updateLayout({ showSocialLinks: e.target.checked })}
                      className="rounded border-zinc-700 bg-zinc-950 text-amber-400 focus:ring-amber-400"
                    />
                    <span>Mostrar enlaces a Redes Sociales ({initialSettings.instagramHandle || "@instagram"})</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={customization.layout.showAddress ?? true}
                      onChange={(e) => updateLayout({ showAddress: e.target.checked })}
                      className="rounded border-zinc-700 bg-zinc-950 text-amber-400 focus:ring-amber-400"
                    />
                    <span>Mostrar dirección física del Showroom</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: EVENTOS Y MENSAJES (CONTENIDO VARIABLE) */}
      {activeTab === "events" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Lista de Disparadores */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Eventos Disponibles
              </span>
              <button
                type="button"
                onClick={handleAddCustomEvent}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <Plus size={13} />
                <span>+ Personalizado</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {customization.events.map((evt) => {
                const isSelected = evt.id === selectedEventId;
                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-amber-400/10 border-amber-400 text-zinc-100 shadow-xs"
                        : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate text-zinc-100">{evt.name}</span>
                        {evt.trigger === "custom" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-950 border border-purple-800 text-purple-300">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{evt.triggerCondition}</p>
                    </div>

                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        evt.enabled ? "bg-emerald-400" : "bg-zinc-700"
                      }`}
                      title={evt.enabled ? "Activo" : "Pausado"}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Editor del Evento Seleccionado */}
          <div className="lg:col-span-8 p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
            {currentEvent ? (
              <div className="space-y-4">
                {/* Cabecera del Evento y Toggle Activo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-zinc-100">{currentEvent.name}</h2>
                      {currentEvent.trigger === "custom" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomEvent(currentEvent.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                        >
                          Eliminar evento
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{currentEvent.description}</p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 select-none">
                    <input
                      type="checkbox"
                      checked={currentEvent.enabled}
                      onChange={(e) => updateEvent(currentEvent.id, { enabled: e.target.checked })}
                      className="rounded border-zinc-700 bg-zinc-900 text-amber-400 focus:ring-amber-400"
                    />
                    <span className="text-xs font-semibold text-zinc-200">
                      {currentEvent.enabled ? "Correo Activo" : "Pausado"}
                    </span>
                  </label>
                </div>

                {/* Regla de Disparador / Cuándo se ejecuta */}
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <Clock size={13} />
                    <span>¿Cuándo se dispara este correo?</span>
                  </div>
                  <input
                    type="text"
                    value={currentEvent.triggerCondition}
                    onChange={(e) => updateEvent(currentEvent.id, { triggerCondition: e.target.value })}
                    placeholder="Regla de ejecución (ej. A las 2 horas de abandonar el carrito)"
                    className="w-full bg-transparent border-0 p-0 text-xs text-zinc-300 focus:outline-none focus:ring-0 placeholder:text-zinc-600"
                  />
                </div>

                {/* Asunto del Correo */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Asunto del Correo
                  </label>
                  <input
                    type="text"
                    value={currentEvent.subject}
                    onChange={(e) => updateEvent(currentEvent.id, { subject: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  />

                  {/* Variables disponibles clicables */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-zinc-500 font-semibold mr-1">Insertar variable:</span>
                    {currentEvent.availableVariables.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          updateEvent(currentEvent.id, { subject: `${currentEvent.subject} ${v}` })
                        }
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-amber-300 transition-colors cursor-pointer"
                        title="Haz clic para agregar al asunto"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Título Principal (Headline) */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Título Destacado del Mensaje (Headline)
                  </label>
                  <input
                    type="text"
                    value={currentEvent.headline}
                    onChange={(e) => updateEvent(currentEvent.id, { headline: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                {/* Cuerpo del Mensaje */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Contenido Central del Correo (Cuerpo)
                  </label>
                  <textarea
                    rows={4}
                    value={currentEvent.bodyText}
                    onChange={(e) => updateEvent(currentEvent.id, { bodyText: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 leading-relaxed"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-zinc-500 font-semibold mr-1">Insertar variable en cuerpo:</span>
                    {currentEvent.availableVariables.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          updateEvent(currentEvent.id, { bodyText: `${currentEvent.bodyText} ${v}` })
                        }
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-amber-300 transition-colors cursor-pointer"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botón de Acción Principal (CTA) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Texto del Botón
                    </label>
                    <input
                      type="text"
                      value={currentEvent.buttonText || ""}
                      onChange={(e) => updateEvent(currentEvent.id, { buttonText: e.target.value })}
                      placeholder="Ver mi pedido"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Enlace de Destino
                    </label>
                    <input
                      type="text"
                      value={currentEvent.buttonUrl || ""}
                      onChange={(e) => updateEvent(currentEvent.id, { buttonUrl: e.target.value })}
                      placeholder="{{link_pedido}}"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 text-center py-8">
                Seleccioná un evento de la lista para editar su contenido.
              </p>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: VISTA PREVIA EN VIVO */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          {/* Controles de Vista Previa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-300">Previsualizando evento:</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400"
              >
                {customization.events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name} {!evt.enabled ? "(Pausado)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector Desktop / Mobile */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  previewDevice === "desktop"
                    ? "bg-amber-400 text-zinc-950 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Monitor size={14} />
                <span>Escritorio</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  previewDevice === "mobile"
                    ? "bg-amber-400 text-zinc-950 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Smartphone size={14} />
                <span>Móvil</span>
              </button>
            </div>
          </div>

          {/* Asunto Simulado en Bandeja de Entrada */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <span className="font-semibold text-zinc-300">De:</span>
              <span>
                {storeBrandName} &lt;{emailStatus?.fromEmail?.includes("<") ? emailStatus.fromEmail.replace(/.*</, "").replace(/>.*/, "") : (emailStatus?.fromEmail || "pedidos@tudominio.com")}&gt;
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-300">Asunto:</span>
              <span className="text-zinc-100 font-medium">{previewSubject}</span>
            </div>
          </div>

          {/* Mockup del Email Renderizado */}
          <div className="flex justify-center p-4 sm:p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800 min-h-[500px]">
            <div
              className={`w-full transition-all duration-300 ${
                previewDevice === "mobile" ? "max-w-sm" : "max-w-xl"
              } bg-white text-stone-900 rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xl`}
            >
              {/* Header Repetible */}
              <div className="text-center pb-6 border-b border-stone-100">
                {customization.layout.logoUrl ? (
                  <img
                    src={customization.layout.logoUrl}
                    alt={storeBrandName}
                    className="max-h-12 max-w-[200px] object-contain mx-auto mb-2"
                  />
                ) : (
                  <h2 className="text-xl font-bold tracking-widest uppercase text-stone-900 mb-1">
                    {storeBrandName}
                  </h2>
                )}
                {customization.layout.headerGreeting && (
                  <p className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                    {customization.layout.headerGreeting}
                  </p>
                )}
              </div>

              {/* Contenido Central del Evento */}
              <div className="py-6 space-y-4">
                <h3 className="text-lg font-bold text-stone-900 leading-snug">
                  {previewHeadline}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {previewBody}
                </p>

                {/* Muestra de Tabla para Eventos de Pedido */}
                {(currentEvent.trigger === "order_created" ||
                  currentEvent.trigger === "order_paid" ||
                  currentEvent.trigger === "order_shipped" ||
                  currentEvent.trigger === "order_delivered") && (
                  <div className="pt-2">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-500 text-[10px] uppercase">
                          <th className="text-left py-2">Prenda</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-stone-100">
                          <td className="py-2.5">
                            <span className="font-semibold text-stone-800 block">Vestido Lino Arena</span>
                            <span className="text-[11px] text-stone-500">Color: Arena · Talle: M · Cantidad: 1</span>
                          </td>
                          <td className="text-right font-semibold text-stone-800">$45.000</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-3 pt-3 border-t border-stone-200 text-xs flex justify-between font-bold text-stone-900">
                      <span>Total:</span>
                      <span>$45.000</span>
                    </div>
                  </div>
                )}

                {/* Botón CTA con color de marca */}
                {currentEvent.buttonText && (
                  <div className="pt-4 text-center">
                    <span
                      className="inline-block px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-sm cursor-pointer"
                      style={{
                        backgroundColor: customization.layout.brandColor || "#1C1917",
                      }}
                    >
                      {currentEvent.buttonText}
                    </span>
                  </div>
                )}
              </div>

              {/* Pie de Página Repetible */}
              <div className="pt-6 border-t border-stone-100 text-center text-xs text-stone-500 space-y-2">
                {customization.layout.footerText && (
                  <p className="text-[11px] leading-relaxed text-stone-600">
                    {customization.layout.footerText}
                  </p>
                )}

                {customization.layout.showAddress && initialSettings.address && (
                  <p className="text-[11px] text-stone-400">
                    {initialSettings.address}
                  </p>
                )}

                {customization.layout.showSocialLinks && (
                  <div className="flex items-center justify-center gap-3 pt-1 text-[11px] font-semibold text-stone-700">
                    {initialSettings.instagramHandle && <span>Instagram: {initialSettings.instagramHandle}</span>}
                    {initialSettings.whatsappNumber && <span>WhatsApp: {initialSettings.whatsappNumber}</span>}
                  </div>
                )}

                <p className="text-[10px] text-stone-400 pt-2">
                  © {new Date().getFullYear()} {storeBrandName}. Todos los derechos reservados.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: SERVIDOR & PRUEBA RESEND */}
      {activeTab === "server" && (
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-amber-300" />
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Estado del Servidor de Correo (Resend)
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Diagnóstico en tiempo real y prueba de entrega directa a tu bandeja de entrada.
                </p>
              </div>
            </div>

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Remitente de Salida (FROM)
              </span>
              <p className="text-zinc-200 font-mono text-[11px] break-all">
                {emailStatus?.fromEmail || `${storeBrandName} <onboarding@resend.dev>`}
              </p>
              <p className="text-[10px] text-zinc-500 pt-1">
                Resuelto automáticamente con el nombre de la tienda: <strong>{storeBrandName}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Clave API de Resend
              </span>
              <p className="text-zinc-200 font-mono text-[11px]">
                {emailStatus?.keyMasked || "No detectada en variables de entorno"}
              </p>
              <p className="text-[10px] text-zinc-500 pt-1">
                Gestionada como secreto rotativo en el servidor (RESEND_API_KEY).
              </p>
            </div>
          </div>

          {/* Formulario de Correo de Prueba */}
          <form onSubmit={handleSendTestEmail} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <label htmlFor="emailTestInput" className="text-xs font-semibold text-zinc-300 block">
              Enviar correo de prueba con la plantilla actual:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="emailTestInput"
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="tu-email@gmail.com"
                disabled={sendingTest || !emailStatus?.configured}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
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
      )}
    </div>
  );
}

