"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Save, Link2, Bold, Heading, List, Eye, Edit3, Sparkles, ExternalLink } from "lucide-react";
import {
  AnnouncementBarConfig,
  CatalogConfig,
  DEFAULT_ANNOUNCEMENT_BAR,
  DEFAULT_CATALOG_CONFIG,
  DEFAULT_HOME_BLOCKS,
  DEFAULT_SUGGESTED_TERMS,
  HeroMode,
  HomeBlocksConfig,
  ShowroomSettings,
} from "../../services/settings.service";
import {
  DEFAULT_STORE_LOCATION,
  DEFAULT_STORE_SCHEDULE,
  StoreLocationConfig,
  StoreScheduleConfig,
} from "../../lib/schedule/store-schedule";
import { THEME_PALETTES } from "../../lib/theme/palettes";
import { TermsContentRenderer } from "../legal/TermsContentRenderer";
export type SettingsTabId = "top" | "main" | "footer" | "payments" | "general" | "politicas";
import { TopHeaderSettingsSection } from "./settings/TopHeaderSettingsSection";
import { MainContentSettingsSection } from "./settings/MainContentSettingsSection";
import { FooterSettingsSection } from "./settings/FooterSettingsSection";

import { PaymentsSettingsSection } from "./settings/PaymentsSettingsSection";

interface SettingsClientProps {
  initialSettings: Omit<
    ShowroomSettings,
    "announcementBar" | "homeBlocks" | "catalogConfig" | "storeLocation" | "storeSchedule"
  > &
    Partial<
      Pick<
        ShowroomSettings,
        "announcementBar" | "homeBlocks" | "catalogConfig" | "storeLocation" | "storeSchedule"
      >
    >;
  initialTab?: SettingsTabId;
}

const VALID_TABS: SettingsTabId[] = ["top", "main", "footer", "payments", "general", "politicas"];

export function SettingsClient({
  initialSettings,
  initialTab = "politicas",
}: SettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => {
    const param = searchParams?.get("seccion") as SettingsTabId | null;
    if (param === "general") return "politicas";
    return param && VALID_TABS.includes(param) ? param : initialTab;
  });

  useEffect(() => {
    const param = searchParams?.get("seccion") as SettingsTabId | null;
    if (param === "general") {
      setActiveTab("politicas");
    } else if (param && VALID_TABS.includes(param)) {
      setActiveTab(param);
    }
  }, [searchParams]);

  // 1. Parte Superior (Cabecera y Marca)
  const [showroomName, setShowroomName] = useState(initialSettings.showroomName);
  const [storeType, setStoreType] = useState(initialSettings.storeType || "Showroom");
  const [logoUrl, setLogoUrl] = useState<string>(initialSettings.logoUrl || "");

  // 2. Contenido Principal (Portada Hero, Vidriera, Catálogo y Paleta de Colores)
  const [heroMode, setHeroMode] = useState<HeroMode>(
    initialSettings.heroMode || "featured_carousel"
  );
  const [heroTitle, setHeroTitle] = useState<string>(initialSettings.heroTitle || "");
  const [heroSubtitle, setHeroSubtitle] = useState<string>(initialSettings.heroSubtitle || "");
  const [heroBannerUrl, setHeroBannerUrl] = useState<string>(initialSettings.heroBannerUrl || "");
  const [themePalette, setThemePalette] = useState<string>(
    initialSettings.themePalette || "lino"
  );
  const [themePrimaryColor, setThemePrimaryColor] = useState<string>(
    initialSettings.themePrimaryColor ||
      THEME_PALETTES[initialSettings.themePalette || "lino"]?.accent ||
      "#926a3c"
  );
  const [themeFont, setThemeFont] = useState<string>(
    initialSettings.themeFont || "cormorant"
  );
  const [announcementBar, setAnnouncementBar] = useState<AnnouncementBarConfig>(
    initialSettings.announcementBar || DEFAULT_ANNOUNCEMENT_BAR
  );
  const [homeBlocks, setHomeBlocks] = useState<HomeBlocksConfig>(
    initialSettings.homeBlocks || DEFAULT_HOME_BLOCKS
  );
  const [catalogConfig, setCatalogConfig] = useState<CatalogConfig>(
    initialSettings.catalogConfig || DEFAULT_CATALOG_CONFIG
  );

  // 3. Pie de Página (Contacto, Redes, Dirección, Horarios y AFIP)
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber);
  const [instagramHandle, setInstagramHandle] = useState<string>(
    initialSettings.instagramHandle || ""
  );
  const [tiktokHandle, setTiktokHandle] = useState<string>(initialSettings.tiktokHandle || "");
  const [address, setAddress] = useState<string>(initialSettings.address || "");
  const [dataFiscalUrl, setDataFiscalUrl] = useState<string>(initialSettings.dataFiscalUrl || "");
  const [storeLocation, setStoreLocation] = useState<StoreLocationConfig>(
    initialSettings.storeLocation || DEFAULT_STORE_LOCATION
  );
  const [storeSchedule, setStoreSchedule] = useState<StoreScheduleConfig>(
    initialSettings.storeSchedule || DEFAULT_STORE_SCHEDULE
  );

  // 4. Configuraciones Generales
  const [reservationHours, setReservationHours] = useState<number>(
    initialSettings.reservationHours || 48
  );
  const [customTermsText, setCustomTermsText] = useState<string>(
    initialSettings.customTermsText || ""
  );
  const [termsViewMode, setTermsViewMode] = useState<"edit" | "preview">("edit");

  // 5. Métodos de Pago (BR-47)
  const [mercadopagoEnabled, setMercadopagoEnabled] = useState<boolean>(
    initialSettings.mercadopagoEnabled ?? false
  );
  const [transferEnabled, setTransferEnabled] = useState<boolean>(
    initialSettings.transferEnabled ?? true
  );
  const [transferBankName, setTransferBankName] = useState<string>(
    initialSettings.transferBankName || ""
  );
  const [transferAccountHolder, setTransferAccountHolder] = useState<string>(
    initialSettings.transferAccountHolder || ""
  );
  const [transferCbu, setTransferCbu] = useState<string>(
    initialSettings.transferCbu || ""
  );
  const [transferAlias, setTransferAlias] = useState<string>(
    initialSettings.transferAlias || ""
  );
  const [transferCuit, setTransferCuit] = useState<string>(
    initialSettings.transferCuit || ""
  );
  const [transferDiscountPercent, setTransferDiscountPercent] = useState<number>(
    initialSettings.transferDiscountPercent ?? 10
  );
  const [cashEnabled, setCashEnabled] = useState<boolean>(
    initialSettings.cashEnabled ?? true
  );
  const [cashNotes, setCashNotes] = useState<string>(
    initialSettings.cashNotes || ""
  );
  const [whatsappPaymentEnabled, setWhatsappPaymentEnabled] = useState<boolean>(
    initialSettings.whatsappPaymentEnabled ?? true
  );

  const [saving, setSaving] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSelectPreset = (paletteId: string) => {
    setThemePalette(paletteId);
    if (THEME_PALETTES[paletteId]) {
      setThemePrimaryColor(THEME_PALETTES[paletteId].accent);
    }
  };

  const handleCustomColorChange = (hex: string) => {
    setThemePrimaryColor(hex);
    setThemePalette("custom");
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor, seleccioná un archivo de imagen válido (preferentemente PNG).");
      return;
    }

    setReadingFile(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoUrl(result);
      setReadingFile(false);
    };
    reader.onerror = () => {
      setErrorMessage("Error al leer el archivo de logotipo.");
      setReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: whatsappNumber.trim(),
          showroomName: showroomName.trim(),
          storeType: storeType.trim(),
          logoUrl: logoUrl.trim(),
          instagramHandle: instagramHandle.trim(),
          tiktokHandle: tiktokHandle.trim(),
          address: address.trim(),
          dataFiscalUrl: dataFiscalUrl.trim(),
          reservationHours,
          customTermsText: customTermsText.trim() || null,
          heroMode,
          heroTitle: heroTitle.trim(),
          heroSubtitle: heroSubtitle.trim(),
          heroBannerUrl: heroBannerUrl.trim(),
          themePalette,
          themePrimaryColor: themePrimaryColor.trim(),
          themeFont,
          mercadopagoEnabled,
          transferEnabled,
          transferBankName: transferBankName.trim(),
          transferAccountHolder: transferAccountHolder.trim(),
          transferCbu: transferCbu.trim(),
          transferAlias: transferAlias.trim(),
          transferCuit: transferCuit.trim(),
          transferDiscountPercent,
          cashEnabled,
          cashNotes: cashNotes.trim(),
          whatsappPaymentEnabled,
          announcementBar,
          homeBlocks,
          catalogConfig,
          storeLocation,
          storeSchedule,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar la configuración.");
      }

      setSavedSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges =
    showroomName !== initialSettings.showroomName ||
    storeType !== (initialSettings.storeType || "Showroom") ||
    logoUrl !== (initialSettings.logoUrl || "") ||
    heroMode !== (initialSettings.heroMode || "featured_carousel") ||
    heroTitle !== (initialSettings.heroTitle || "") ||
    heroSubtitle !== (initialSettings.heroSubtitle || "") ||
    heroBannerUrl !== (initialSettings.heroBannerUrl || "") ||
    themePalette !== (initialSettings.themePalette || "lino") ||
    themePrimaryColor !==
      (initialSettings.themePrimaryColor ||
        THEME_PALETTES[initialSettings.themePalette || "lino"]?.accent ||
        "#926a3c") ||
    themeFont !== (initialSettings.themeFont || "cormorant") ||
    whatsappNumber !== initialSettings.whatsappNumber ||
    instagramHandle !== (initialSettings.instagramHandle || "") ||
    tiktokHandle !== (initialSettings.tiktokHandle || "") ||
    address !== (initialSettings.address || "") ||
    dataFiscalUrl !== (initialSettings.dataFiscalUrl || "") ||
    reservationHours !== (initialSettings.reservationHours || 48) ||
    mercadopagoEnabled !== (initialSettings.mercadopagoEnabled ?? false) ||
    transferEnabled !== (initialSettings.transferEnabled ?? true) ||
    transferBankName !== (initialSettings.transferBankName || "") ||
    transferAccountHolder !== (initialSettings.transferAccountHolder || "") ||
    transferCbu !== (initialSettings.transferCbu || "") ||
    transferAlias !== (initialSettings.transferAlias || "") ||
    transferCuit !== (initialSettings.transferCuit || "") ||
    transferDiscountPercent !== (initialSettings.transferDiscountPercent ?? 10) ||
    cashEnabled !== (initialSettings.cashEnabled ?? true) ||
    cashNotes !== (initialSettings.cashNotes || "") ||
    whatsappPaymentEnabled !== (initialSettings.whatsappPaymentEnabled ?? true) ||
    JSON.stringify(announcementBar) !==
      JSON.stringify(initialSettings.announcementBar || DEFAULT_ANNOUNCEMENT_BAR) ||
    JSON.stringify(homeBlocks) !==
      JSON.stringify(initialSettings.homeBlocks || DEFAULT_HOME_BLOCKS) ||
    JSON.stringify(catalogConfig) !==
      JSON.stringify(initialSettings.catalogConfig || DEFAULT_CATALOG_CONFIG) ||
    JSON.stringify(storeLocation) !==
      JSON.stringify(initialSettings.storeLocation || DEFAULT_STORE_LOCATION) ||
    JSON.stringify(storeSchedule) !==
      JSON.stringify(initialSettings.storeSchedule || DEFAULT_STORE_SCHEDULE);

  const handleDiscardChanges = () => {
    setShowroomName(initialSettings.showroomName);
    setStoreType(initialSettings.storeType || "Showroom");
    logoUrl !== (initialSettings.logoUrl || "") && setLogoUrl(initialSettings.logoUrl || "");
    setHeroMode(initialSettings.heroMode || "featured_carousel");
    setHeroTitle(initialSettings.heroTitle || "");
    setHeroSubtitle(initialSettings.heroSubtitle || "");
    setHeroBannerUrl(initialSettings.heroBannerUrl || "");
    setThemePalette(initialSettings.themePalette || "lino");
    setThemePrimaryColor(
      initialSettings.themePrimaryColor ||
        THEME_PALETTES[initialSettings.themePalette || "lino"]?.accent ||
        "#926a3c"
    );
    setThemeFont(initialSettings.themeFont || "cormorant");
    setAnnouncementBar(initialSettings.announcementBar || DEFAULT_ANNOUNCEMENT_BAR);
    setHomeBlocks(initialSettings.homeBlocks || DEFAULT_HOME_BLOCKS);
    setCatalogConfig(initialSettings.catalogConfig || DEFAULT_CATALOG_CONFIG);
    setWhatsappNumber(initialSettings.whatsappNumber);
    setInstagramHandle(initialSettings.instagramHandle || "");
    setTiktokHandle(initialSettings.tiktokHandle || "");
    setAddress(initialSettings.address || "");
    setDataFiscalUrl(initialSettings.dataFiscalUrl || "");
    setStoreLocation(initialSettings.storeLocation || DEFAULT_STORE_LOCATION);
    setStoreSchedule(initialSettings.storeSchedule || DEFAULT_STORE_SCHEDULE);
    setReservationHours(initialSettings.reservationHours || 48);
    setMercadopagoEnabled(initialSettings.mercadopagoEnabled ?? false);
    setTransferEnabled(initialSettings.transferEnabled ?? true);
    setTransferBankName(initialSettings.transferBankName || "");
    setTransferAccountHolder(initialSettings.transferAccountHolder || "");
    setTransferCbu(initialSettings.transferCbu || "");
    setTransferAlias(initialSettings.transferAlias || "");
    setTransferCuit(initialSettings.transferCuit || "");
    setTransferDiscountPercent(initialSettings.transferDiscountPercent ?? 10);
    setCashEnabled(initialSettings.cashEnabled ?? true);
    setCashNotes(initialSettings.cashNotes || "");
    setWhatsappPaymentEnabled(initialSettings.whatsappPaymentEnabled ?? true);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Cabecera Limpia sin tarjetas redundantes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
            {activeTab === "top"
              ? "Identidad y Negocio"
              : activeTab === "main"
              ? "Portada y Apariencia"
              : activeTab === "footer"
              ? "Contacto, Showroom y Redes"
              : activeTab === "payments"
              ? "Medios de Pago"
              : activeTab === "politicas"
              ? "Políticas de Tienda y Términos"
              : "Reservas, Inventario y Políticas"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {activeTab === "general"
              ? "Ajustes de tiempo de reserva para carritos y stock del sistema."
              : activeTab === "politicas"
              ? "Términos y condiciones legales, políticas de cambios y plazos de devolución."
              : "Configuración específica de la tienda."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-300 transition-colors cursor-pointer disabled:opacity-50 shadow-sm shrink-0"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
        </button>
      </div>

      {/* Formulario Modular (5 secciones pre-montadas para cambio de pestaña instantáneo en 0ms) */}
      <form onSubmit={handleSave} className="space-y-5">
        <div hidden={activeTab !== "top"}>
          <TopHeaderSettingsSection
            showroomName={showroomName}
            storeType={storeType}
            logoUrl={logoUrl}
            readingFile={readingFile}
            onShowroomNameChange={setShowroomName}
            onStoreTypeChange={setStoreType}
            onLogoUrlChange={setLogoUrl}
            onLogoFileChange={handleLogoFileChange}
            onRemoveLogo={() => setLogoUrl("")}
          />
        </div>

        <div hidden={activeTab !== "main"}>
          <MainContentSettingsSection
            heroMode={heroMode}
            heroTitle={heroTitle}
            heroSubtitle={heroSubtitle}
            heroBannerUrl={heroBannerUrl}
            themePalette={themePalette}
            themePrimaryColor={themePrimaryColor}
            themeFont={themeFont}
            announcementBar={announcementBar}
            homeBlocks={homeBlocks}
            catalogConfig={catalogConfig}
            onHeroModeChange={setHeroMode}
            onHeroTitleChange={setHeroTitle}
            onHeroSubtitleChange={setHeroSubtitle}
            onHeroBannerUrlChange={setHeroBannerUrl}
            onSelectPreset={handleSelectPreset}
            onCustomColorChange={handleCustomColorChange}
            onThemeFontChange={setThemeFont}
            onAnnouncementBarChange={setAnnouncementBar}
            onHomeBlocksChange={setHomeBlocks}
            onCatalogConfigChange={setCatalogConfig}
          />
        </div>

        <div hidden={activeTab !== "footer"}>
          <FooterSettingsSection
            whatsappNumber={whatsappNumber}
            instagramHandle={instagramHandle}
            tiktokHandle={tiktokHandle}
            address={address}
            dataFiscalUrl={dataFiscalUrl}
            storeLocation={storeLocation}
            storeSchedule={storeSchedule}
            onWhatsappNumberChange={setWhatsappNumber}
            onInstagramHandleChange={setInstagramHandle}
            onTiktokHandleChange={setTiktokHandle}
            onAddressChange={setAddress}
            onDataFiscalUrlChange={setDataFiscalUrl}
            onStoreLocationChange={setStoreLocation}
            onStoreScheduleChange={setStoreSchedule}
          />
        </div>

        <div hidden={activeTab !== "payments"}>
          <PaymentsSettingsSection
            mercadopagoEnabled={mercadopagoEnabled}
            onMercadopagoEnabledChange={setMercadopagoEnabled}
            transferEnabled={transferEnabled}
            onTransferEnabledChange={setTransferEnabled}
            transferBankName={transferBankName}
            onTransferBankNameChange={setTransferBankName}
            transferAccountHolder={transferAccountHolder}
            onTransferAccountHolderChange={setTransferAccountHolder}
            transferCbu={transferCbu}
            onTransferCbuChange={setTransferCbu}
            transferAlias={transferAlias}
            onTransferAliasChange={setTransferAlias}
            transferCuit={transferCuit}
            onTransferCuitChange={setTransferCuit}
            transferDiscountPercent={transferDiscountPercent}
            onTransferDiscountPercentChange={setTransferDiscountPercent}
            cashEnabled={cashEnabled}
            onCashEnabledChange={setCashEnabled}
            cashNotes={cashNotes}
            onCashNotesChange={setCashNotes}
            whatsappPaymentEnabled={whatsappPaymentEnabled}
            onWhatsappPaymentEnabledChange={setWhatsappPaymentEnabled}
          />
        </div>

        <div hidden={activeTab !== "politicas"}>
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Términos y Condiciones Generales (Página /terminos)</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Texto legal publicado para tus clientes con soporte completo de hipervínculos interactivos, promociones bancarias y cláusulas personalizadas.
                </p>
              </div>

              {/* Selector de Modo: Editar / Vista Previa */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setTermsViewMode("edit")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      termsViewMode === "edit"
                        ? "bg-amber-400 text-zinc-950 shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Edit3 size={13} />
                    <span>Editar Texto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTermsViewMode("preview")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      termsViewMode === "preview"
                        ? "bg-amber-400 text-zinc-950 shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Eye size={13} />
                    <span>Vista Previa en Vivo</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setCustomTermsText(DEFAULT_SUGGESTED_TERMS)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 text-xs font-semibold transition-colors cursor-pointer"
                  title="Carga la plantilla legal completa con hipervínculos a Promociones Bancarias y Arrepentimiento"
                >
                  <Sparkles size={13} />
                  <span>Cargar sugerencias legales</span>
                </button>
              </div>
            </div>

            {termsViewMode === "edit" ? (
              <div className="space-y-3">
                {/* Toolbar de Hipervínculos y Formato Rápido */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold px-1.5">
                    Insertar Hipervínculo:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomTermsText((prev) =>
                        prev
                          ? `${prev} [Promociones Bancarias](/promociones)`
                          : "[Promociones Bancarias](/promociones)"
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    + Promociones Bancarias
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCustomTermsText((prev) =>
                        prev
                          ? `${prev} [Botón de Arrepentimiento](/arrepentimiento)`
                          : "[Botón de Arrepentimiento](/arrepentimiento)"
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    + Botón de Arrepentimiento
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCustomTermsText((prev) =>
                        prev ? `${prev} [Catálogo de Piezas](/catalogo)` : "[Catálogo de Piezas](/catalogo)"
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    + Catálogo
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCustomTermsText((prev) =>
                        prev
                          ? `${prev} [WhatsApp Oficial](${
                              whatsappNumber
                                ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
                                : "https://wa.me/5491100000000"
                            })`
                          : "[WhatsApp Oficial](https://wa.me/5491100000000)"
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    + WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCustomTermsText((prev) =>
                        prev
                          ? `${prev} [Texto del enlace](https://tusitio.com)`
                          : "[Texto del enlace](https://tusitio.com)"
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Link2 size={12} />
                    <span>Enlace Libre [texto](url)</span>
                  </button>

                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold px-1.5 ml-auto">
                    Formato:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomTermsText((prev) =>
                        prev ? `${prev} **texto destacado**` : "**texto destacado**"
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-bold transition-colors cursor-pointer"
                    title="Negrita"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomTermsText((prev) =>
                        prev ? `${prev}\n\n## N. Nombre de Cláusula\n` : "## 1. Nombre de Cláusula\n"
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                    title="Título de Cláusula"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomTermsText((prev) =>
                        prev ? `${prev}\n- Ítem de lista` : "- Ítem de lista"
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                    title="Lista con viñetas"
                  >
                    • Lista
                  </button>
                </div>

                <textarea
                  rows={14}
                  value={customTermsText}
                  onChange={(e) => setCustomTermsText(e.target.value)}
                  placeholder="Redactá tus términos legales o usá el botón 'Cargar sugerencias legales' para comenzar con hipervínculos predefinidos..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400 leading-relaxed"
                />

                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>
                    Sintaxis compatible: <code className="text-zinc-300">[Texto](https://...)</code>, <code className="text-zinc-300">[Texto](/ruta-interna)</code>, <code className="text-zinc-300">**negrita**</code> y <code className="text-zinc-300">## Títulos</code>.
                  </span>
                  {customTermsText && (
                    <button
                      type="button"
                      onClick={() => setCustomTermsText("")}
                      className="text-zinc-400 hover:text-rose-400 underline cursor-pointer"
                    >
                      Restablecer al texto legal estándar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* VISTA PREVIA EN VIVO */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Así verán y navegarán tus clientes las cláusulas e hipervínculos:</span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                    Interactiva con clics activos
                  </span>
                </div>

                <div className="rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-8 text-stone-900 shadow-md">
                  <TermsContentRenderer
                    content={customTermsText.trim() ? customTermsText : DEFAULT_SUGGESTED_TERMS}
                    brandName={showroomName}
                  />
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-300">Puntos clave recomendados en la legislación argentina:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-zinc-400">
                <li>
                  <strong>Promociones Bancarias:</strong> Enlace a <code className="text-amber-300">/promociones</code> para detallar vigencias, topes de reintegro y entidades bancarias.
                </li>
                <li>
                  <strong>Botón de Arrepentimiento:</strong> Enlace a <code className="text-amber-300">/arrepentimiento</code> conforme a Ley N° 24.240 y Res. 424/2020 SCI.
                </li>
                <li>
                  <strong>Políticas de compra y entrega:</strong> Métodos de entrega, plazos y horarios del local.
                </li>
              </ul>
            </div>
          </div>
        </div>



        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs"
          >
            {errorMessage}
          </div>
        )}

        {savedSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs"
          >
            <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
            <span>Configuración de la tienda guardada correctamente.</span>
          </div>
        )}

        {/* Barra de acción de guardado siempre accesible */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-800/80">
          <p className="text-[11px] text-zinc-400">
            Los cambios realizados en cualquier pestaña se aplican al guardar.
          </p>
          <button
            type="submit"
            disabled={saving || readingFile}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-200 text-zinc-950 font-bold text-xs hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-amber-950/30 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={16} aria-hidden="true" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Barra Flotante de Cambios sin Guardar */}
      {hasUnsavedChanges && (
        <aside
          aria-label="Aviso de cambios pendientes de guardado"
          className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-50 bg-zinc-950/95 border border-amber-400/60 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-zinc-100">
              Tenés cambios sin guardar
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving || readingFile}
              className="px-4 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 text-xs font-extrabold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
