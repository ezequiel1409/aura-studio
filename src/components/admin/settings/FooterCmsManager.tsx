"use client";

import { CheckCircle2, CreditCard, LayoutTemplate, XCircle } from "lucide-react";
import { FooterConfig } from "../../../services/settings.service";

interface FooterCmsManagerProps {
  footerConfig: FooterConfig;
  onChange: (val: FooterConfig) => void;
  mercadopagoEnabled?: boolean;
  transferEnabled?: boolean;
  cashEnabled?: boolean;
}

export function FooterCmsManager({
  footerConfig,
  onChange,
  mercadopagoEnabled = false,
  transferEnabled = true,
  cashEnabled = true,
}: FooterCmsManagerProps) {
  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300">
          <LayoutTemplate size={16} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-100">
            Estructura y Secciones del Pie de Página (Footer CMS)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Personalizá los títulos, visibilidad de columnas y enlaces del pie de página de la tienda online.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Columna 2: Colecciones */}
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">Columna Colecciones</span>
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={footerConfig.sections.collections.enabled}
                onChange={(e) =>
                  onChange({
                    ...footerConfig,
                    sections: {
                      ...footerConfig.sections,
                      collections: {
                        ...footerConfig.sections.collections,
                        enabled: e.target.checked,
                      },
                    },
                  })
                }
                className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
              />
              <span>Visible</span>
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Título principal</label>
            <input
              type="text"
              value={footerConfig.sections.collections.title}
              onChange={(e) =>
                onChange({
                  ...footerConfig,
                  sections: {
                    ...footerConfig.sections,
                    collections: {
                      ...footerConfig.sections.collections,
                      title: e.target.value,
                    },
                  },
                })
              }
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Subtítulo superior</label>
            <input
              type="text"
              value={footerConfig.sections.collections.subtitle}
              onChange={(e) =>
                onChange({
                  ...footerConfig,
                  sections: {
                    ...footerConfig.sections,
                    collections: {
                      ...footerConfig.sections.collections,
                      subtitle: e.target.value,
                    },
                  },
                })
              }
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={footerConfig.sections.collections.showAllCatalogLink}
              onChange={(e) =>
                onChange({
                  ...footerConfig,
                  sections: {
                    ...footerConfig.sections,
                    collections: {
                      ...footerConfig.sections.collections,
                      showAllCatalogLink: e.target.checked,
                    },
                  },
                })
              }
              className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
            />
            <span>Mostrar enlace &ldquo;Ver todo el catálogo&rdquo;</span>
          </label>
        </div>

        {/* Columna 3: Ayuda al Cliente */}
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">Columna Ayuda al Cliente</span>
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={footerConfig.sections.help.enabled}
                onChange={(e) =>
                  onChange({
                    ...footerConfig,
                    sections: {
                      ...footerConfig.sections,
                      help: {
                        ...footerConfig.sections.help,
                        enabled: e.target.checked,
                      },
                    },
                  })
                }
                className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
              />
              <span>Visible</span>
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Título principal</label>
            <input
              type="text"
              value={footerConfig.sections.help.title}
              onChange={(e) =>
                onChange({
                  ...footerConfig,
                  sections: {
                    ...footerConfig.sections,
                    help: {
                      ...footerConfig.sections.help,
                      title: e.target.value,
                    },
                  },
                })
              }
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Subtítulo superior</label>
            <input
              type="text"
              value={footerConfig.sections.help.subtitle}
              onChange={(e) =>
                onChange({
                  ...footerConfig,
                  sections: {
                    ...footerConfig.sections,
                    help: {
                      ...footerConfig.sections.help,
                      subtitle: e.target.value,
                    },
                  },
                })
              }
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="block text-[11px] font-medium text-zinc-400">Enlaces activos:</span>
            {footerConfig.sections.help.links.map((link, idx) => (
              <label key={link.id} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={link.enabled}
                  onChange={(e) => {
                    const updatedLinks = [...footerConfig.sections.help.links];
                    updatedLinks[idx] = { ...link, enabled: e.target.checked };
                    onChange({
                      ...footerConfig,
                      sections: {
                        ...footerConfig.sections,
                        help: {
                          ...footerConfig.sections.help,
                          links: updatedLinks,
                        },
                      },
                    });
                  }}
                  className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
                />
                <span>{link.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Columna 4: Local, Retiro y Medios de Pago Dinámicos */}
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">Columna Local & Horarios</span>
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={footerConfig.sections.location.enabled}
                onChange={(e) =>
                  onChange({
                    ...footerConfig,
                    sections: {
                      ...footerConfig.sections,
                      location: {
                        ...footerConfig.sections.location,
                        enabled: e.target.checked,
                      },
                    },
                  })
                }
                className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
              />
              <span>Visible</span>
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Título principal</label>
            <input
              type="text"
              value={footerConfig.sections.location.title}
              onChange={(e) =>
                onChange({
                  ...footerConfig,
                  sections: {
                    ...footerConfig.sections,
                    location: {
                      ...footerConfig.sections.location,
                      title: e.target.value,
                    },
                  },
                })
              }
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Bloque de Medios de Pago Dinámicos */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CreditCard size={13} className="text-amber-400" />
                <span className="text-xs font-semibold text-zinc-200">Medios de Pago</span>
              </div>
              <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerConfig.sections.payments.enabled}
                  onChange={(e) =>
                    onChange({
                      ...footerConfig,
                      sections: {
                        ...footerConfig.sections,
                        payments: {
                          ...footerConfig.sections.payments,
                          enabled: e.target.checked,
                        },
                      },
                    })
                  }
                  className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
                />
                <span>Mostrar</span>
              </label>
            </div>

            {/* Sincronización automática de pasarelas activas */}
            <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] space-y-1.5">
              <span className="text-zinc-400 block font-medium">Pasarelas sincronizadas de la tienda:</span>
              <div className="flex flex-wrap gap-1.5">
                {mercadopagoEnabled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-950/50 border border-sky-800/60 text-sky-300 text-[10px] font-semibold">
                    <CheckCircle2 size={11} />
                    <span>Mercado Pago</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700 text-zinc-500 text-[10px]">
                    <XCircle size={11} />
                    <span>Mercado Pago (inactivo)</span>
                  </span>
                )}

                {transferEnabled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-[10px] font-semibold">
                    <CheckCircle2 size={11} />
                    <span>Transferencia</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700 text-zinc-500 text-[10px]">
                    <XCircle size={11} />
                    <span>Transferencia (inactiva)</span>
                  </span>
                )}

                {cashEnabled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-[10px] font-semibold">
                    <CheckCircle2 size={11} />
                    <span>Efectivo</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700 text-zinc-500 text-[10px]">
                    <XCircle size={11} />
                    <span>Efectivo (inactivo)</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 pt-0.5">
                Se muestran automáticamente en el footer solo los medios que tengas activos en Medios de Pago.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                Aclaración adicional o promociones (opcional):
              </label>
              <input
                type="text"
                placeholder="Ej: Cuotas sin interés y descuentos por transferencia"
                value={footerConfig.sections.payments.text}
                onChange={(e) =>
                  onChange({
                    ...footerConfig,
                    sections: {
                      ...footerConfig.sections,
                      payments: {
                        ...footerConfig.sections.payments,
                        text: e.target.value,
                      },
                    },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

