import { ISettingsRepository } from "../domain/ports/repositories.port";
import { ValidationError } from "../domain/errors";
import {
  DEFAULT_STORE_LOCATION,
  DEFAULT_STORE_SCHEDULE,
  StoreLocationConfig,
  StoreScheduleConfig,
} from "../lib/schedule/store-schedule";

export interface SettingsServiceDeps {
  settingsRepo?: ISettingsRepository;
}

export type HeroMode = "editorial" | "featured_carousel" | "custom_banner";

export interface AnnouncementMessage {
  id: string;
  text: string;
  href?: string | null;
  startsAt?: number | string | null;
  endsAt?: number | string | null;
}

export interface AnnouncementBarConfig {
  enabled: boolean;
  messages: AnnouncementMessage[];
  items?: AnnouncementMessage[];
  intervalSeconds?: number;
}

export type HomeBlockId =
  | "hero_banner"
  | "hero"
  | "bank_promotions"
  | "bank_promos"
  | "featured_sections"
  | "new_arrivals"
  | "featured_products"
  | "sale_block"
  | "sale"
  | "trust_bar"
  | "trust"
  | "drops_newsletter"
  | "drops";

export interface HomeBlockItemConfig {
  id: HomeBlockId;
  label: string;
  enabled: boolean;
  position: number;
}

export interface TrustBarItem {
  title: string;
  description: string;
}

export interface HomeBlocksConfig {
  blocks: HomeBlockItemConfig[];
  newArrivalsDays: number;
  featuredSectionSlugs: string[];
  trustItems: TrustBarItem[];
}

export interface CatalogFilterVisibility {
  key: string;
  label: string;
  enabled: boolean;
  position: number;
}

export interface CatalogConfig {
  pageSize: 12 | 16 | 24;
  visibleFilters: CatalogFilterVisibility[];
  enabledFilters?: string[];
  filterLabels?: Record<string, string>;
}

export type CatalogSettingsConfig = CatalogConfig;

export const DEFAULT_ANNOUNCEMENT_BAR: AnnouncementBarConfig = {
  enabled: true,
  messages: [
    {
      id: "ann-promos",
      text: "Hasta 3 cuotas sin interés y reintegros con bancos seleccionados",
      href: "/promociones",
    },
    {
      id: "ann-shipping",
      text: "Envío bonificado desde $85.000 · Retiro sin cargo en showroom",
      href: "/catalogo",
    },
  ],
};

export const DEFAULT_HOME_BLOCKS: HomeBlocksConfig = {
  blocks: [
    { id: "hero_banner", label: "Banner principal (Carrusel)", enabled: true, position: 0 },
    { id: "bank_promotions", label: "Promociones bancarias", enabled: true, position: 1 },
    { id: "featured_sections", label: "Secciones destacadas", enabled: true, position: 2 },
    { id: "new_arrivals", label: "Recién llegados", enabled: true, position: 3 },
    { id: "featured_products", label: "Destacados", enabled: true, position: 4 },
    { id: "sale_block", label: "Sale y descuentos", enabled: true, position: 5 },
    { id: "trust_bar", label: "Bloque de confianza", enabled: true, position: 6 },
    { id: "drops_newsletter", label: "Aviso de próximos drops", enabled: true, position: 7 },
  ],
  newArrivalsDays: 30,
  featuredSectionSlugs: ["mujer", "hombre", "sale"],
  trustItems: [
    {
      title: "Envíos y retiro en el local",
      description: "Despachos a todo el país y retiro sin cargo en showroom.",
    },
    {
      title: "Cambios garantizados",
      description: "Cambios simples dentro de los 15 días corridos de tu compra.",
    },
    {
      title: "Medios de pago y promos",
      description: "Transferencia con descuento, tarjetas y promociones bancarias.",
    },
  ],
};

export const DEFAULT_CATALOG_CONFIG: CatalogConfig = {
  pageSize: 12,
  visibleFilters: [
    { key: "categories", label: "Categorías", enabled: true, position: 0 },
    { key: "para", label: "Para", enabled: true, position: 1 },
    { key: "sizes", label: "Talle", enabled: true, position: 2 },
    { key: "colors", label: "Color", enabled: true, position: 3 },
    { key: "price", label: "Precio", enabled: true, position: 4 },
    { key: "availability", label: "Disponibilidad", enabled: true, position: 5 },
    { key: "onSale", label: "En oferta", enabled: true, position: 6 },
    { key: "material", label: "Material", enabled: true, position: 7 },
  ],
};

export const DEFAULT_SUGGESTED_TERMS = `1. Condiciones Generales y Disponibilidad
El acceso y uso de la tienda online implica la aceptación plena de los presentes Términos y Condiciones. Nuestras piezas del [Catálogo](/catalogo) son seleccionadas de forma exclusiva y cuentan con inventario limitado o de ejemplar único.
En caso de que una pieza seleccionada se agote de manera simultánea durante el proceso de compra, se notificará de inmediato al cliente para coordinar una alternativa equivalente o la restitución del importe abonado.

2. Política de Reserva y Pago
Al completar una solicitud de pedido mediante transferencia bancaria, [Mercado Pago](/carrito) o coordinación humana, la prenda queda reservada por el plazo establecido para coordinar el pago o retiro.
Transcurrido este plazo sin acreditación del pago ni comprobante correspondiente, la reserva caduca automáticamente y la pieza vuelve a estar disponible para la venta general.

3. Envíos y Retiro en el Local
Realizamos envíos a todo el territorio a través de correo privado y mensajería express. Los costos de envío y plazos estimados de entrega se informan con precisión en la bolsa de compras antes de confirmar el pedido.
Los retiros en el local se realizan sin costo adicional en los horarios habilitados de atención, previa confirmación por WhatsApp o notificación de pedido listo.

4. Cambios, Devoluciones y Botón de Arrepentimiento
Se aceptan cambios dentro de los 15 (quince) días corridos desde la fecha de recepción o retiro de la compra, siempre que la prenda se encuentre en perfecto estado de conservación, sin uso y con sus etiquetas originales.
Conforme a la Ley Nacional de Defensa del Consumidor N° 24.240 y la Res. 424/2020 SCI, los clientes disponen del [Botón de Arrepentimiento](/arrepentimiento) para revocar la compra de forma ágil y 100% online dentro de los 10 días corridos de recibido el producto.

5. Promociones Bancarias y Descuentos
Los beneficios, cuotas sin interés y reintegros con entidades bancarias (Banco Galicia, Santander, BBVA, Macro, Nación y MODO) se rigen por las condiciones particulares publicadas en nuestra sección oficial de [Promociones Bancarias](/promociones), sujetas a vigencia, días habilitados y topes de reintegro establecidos por cada entidad emisora.`;

export type StoreContentWidth = "compact" | "standard" | "wide" | "full";

export const DEFAULT_STORE_CONTENT_WIDTH: StoreContentWidth = "standard";

export interface StoreContentWidthOption {
  id: StoreContentWidth;
  label: string;
  shortLabel: string;
  description: string;
  maxWidthCss: string;
  recommended?: boolean;
}

export const STORE_CONTENT_WIDTHS: Record<StoreContentWidth, StoreContentWidthOption> = {
  standard: {
    id: "standard",
    label: "Estándar Editorial (1280px)",
    shortLabel: "Estándar (1280px)",
    description: "Recomendado. Equilibrio óptimo entre fotografía y lectura fluida según estándares de accesibilidad WCAG.",
    maxWidthCss: "1280px",
    recommended: true,
  },
  wide: {
    id: "wide",
    label: "Amplio / Inmersivo (1536px)",
    shortLabel: "Amplio (1536px)",
    description: "Mayor presencia visual en pantallas de alta resolución con márgenes elegantes.",
    maxWidthCss: "1536px",
  },
  full: {
    id: "full",
    label: "Ancho Completo Fluido (100%)",
    shortLabel: "Ancho Completo (100%)",
    description: "Aprovecha todo el ancho del monitor de borde a borde con padding de seguridad lateral.",
    maxWidthCss: "100%",
  },
  compact: {
    id: "compact",
    label: "Compacto / Boutique (1080px)",
    shortLabel: "Compacto (1080px)",
    description: "Lookbook centrado estilo revista editorial, íntimo y enfocado para piezas exclusivas.",
    maxWidthCss: "1080px",
  },
};

export interface ShowroomSettings {
  whatsappNumber: string;
  showroomName: string;
  storeType?: string;
  aboutText?: string | null;
  businessVertical?: string | null;
  businessDescriptor?: string | null;
  logoUrl?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  address?: string | null;
  dataFiscalUrl?: string | null;
  reservationHours?: number;
  heroMode: HeroMode;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroBannerUrl?: string | null;
  themePalette: string;
  themePrimaryColor?: string | null;
  themeBgColor?: string | null;
  themeSurfaceColor?: string | null;
  themeHeaderBgColor?: string | null;
  themeFooterBgColor?: string | null;
  themeFont: string;
  contentWidth?: StoreContentWidth;
  customTermsText?: string | null;
  // Métodos de pago (BR-47)
  mercadopagoEnabled: boolean;
  mercadopagoAccessToken?: string | null;
  mercadopagoPublicKey?: string | null;
  mercadopagoConnectedAccount?: string | null;
  paywayEnabled?: boolean;
  paywayApiKey?: string | null;
  paywayMerchantId?: string | null;
  paywayEnvironment?: "sandbox" | "production";
  paywayCuotaSimpleEnabled?: boolean;
  getnetEnabled?: boolean;
  getnetClientId?: string | null;
  getnetClientSecret?: string | null;
  getnetSellerId?: string | null;
  getnetEnvironment?: "sandbox" | "production";
  modoEnabled?: boolean;
  modoMerchantId?: string | null;
  modoTerminalId?: string | null;
  googlePayEnabled?: boolean;
  googlePayMerchantId?: string | null;
  transferEnabled: boolean;
  transferBankName?: string | null;
  transferAccountHolder?: string | null;
  transferCbu?: string | null;
  transferAlias?: string | null;
  transferCuit?: string | null;
  transferDiscountPercent: number;
  cashEnabled: boolean;
  cashNotes?: string | null;
  whatsappPaymentEnabled: boolean;
  // Nuevas configuraciones de Vidriera, Catálogo, Local y Horarios
  announcementBar: AnnouncementBarConfig;
  homeBlocks: HomeBlocksConfig;
  catalogConfig: CatalogConfig;
  storeLocation: StoreLocationConfig;
  storeSchedule: StoreScheduleConfig;
}

export interface UpdateShowroomSettingsInput {
  whatsappNumber?: string;
  showroomName?: string;
  storeType?: string;
  aboutText?: string | null;
  businessVertical?: string | null;
  businessDescriptor?: string | null;
  logoUrl?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  address?: string | null;
  dataFiscalUrl?: string | null;
  reservationHours?: number;
  heroMode?: HeroMode;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroBannerUrl?: string | null;
  themePalette?: string;
  themePrimaryColor?: string | null;
  themeBgColor?: string | null;
  themeSurfaceColor?: string | null;
  themeHeaderBgColor?: string | null;
  themeFooterBgColor?: string | null;
  themeFont?: string | null;
  contentWidth?: StoreContentWidth | null;
  customTermsText?: string | null;
  mercadopagoEnabled?: boolean;
  mercadopagoAccessToken?: string | null;
  mercadopagoPublicKey?: string | null;
  mercadopagoConnectedAccount?: string | null;
  paywayEnabled?: boolean;
  paywayApiKey?: string | null;
  paywayMerchantId?: string | null;
  paywayEnvironment?: "sandbox" | "production";
  paywayCuotaSimpleEnabled?: boolean;
  getnetEnabled?: boolean;
  getnetClientId?: string | null;
  getnetClientSecret?: string | null;
  getnetSellerId?: string | null;
  getnetEnvironment?: "sandbox" | "production";
  modoEnabled?: boolean;
  modoMerchantId?: string | null;
  modoTerminalId?: string | null;
  googlePayEnabled?: boolean;
  googlePayMerchantId?: string | null;
  transferEnabled?: boolean;
  transferBankName?: string | null;
  transferAccountHolder?: string | null;
  transferCbu?: string | null;
  transferAlias?: string | null;
  transferCuit?: string | null;
  transferDiscountPercent?: number;
  cashEnabled?: boolean;
  cashNotes?: string | null;
  whatsappPaymentEnabled?: boolean;
  announcementBar?: AnnouncementBarConfig;
  homeBlocks?: HomeBlocksConfig;
  catalogConfig?: CatalogConfig;
  storeLocation?: StoreLocationConfig;
  storeSchedule?: StoreScheduleConfig;
}

const DEFAULT_WHATSAPP_NUMBER = "+5491100000000";
const DEFAULT_SHOWROOM_NAME = "Aura Studio";
const DEFAULT_STORE_TYPE = "Showroom";
const DEFAULT_RESERVATION_HOURS = 48;
const DEFAULT_HERO_MODE: HeroMode = "featured_carousel";
const DEFAULT_THEME_PALETTE = "lino";
const DEFAULT_THEME_FONT = "cormorant";
const DEFAULT_TRANSFER_DISCOUNT_PERCENT = 10;

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw || !raw.trim()) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

/**
 * Obtiene la configuración del showroom desde la base de datos sin deploy.
 * Si alguna clave no fue configurada en DB, utiliza los valores por defecto del sistema/entorno.
 */
export async function getShowroomSettings(
  deps: SettingsServiceDeps
): Promise<ShowroomSettings> {
  const { settingsRepo } = deps;

  let storedWhatsapp: string | null = null;
  let storedName: string | null = null;
  let storedStoreType: string | null = null;
  let storedAboutText: string | null = null;
  let storedBusinessVertical: string | null = null;
  let storedBusinessDescriptor: string | null = null;
  let storedHours: string | null = null;
  let storedLogo: string | null = null;
  let storedInstagram: string | null = null;
  let storedTiktok: string | null = null;
  let storedAddress: string | null = null;
  let storedDataFiscal: string | null = null;
  let storedHeroMode: string | null = null;
  let storedHeroTitle: string | null = null;
  let storedHeroSubtitle: string | null = null;
  let storedHeroBannerUrl: string | null = null;
  let storedThemePalette: string | null = null;
  let storedThemePrimaryColor: string | null = null;
  let storedThemeBgColor: string | null = null;
  let storedThemeSurfaceColor: string | null = null;
  let storedThemeHeaderBgColor: string | null = null;
  let storedThemeFooterBgColor: string | null = null;
  let storedThemeFont: string | null = null;
  let storedContentWidth: string | null = null;
  let storedCustomTermsText: string | null = null;
  let storedMercadopagoEnabled: string | null = null;
  let storedMercadopagoAccessToken: string | null = null;
  let storedMercadopagoPublicKey: string | null = null;
  let storedMercadopagoConnectedAccount: string | null = null;
  let storedPaywayEnabled: string | null = null;
  let storedPaywayApiKey: string | null = null;
  let storedPaywayMerchantId: string | null = null;
  let storedPaywayEnvironment: string | null = null;
  let storedPaywayCuotaSimpleEnabled: string | null = null;
  let storedGetnetEnabled: string | null = null;
  let storedGetnetClientId: string | null = null;
  let storedGetnetClientSecret: string | null = null;
  let storedGetnetSellerId: string | null = null;
  let storedGetnetEnvironment: string | null = null;
  let storedModoEnabled: string | null = null;
  let storedModoMerchantId: string | null = null;
  let storedModoTerminalId: string | null = null;
  let storedGooglePayEnabled: string | null = null;
  let storedGooglePayMerchantId: string | null = null;
  let storedTransferEnabled: string | null = null;
  let storedTransferBankName: string | null = null;
  let storedTransferAccountHolder: string | null = null;
  let storedTransferCbu: string | null = null;
  let storedTransferAlias: string | null = null;
  let storedTransferCuit: string | null = null;
  let storedTransferDiscountPercent: string | null = null;
  let storedCashEnabled: string | null = null;
  let storedCashNotes: string | null = null;
  let storedWhatsappPaymentEnabled: string | null = null;
  let storedAnnouncementBar: string | null = null;
  let storedHomeBlocks: string | null = null;
  let storedCatalogConfig: string | null = null;
  let storedStoreLocation: string | null = null;
  let storedStoreSchedule: string | null = null;

  if (settingsRepo) {
    if (typeof settingsRepo.getAll === "function") {
      const all = await settingsRepo.getAll();
      storedWhatsapp = all["whatsapp_number"] ?? null;
      storedName = all["showroom_name"] ?? null;
      storedStoreType = all["store_type"] ?? null;
      storedAboutText = all["about_text"] ?? null;
      storedBusinessVertical = all["business_vertical"] ?? null;
      storedBusinessDescriptor = all["business_descriptor"] ?? null;
      storedHours = all["reservation_hours"] ?? null;
      storedLogo = all["logo_url"] ?? null;
      storedInstagram = all["instagram_handle"] ?? null;
      storedTiktok = all["tiktok_handle"] ?? null;
      storedAddress = all["address"] ?? null;
      storedDataFiscal = all["data_fiscal_url"] ?? null;
      storedHeroMode = all["hero_mode"] ?? null;
      storedHeroTitle = all["hero_title"] ?? null;
      storedHeroSubtitle = all["hero_subtitle"] ?? null;
      storedHeroBannerUrl = all["hero_banner_url"] ?? null;
      storedThemePalette = all["theme_palette"] ?? null;
      storedThemePrimaryColor = all["theme_primary_color"] ?? null;
      storedThemeBgColor = all["theme_bg_color"] ?? null;
      storedThemeSurfaceColor = all["theme_surface_color"] ?? null;
      storedThemeHeaderBgColor = all["theme_header_bg_color"] ?? null;
      storedThemeFooterBgColor = all["theme_footer_bg_color"] ?? null;
      storedThemeFont = all["theme_font"] ?? null;
      storedContentWidth = all["content_width"] ?? null;
      storedCustomTermsText = all["custom_terms_text"] ?? null;
      storedMercadopagoEnabled = all["mercadopago_enabled"] ?? null;
      storedMercadopagoAccessToken = all["mercadopago_access_token"] ?? null;
      storedMercadopagoPublicKey = all["mercadopago_public_key"] ?? null;
      storedMercadopagoConnectedAccount = all["mercadopago_connected_account"] ?? null;
      storedPaywayEnabled = all["payway_enabled"] ?? null;
      storedPaywayApiKey = all["payway_api_key"] ?? null;
      storedPaywayMerchantId = all["payway_merchant_id"] ?? null;
      storedPaywayEnvironment = all["payway_environment"] ?? null;
      storedPaywayCuotaSimpleEnabled = all["payway_cuota_simple_enabled"] ?? null;
      storedGetnetEnabled = all["getnet_enabled"] ?? null;
      storedGetnetClientId = all["getnet_client_id"] ?? null;
      storedGetnetClientSecret = all["getnet_client_secret"] ?? null;
      storedGetnetSellerId = all["getnet_seller_id"] ?? null;
      storedGetnetEnvironment = all["getnet_environment"] ?? null;
      storedModoEnabled = all["modo_enabled"] ?? null;
      storedModoMerchantId = all["modo_merchant_id"] ?? null;
      storedModoTerminalId = all["modo_terminal_id"] ?? null;
      storedGooglePayEnabled = all["google_pay_enabled"] ?? null;
      storedGooglePayMerchantId = all["google_pay_merchant_id"] ?? null;
      storedTransferEnabled = all["transfer_enabled"] ?? null;
      storedTransferBankName = all["transfer_bank_name"] ?? null;
      storedTransferAccountHolder = all["transfer_account_holder"] ?? null;
      storedTransferCbu = all["transfer_cbu"] ?? null;
      storedTransferAlias = all["transfer_alias"] ?? null;
      storedTransferCuit = all["transfer_cuit"] ?? null;
      storedTransferDiscountPercent = all["transfer_discount_percent"] ?? null;
      storedCashEnabled = all["cash_enabled"] ?? null;
      storedCashNotes = all["cash_notes"] ?? null;
      storedWhatsappPaymentEnabled = all["whatsapp_payment_enabled"] ?? null;
      storedAnnouncementBar = all["announcement_bar_json"] ?? null;
      storedHomeBlocks = all["home_blocks_json"] ?? null;
      storedCatalogConfig = all["catalog_config_json"] ?? null;
      storedStoreLocation = all["store_location_json"] ?? null;
      storedStoreSchedule = all["store_schedule_json"] ?? null;
    } else {
      [
        storedWhatsapp,
        storedName,
        storedStoreType,
        storedAboutText,
        storedBusinessVertical,
        storedBusinessDescriptor,
        storedHours,
        storedLogo,
        storedInstagram,
        storedTiktok,
        storedAddress,
        storedDataFiscal,
        storedHeroMode,
        storedHeroTitle,
        storedHeroSubtitle,
        storedHeroBannerUrl,
        storedThemePalette,
        storedThemePrimaryColor,
        storedThemeBgColor,
        storedThemeSurfaceColor,
        storedThemeHeaderBgColor,
        storedThemeFooterBgColor,
        storedThemeFont,
        storedContentWidth,
        storedCustomTermsText,
        storedMercadopagoEnabled,
        storedMercadopagoAccessToken,
        storedMercadopagoPublicKey,
        storedMercadopagoConnectedAccount,
        storedPaywayEnabled,
        storedPaywayApiKey,
        storedPaywayMerchantId,
        storedPaywayEnvironment,
        storedPaywayCuotaSimpleEnabled,
        storedGetnetEnabled,
        storedGetnetClientId,
        storedGetnetClientSecret,
        storedGetnetSellerId,
        storedGetnetEnvironment,
        storedModoEnabled,
        storedModoMerchantId,
        storedModoTerminalId,
        storedGooglePayEnabled,
        storedGooglePayMerchantId,
        storedTransferEnabled,
        storedTransferBankName,
        storedTransferAccountHolder,
        storedTransferCbu,
        storedTransferAlias,
        storedTransferCuit,
        storedTransferDiscountPercent,
        storedCashEnabled,
        storedCashNotes,
        storedWhatsappPaymentEnabled,
        storedAnnouncementBar,
        storedHomeBlocks,
        storedCatalogConfig,
        storedStoreLocation,
        storedStoreSchedule,
      ] = await Promise.all([
        settingsRepo.get("whatsapp_number"),
        settingsRepo.get("showroom_name"),
        settingsRepo.get("store_type"),
        settingsRepo.get("about_text"),
        settingsRepo.get("business_vertical"),
        settingsRepo.get("business_descriptor"),
        settingsRepo.get("reservation_hours"),
        settingsRepo.get("logo_url"),
        settingsRepo.get("instagram_handle"),
        settingsRepo.get("tiktok_handle"),
        settingsRepo.get("address"),
        settingsRepo.get("data_fiscal_url"),
        settingsRepo.get("hero_mode"),
        settingsRepo.get("hero_title"),
        settingsRepo.get("hero_subtitle"),
        settingsRepo.get("hero_banner_url"),
        settingsRepo.get("theme_palette"),
        settingsRepo.get("theme_primary_color"),
        settingsRepo.get("theme_bg_color"),
        settingsRepo.get("theme_surface_color"),
        settingsRepo.get("theme_header_bg_color"),
        settingsRepo.get("theme_footer_bg_color"),
        settingsRepo.get("theme_font"),
        settingsRepo.get("content_width"),
        settingsRepo.get("custom_terms_text"),
        settingsRepo.get("mercadopago_enabled"),
        settingsRepo.get("mercadopago_access_token"),
        settingsRepo.get("mercadopago_public_key"),
        settingsRepo.get("mercadopago_connected_account"),
        settingsRepo.get("payway_enabled"),
        settingsRepo.get("payway_api_key"),
        settingsRepo.get("payway_merchant_id"),
        settingsRepo.get("payway_environment"),
        settingsRepo.get("payway_cuota_simple_enabled"),
        settingsRepo.get("getnet_enabled"),
        settingsRepo.get("getnet_client_id"),
        settingsRepo.get("getnet_client_secret"),
        settingsRepo.get("getnet_seller_id"),
        settingsRepo.get("getnet_environment"),
        settingsRepo.get("modo_enabled"),
        settingsRepo.get("modo_merchant_id"),
        settingsRepo.get("modo_terminal_id"),
        settingsRepo.get("google_pay_enabled"),
        settingsRepo.get("google_pay_merchant_id"),
        settingsRepo.get("transfer_enabled"),
        settingsRepo.get("transfer_bank_name"),
        settingsRepo.get("transfer_account_holder"),
        settingsRepo.get("transfer_cbu"),
        settingsRepo.get("transfer_alias"),
        settingsRepo.get("transfer_cuit"),
        settingsRepo.get("transfer_discount_percent"),
        settingsRepo.get("cash_enabled"),
        settingsRepo.get("cash_notes"),
        settingsRepo.get("whatsapp_payment_enabled"),
        settingsRepo.get("announcement_bar_json"),
        settingsRepo.get("home_blocks_json"),
        settingsRepo.get("catalog_config_json"),
        settingsRepo.get("store_location_json"),
        settingsRepo.get("store_schedule_json"),
      ]);
    }
  }

  const parsedHours = storedHours ? parseInt(storedHours, 10) : NaN;
  const parsedTransferDiscount = storedTransferDiscountPercent
    ? parseInt(storedTransferDiscountPercent, 10)
    : DEFAULT_TRANSFER_DISCOUNT_PERCENT;
  const validHeroMode =
    storedHeroMode === "editorial" ||
    storedHeroMode === "featured_carousel" ||
    storedHeroMode === "custom_banner"
      ? (storedHeroMode as HeroMode)
      : DEFAULT_HERO_MODE;

  const storeLocation = safeJsonParse<StoreLocationConfig>(
    storedStoreLocation,
    DEFAULT_STORE_LOCATION
  );

  // Si address fue configurado previamente pero store_location_json no, sincronizar streetAddress
  const legacyAddress = storedAddress && storedAddress.trim() ? storedAddress.trim() : null;
  if (legacyAddress && !storedStoreLocation) {
    storeLocation.streetAddress = legacyAddress;
  }

  const fullFormattedAddress = storeLocation.attendsPublic
    ? [storeLocation.streetAddress, storeLocation.locality, storeLocation.province]
        .map((s) => (s || "").trim())
        .filter(Boolean)
        .join(", ")
    : null;

  return {
    whatsappNumber: storedWhatsapp || process.env.WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER,
    showroomName: storedName || DEFAULT_SHOWROOM_NAME,
    storeType: storedStoreType && storedStoreType.trim() ? storedStoreType.trim() : DEFAULT_STORE_TYPE,
    aboutText: storedAboutText && storedAboutText.trim() ? storedAboutText.trim() : null,
    businessVertical: storedBusinessVertical && storedBusinessVertical.trim() ? storedBusinessVertical.trim() : "indumentaria",
    businessDescriptor: storedBusinessDescriptor && storedBusinessDescriptor.trim() ? storedBusinessDescriptor.trim() : null,
    logoUrl: storedLogo && storedLogo.trim() ? storedLogo.trim() : null,
    instagramHandle: storedInstagram && storedInstagram.trim() ? storedInstagram.trim() : null,
    tiktokHandle: storedTiktok && storedTiktok.trim() ? storedTiktok.trim() : null,
    address: legacyAddress || fullFormattedAddress,
    dataFiscalUrl: storedDataFiscal && storedDataFiscal.trim() ? storedDataFiscal.trim() : null,
    reservationHours: !Number.isNaN(parsedHours) && parsedHours > 0 ? parsedHours : DEFAULT_RESERVATION_HOURS,
    heroMode: validHeroMode,
    heroTitle: storedHeroTitle && storedHeroTitle.trim() ? storedHeroTitle.trim() : null,
    heroSubtitle: storedHeroSubtitle && storedHeroSubtitle.trim() ? storedHeroSubtitle.trim() : null,
    heroBannerUrl: storedHeroBannerUrl && storedHeroBannerUrl.trim() ? storedHeroBannerUrl.trim() : null,
    themePalette: storedThemePalette && storedThemePalette.trim() ? storedThemePalette.trim() : DEFAULT_THEME_PALETTE,
    themePrimaryColor: storedThemePrimaryColor && storedThemePrimaryColor.trim() ? storedThemePrimaryColor.trim() : null,
    themeBgColor: storedThemeBgColor && storedThemeBgColor.trim() ? storedThemeBgColor.trim() : null,
    themeSurfaceColor: storedThemeSurfaceColor && storedThemeSurfaceColor.trim() ? storedThemeSurfaceColor.trim() : null,
    themeHeaderBgColor: storedThemeHeaderBgColor && storedThemeHeaderBgColor.trim() ? storedThemeHeaderBgColor.trim() : null,
    themeFooterBgColor: storedThemeFooterBgColor && storedThemeFooterBgColor.trim() ? storedThemeFooterBgColor.trim() : null,
    themeFont: storedThemeFont && storedThemeFont.trim() ? storedThemeFont.trim() : DEFAULT_THEME_FONT,
    contentWidth: (storedContentWidth === "compact" || storedContentWidth === "wide" || storedContentWidth === "full" ? storedContentWidth : "standard") as StoreContentWidth,
    customTermsText: storedCustomTermsText && storedCustomTermsText.trim() ? storedCustomTermsText.trim() : null,
    // Métodos de pago
    mercadopagoEnabled: storedMercadopagoEnabled !== "0",
    mercadopagoAccessToken: storedMercadopagoAccessToken && storedMercadopagoAccessToken.trim() ? storedMercadopagoAccessToken.trim() : null,
    mercadopagoPublicKey: storedMercadopagoPublicKey && storedMercadopagoPublicKey.trim() ? storedMercadopagoPublicKey.trim() : null,
    mercadopagoConnectedAccount: storedMercadopagoConnectedAccount && storedMercadopagoConnectedAccount.trim() ? storedMercadopagoConnectedAccount.trim() : null,
    paywayEnabled: storedPaywayEnabled === "1",
    paywayApiKey: storedPaywayApiKey && storedPaywayApiKey.trim() ? storedPaywayApiKey.trim() : null,
    paywayMerchantId: storedPaywayMerchantId && storedPaywayMerchantId.trim() ? storedPaywayMerchantId.trim() : null,
    paywayEnvironment: (storedPaywayEnvironment === "production" ? "production" : "sandbox") as "sandbox" | "production",
    paywayCuotaSimpleEnabled: storedPaywayCuotaSimpleEnabled !== "0",
    getnetEnabled: storedGetnetEnabled === "1",
    getnetClientId: storedGetnetClientId && storedGetnetClientId.trim() ? storedGetnetClientId.trim() : null,
    getnetClientSecret: storedGetnetClientSecret && storedGetnetClientSecret.trim() ? storedGetnetClientSecret.trim() : null,
    getnetSellerId: storedGetnetSellerId && storedGetnetSellerId.trim() ? storedGetnetSellerId.trim() : null,
    getnetEnvironment: (storedGetnetEnvironment === "production" ? "production" : "sandbox") as "sandbox" | "production",
    modoEnabled: storedModoEnabled === "1",
    modoMerchantId: storedModoMerchantId && storedModoMerchantId.trim() ? storedModoMerchantId.trim() : null,
    modoTerminalId: storedModoTerminalId && storedModoTerminalId.trim() ? storedModoTerminalId.trim() : null,
    googlePayEnabled: storedGooglePayEnabled === "1",
    googlePayMerchantId: storedGooglePayMerchantId && storedGooglePayMerchantId.trim() ? storedGooglePayMerchantId.trim() : null,
    transferEnabled: storedTransferEnabled !== "0",
    transferBankName: storedTransferBankName && storedTransferBankName.trim() ? storedTransferBankName.trim() : null,
    transferAccountHolder: storedTransferAccountHolder && storedTransferAccountHolder.trim() ? storedTransferAccountHolder.trim() : null,
    transferCbu: storedTransferCbu && storedTransferCbu.trim() ? storedTransferCbu.trim() : null,
    transferAlias: storedTransferAlias && storedTransferAlias.trim() ? storedTransferAlias.trim() : null,
    transferCuit: storedTransferCuit && storedTransferCuit.trim() ? storedTransferCuit.trim() : null,
    transferDiscountPercent: !Number.isNaN(parsedTransferDiscount) && parsedTransferDiscount >= 0 && parsedTransferDiscount <= 100
      ? parsedTransferDiscount
      : DEFAULT_TRANSFER_DISCOUNT_PERCENT,
    cashEnabled: storedCashEnabled !== "0",
    cashNotes: storedCashNotes && storedCashNotes.trim() ? storedCashNotes.trim() : null,
    whatsappPaymentEnabled: storedWhatsappPaymentEnabled !== "0",
    // Nuevas configuraciones
    announcementBar: (() => {
      const parsed = safeJsonParse<AnnouncementBarConfig>(
        storedAnnouncementBar,
        DEFAULT_ANNOUNCEMENT_BAR
      );
      return {
        ...parsed,
        messages: parsed.messages || parsed.items || DEFAULT_ANNOUNCEMENT_BAR.messages,
        items: parsed.items || parsed.messages || DEFAULT_ANNOUNCEMENT_BAR.messages,
      };
    })(),
    homeBlocks: safeJsonParse<HomeBlocksConfig>(
      storedHomeBlocks,
      DEFAULT_HOME_BLOCKS
    ),
    catalogConfig: (() => {
      const parsed = safeJsonParse<CatalogConfig>(
        storedCatalogConfig,
        DEFAULT_CATALOG_CONFIG
      );
      const visible = parsed.visibleFilters || DEFAULT_CATALOG_CONFIG.visibleFilters;
      const enabledFilters =
        parsed.enabledFilters && parsed.enabledFilters.length > 0
          ? parsed.enabledFilters
          : visible.filter((f) => f.enabled).map((f) => f.key);
      return {
        ...parsed,
        visibleFilters: visible,
        enabledFilters,
      };
    })(),
    storeLocation,
    storeSchedule: safeJsonParse<StoreScheduleConfig>(
      storedStoreSchedule,
      DEFAULT_STORE_SCHEDULE
    ),
  };
}

/**
 * Actualiza la configuración del showroom persistiendo en la base de datos sin deploy.
 */
export async function updateShowroomSettings(
  input: UpdateShowroomSettingsInput,
  deps: SettingsServiceDeps
): Promise<ShowroomSettings> {
  const { settingsRepo } = deps;
  if (!settingsRepo) {
    throw new Error("El repositorio de configuración no está disponible.");
  }

  if (input.whatsappNumber !== undefined) {
    const trimmedWhatsapp = input.whatsappNumber.trim();
    if (!trimmedWhatsapp) {
      throw new ValidationError("El número de WhatsApp no puede estar vacío.");
    }
    if (!/^\+?[0-9]{8,18}$/.test(trimmedWhatsapp.replace(/\s+/g, ""))) {
      throw new ValidationError("El número de WhatsApp debe contener entre 8 y 18 dígitos numéricos.");
    }
    await settingsRepo.set("whatsapp_number", trimmedWhatsapp);
  }

  if (input.showroomName !== undefined) {
    const trimmedName = input.showroomName.trim();
    if (!trimmedName) {
      throw new ValidationError("El nombre del showroom no puede estar vacío.");
    }
    await settingsRepo.set("showroom_name", trimmedName);
  }

  if (input.storeType !== undefined) {
    await settingsRepo.set("store_type", input.storeType.trim() || DEFAULT_STORE_TYPE);
  }

  if (input.aboutText !== undefined) {
    const trimmedAbout = input.aboutText ? input.aboutText.trim() : "";
    if (trimmedAbout.length > 160) {
      throw new ValidationError("El texto 'Acerca de la tienda' no puede superar los 160 caracteres.");
    }
    await settingsRepo.set("about_text", trimmedAbout);
  }

  if (input.businessVertical !== undefined) {
    await settingsRepo.set("business_vertical", input.businessVertical ? input.businessVertical.trim() : "indumentaria");
  }

  if (input.businessDescriptor !== undefined) {
    const trimmedDesc = input.businessDescriptor ? input.businessDescriptor.trim() : "";
    if (trimmedDesc.length > 40) {
      throw new ValidationError("El descriptor de negocio no puede superar los 40 caracteres.");
    }
    await settingsRepo.set("business_descriptor", trimmedDesc);
  }

  if (input.logoUrl !== undefined) {
    await settingsRepo.set("logo_url", input.logoUrl ? input.logoUrl.trim() : "");
  }

  if (input.instagramHandle !== undefined) {
    await settingsRepo.set("instagram_handle", input.instagramHandle ? input.instagramHandle.trim() : "");
  }

  if (input.tiktokHandle !== undefined) {
    await settingsRepo.set("tiktok_handle", input.tiktokHandle ? input.tiktokHandle.trim() : "");
  }

  if (input.address !== undefined) {
    await settingsRepo.set("address", input.address ? input.address.trim() : "");
  }

  if (input.dataFiscalUrl !== undefined) {
    await settingsRepo.set("data_fiscal_url", input.dataFiscalUrl ? input.dataFiscalUrl.trim() : "");
  }

  if (input.reservationHours !== undefined) {
    const hours = Number(input.reservationHours);
    if (!Number.isInteger(hours) || hours <= 0) {
      throw new ValidationError("Las horas de reserva deben ser un número entero mayor a 0.");
    }
    await settingsRepo.set("reservation_hours", String(hours));
  }

  if (input.heroMode !== undefined) {
    await settingsRepo.set("hero_mode", input.heroMode);
  }

  if (input.heroTitle !== undefined) {
    await settingsRepo.set("hero_title", input.heroTitle ? input.heroTitle.trim() : "");
  }

  if (input.heroSubtitle !== undefined) {
    await settingsRepo.set("hero_subtitle", input.heroSubtitle ? input.heroSubtitle.trim() : "");
  }

  if (input.heroBannerUrl !== undefined) {
    await settingsRepo.set("hero_banner_url", input.heroBannerUrl ? input.heroBannerUrl.trim() : "");
  }

  if (input.themePalette !== undefined) {
    await settingsRepo.set("theme_palette", input.themePalette.trim());
  }

  if (input.themePrimaryColor !== undefined) {
    await settingsRepo.set("theme_primary_color", input.themePrimaryColor ? input.themePrimaryColor.trim() : "");
  }

  if (input.themeBgColor !== undefined) {
    await settingsRepo.set("theme_bg_color", input.themeBgColor ? input.themeBgColor.trim() : "");
  }

  if (input.themeSurfaceColor !== undefined) {
    await settingsRepo.set("theme_surface_color", input.themeSurfaceColor ? input.themeSurfaceColor.trim() : "");
  }

  if (input.themeHeaderBgColor !== undefined) {
    await settingsRepo.set("theme_header_bg_color", input.themeHeaderBgColor ? input.themeHeaderBgColor.trim() : "");
  }

  if (input.themeFooterBgColor !== undefined) {
    await settingsRepo.set("theme_footer_bg_color", input.themeFooterBgColor ? input.themeFooterBgColor.trim() : "");
  }

  if (input.customTermsText !== undefined) {
    await settingsRepo.set("custom_terms_text", input.customTermsText ? input.customTermsText.trim() : "");
  }

  if (input.themeFont !== undefined) {
    await settingsRepo.set("theme_font", input.themeFont ? input.themeFont.trim() : DEFAULT_THEME_FONT);
  }

  if (input.contentWidth !== undefined) {
    const validWidth =
      input.contentWidth === "compact" ||
      input.contentWidth === "wide" ||
      input.contentWidth === "full"
        ? input.contentWidth
        : DEFAULT_STORE_CONTENT_WIDTH;
    await settingsRepo.set("content_width", validWidth);
  }

  // Métodos de pago (BR-47)
  if (input.mercadopagoEnabled !== undefined) {
    await settingsRepo.set("mercadopago_enabled", input.mercadopagoEnabled ? "1" : "0");
  }

  if (input.mercadopagoAccessToken !== undefined) {
    await settingsRepo.set("mercadopago_access_token", input.mercadopagoAccessToken ? input.mercadopagoAccessToken.trim() : "");
  }

  if (input.mercadopagoPublicKey !== undefined) {
    await settingsRepo.set("mercadopago_public_key", input.mercadopagoPublicKey ? input.mercadopagoPublicKey.trim() : "");
  }

  if (input.mercadopagoConnectedAccount !== undefined) {
    await settingsRepo.set("mercadopago_connected_account", input.mercadopagoConnectedAccount ? input.mercadopagoConnectedAccount.trim() : "");
  }

  if (input.paywayEnabled !== undefined) {
    await settingsRepo.set("payway_enabled", input.paywayEnabled ? "1" : "0");
  }

  if (input.paywayApiKey !== undefined) {
    await settingsRepo.set("payway_api_key", input.paywayApiKey ? input.paywayApiKey.trim() : "");
  }

  if (input.paywayMerchantId !== undefined) {
    await settingsRepo.set("payway_merchant_id", input.paywayMerchantId ? input.paywayMerchantId.trim() : "");
  }

  if (input.paywayEnvironment !== undefined) {
    await settingsRepo.set("payway_environment", input.paywayEnvironment === "production" ? "production" : "sandbox");
  }

  if (input.paywayCuotaSimpleEnabled !== undefined) {
    await settingsRepo.set("payway_cuota_simple_enabled", input.paywayCuotaSimpleEnabled ? "1" : "0");
  }

  if (input.getnetEnabled !== undefined) {
    await settingsRepo.set("getnet_enabled", input.getnetEnabled ? "1" : "0");
  }

  if (input.getnetClientId !== undefined) {
    await settingsRepo.set("getnet_client_id", input.getnetClientId ? input.getnetClientId.trim() : "");
  }

  if (input.getnetClientSecret !== undefined) {
    await settingsRepo.set("getnet_client_secret", input.getnetClientSecret ? input.getnetClientSecret.trim() : "");
  }

  if (input.getnetSellerId !== undefined) {
    await settingsRepo.set("getnet_seller_id", input.getnetSellerId ? input.getnetSellerId.trim() : "");
  }

  if (input.getnetEnvironment !== undefined) {
    await settingsRepo.set("getnet_environment", input.getnetEnvironment === "production" ? "production" : "sandbox");
  }

  if (input.modoEnabled !== undefined) {
    await settingsRepo.set("modo_enabled", input.modoEnabled ? "1" : "0");
  }

  if (input.modoMerchantId !== undefined) {
    await settingsRepo.set("modo_merchant_id", input.modoMerchantId ? input.modoMerchantId.trim() : "");
  }

  if (input.modoTerminalId !== undefined) {
    await settingsRepo.set("modo_terminal_id", input.modoTerminalId ? input.modoTerminalId.trim() : "");
  }

  if (input.googlePayEnabled !== undefined) {
    await settingsRepo.set("google_pay_enabled", input.googlePayEnabled ? "1" : "0");
  }

  if (input.googlePayMerchantId !== undefined) {
    await settingsRepo.set("google_pay_merchant_id", input.googlePayMerchantId ? input.googlePayMerchantId.trim() : "");
  }

  if (input.transferEnabled !== undefined) {
    await settingsRepo.set("transfer_enabled", input.transferEnabled ? "1" : "0");
  }

  if (input.transferBankName !== undefined) {
    await settingsRepo.set("transfer_bank_name", input.transferBankName ? input.transferBankName.trim() : "");
  }

  if (input.transferAccountHolder !== undefined) {
    await settingsRepo.set("transfer_account_holder", input.transferAccountHolder ? input.transferAccountHolder.trim() : "");
  }

  if (input.transferCbu !== undefined) {
    await settingsRepo.set("transfer_cbu", input.transferCbu ? input.transferCbu.trim() : "");
  }

  if (input.transferAlias !== undefined) {
    await settingsRepo.set("transfer_alias", input.transferAlias ? input.transferAlias.trim() : "");
  }

  if (input.transferCuit !== undefined) {
    await settingsRepo.set("transfer_cuit", input.transferCuit ? input.transferCuit.trim() : "");
  }

  if (input.transferDiscountPercent !== undefined) {
    const discount = Number(input.transferDiscountPercent);
    if (!Number.isInteger(discount) || discount < 0 || discount > 100) {
      throw new ValidationError("El porcentaje de descuento por transferencia debe estar entre 0 y 100.");
    }
    await settingsRepo.set("transfer_discount_percent", String(discount));
  }

  if (input.cashEnabled !== undefined) {
    await settingsRepo.set("cash_enabled", input.cashEnabled ? "1" : "0");
  }

  if (input.cashNotes !== undefined) {
    await settingsRepo.set("cash_notes", input.cashNotes ? input.cashNotes.trim() : "");
  }

  if (input.whatsappPaymentEnabled !== undefined) {
    await settingsRepo.set("whatsapp_payment_enabled", input.whatsappPaymentEnabled ? "1" : "0");
  }

  // Nuevas configuraciones JSON
  if (input.announcementBar !== undefined) {
    await settingsRepo.set("announcement_bar_json", JSON.stringify(input.announcementBar));
  }

  if (input.homeBlocks !== undefined) {
    await settingsRepo.set("home_blocks_json", JSON.stringify(input.homeBlocks));
  }

  if (input.catalogConfig !== undefined) {
    const validPageSizes = [12, 16, 24];
    const pageSize = validPageSizes.includes(Number(input.catalogConfig.pageSize))
      ? (Number(input.catalogConfig.pageSize) as 12 | 16 | 24)
      : 12;
    await settingsRepo.set(
      "catalog_config_json",
      JSON.stringify({
        ...input.catalogConfig,
        pageSize,
      })
    );
  }

  if (input.storeLocation !== undefined) {
    await settingsRepo.set("store_location_json", JSON.stringify(input.storeLocation));
    // Sincronizar address plano para compatibilidad
    const formatted = input.storeLocation.attendsPublic
      ? [
          input.storeLocation.streetAddress,
          input.storeLocation.locality,
          input.storeLocation.province,
        ]
          .map((s) => (s || "").trim())
          .filter(Boolean)
          .join(", ")
      : "";
    await settingsRepo.set("address", formatted);
  }

  if (input.storeSchedule !== undefined) {
    await settingsRepo.set("store_schedule_json", JSON.stringify(input.storeSchedule));
  }

  return getShowroomSettings(deps);
}

export class SettingsService {
  private readonly settingsRepo?: ISettingsRepository;

  constructor(depsOrRepo?: ISettingsRepository | SettingsServiceDeps) {
    if (depsOrRepo && "settingsRepo" in depsOrRepo) {
      this.settingsRepo = depsOrRepo.settingsRepo;
    } else {
      this.settingsRepo = depsOrRepo as ISettingsRepository | undefined;
    }
  }

  async getSettings(): Promise<ShowroomSettings> {
    return getShowroomSettings({ settingsRepo: this.settingsRepo });
  }

  async updateSettings(input: UpdateShowroomSettingsInput): Promise<ShowroomSettings> {
    return updateShowroomSettings(input, { settingsRepo: this.settingsRepo });
  }
}

