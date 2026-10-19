import { ISettingsRepository } from "../domain/ports/repositories.port";
import { ValidationError } from "../domain/errors";

export interface SettingsServiceDeps {
  settingsRepo?: ISettingsRepository;
}

export type HeroMode = "editorial" | "featured_carousel" | "custom_banner";

export interface ShowroomSettings {
  whatsappNumber: string;
  showroomName: string;
  storeType?: string;
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
  themeFont: string;
  // Métodos de pago (BR-47)
  mercadopagoEnabled: boolean;
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
}

export interface UpdateShowroomSettingsInput {
  whatsappNumber?: string;
  showroomName?: string;
  storeType?: string;
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
  themeFont?: string | null;
  mercadopagoEnabled?: boolean;
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
}

const DEFAULT_WHATSAPP_NUMBER = "+5491100000000";
const DEFAULT_SHOWROOM_NAME = "Aura Studio";
const DEFAULT_STORE_TYPE = "Showroom";
const DEFAULT_RESERVATION_HOURS = 48;
const DEFAULT_HERO_MODE: HeroMode = "featured_carousel";
const DEFAULT_THEME_PALETTE = "lino";
const DEFAULT_THEME_FONT = "cormorant";
const DEFAULT_TRANSFER_DISCOUNT_PERCENT = 10;


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
  let storedThemeFont: string | null = null;
  let storedMercadopagoEnabled: string | null = null;
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

  if (settingsRepo) {
    if (typeof settingsRepo.getAll === "function") {
      const all = await settingsRepo.getAll();
      storedWhatsapp = all["whatsapp_number"] ?? null;
      storedName = all["showroom_name"] ?? null;
      storedStoreType = all["store_type"] ?? null;
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
      storedThemeFont = all["theme_font"] ?? null;
      storedMercadopagoEnabled = all["mercadopago_enabled"] ?? null;
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
    } else {
      [
        storedWhatsapp,
        storedName,
        storedStoreType,
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
        storedThemeFont,
        storedMercadopagoEnabled,
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
      ] = await Promise.all([
        settingsRepo.get("whatsapp_number"),
        settingsRepo.get("showroom_name"),
        settingsRepo.get("store_type"),
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
        settingsRepo.get("theme_font"),
        settingsRepo.get("mercadopago_enabled"),
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

  return {
    whatsappNumber: storedWhatsapp || process.env.WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER,
    showroomName: storedName || DEFAULT_SHOWROOM_NAME,
    storeType: storedStoreType && storedStoreType.trim() ? storedStoreType.trim() : DEFAULT_STORE_TYPE,
    logoUrl: storedLogo && storedLogo.trim() ? storedLogo.trim() : null,
    instagramHandle: storedInstagram && storedInstagram.trim() ? storedInstagram.trim() : null,
    tiktokHandle: storedTiktok && storedTiktok.trim() ? storedTiktok.trim() : null,
    address: storedAddress && storedAddress.trim() ? storedAddress.trim() : null,
    dataFiscalUrl: storedDataFiscal && storedDataFiscal.trim() ? storedDataFiscal.trim() : null,
    reservationHours: !Number.isNaN(parsedHours) && parsedHours > 0 ? parsedHours : DEFAULT_RESERVATION_HOURS,
    heroMode: validHeroMode,
    heroTitle: storedHeroTitle && storedHeroTitle.trim() ? storedHeroTitle.trim() : null,
    heroSubtitle: storedHeroSubtitle && storedHeroSubtitle.trim() ? storedHeroSubtitle.trim() : null,
    heroBannerUrl: storedHeroBannerUrl && storedHeroBannerUrl.trim() ? storedHeroBannerUrl.trim() : null,
    themePalette: storedThemePalette && storedThemePalette.trim() ? storedThemePalette.trim() : DEFAULT_THEME_PALETTE,
    themePrimaryColor: storedThemePrimaryColor && storedThemePrimaryColor.trim() ? storedThemePrimaryColor.trim() : null,
    themeFont: storedThemeFont && storedThemeFont.trim() ? storedThemeFont.trim() : DEFAULT_THEME_FONT,
    // Métodos de pago
    mercadopagoEnabled: storedMercadopagoEnabled !== "0",
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
    // Formato básico de dígitos y signo más
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

  if (input.themeFont !== undefined) {
    await settingsRepo.set("theme_font", input.themeFont ? input.themeFont.trim() : DEFAULT_THEME_FONT);
  }

  // Métodos de pago (BR-47)
  if (input.mercadopagoEnabled !== undefined) {
    await settingsRepo.set("mercadopago_enabled", input.mercadopagoEnabled ? "1" : "0");
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

  return getShowroomSettings(deps);
}

