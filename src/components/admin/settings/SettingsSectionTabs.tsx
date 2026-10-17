"use client";

import {
  LayoutTemplate,
  MapPin,
  PanelTop,
  Settings2,
  LucideIcon,
} from "lucide-react";

export type SettingsTabId = "top" | "main" | "footer" | "general";

export interface SettingsTabItem {
  id: SettingsTabId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const SETTINGS_TABS: SettingsTabItem[] = [
  {
    id: "top",
    label: "Identidad y Negocio",
    shortLabel: "Identidad",
    description: "Nombre, logo, rubro y datos fiscales",
    icon: PanelTop,
  },
  {
    id: "main",
    label: "Portada y Apariencia",
    shortLabel: "Portada",
    description: "Banners y paleta con contraste AA",
    icon: LayoutTemplate,
  },
  {
    id: "footer",
    label: "Contacto y Redes",
    shortLabel: "Contacto",
    description: "WhatsApp, showroom y redes sociales",
    icon: MapPin,
  },
  {
    id: "general",
    label: "Ventas y Políticas",
    shortLabel: "Ventas",
    description: "Tiempos de reserva, envíos y legales",
    icon: Settings2,
  },
];

interface SettingsSectionTabsProps {
  activeTab: SettingsTabId;
  onSelectTab: (tab: SettingsTabId) => void;
}

export function SettingsSectionTabs({
  activeTab,
  onSelectTab,
}: SettingsSectionTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Secciones de configuración de la tienda"
      className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800"
    >
      {SETTINGS_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`settings-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`settings-panel-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              isActive
                ? "bg-amber-200 text-zinc-950 shadow-sm"
                : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/70"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Icon
                size={15}
                className={isActive ? "text-zinc-950" : "text-amber-300"}
                aria-hidden="true"
              />
              <span className="text-xs font-bold tracking-tight">{tab.label}</span>
            </div>
            <span
              className={`text-[10px] leading-tight line-clamp-1 ${
                isActive ? "text-zinc-800 font-medium" : "text-zinc-400"
              }`}
            >
              {tab.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

