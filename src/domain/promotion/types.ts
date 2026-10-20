export type PromotionType = "BANK" | "STORE";
export type BenefitType = "INSTALLMENTS" | "DISCOUNT" | "CASHBACK" | "BOTH";
export type DayOfWeekCode =
  | "L"
  | "M"
  | "X"
  | "J"
  | "V"
  | "S"
  | "D"
  | "lun"
  | "mar"
  | "mie"
  | "jue"
  | "vie"
  | "sab"
  | "dom";

export type PromotionModality = "INSTANT" | "REIMBURSEMENT";
export type PromotionStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "PAUSED";

export interface Bank {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string;
  accentColor: string;
  officialUrl: string | null;
  isActive: boolean;
}

export interface Promotion {
  id: number;
  type: PromotionType;
  promoType: PromotionType;
  bankId: number | null;
  bank?: Bank | null;
  slug: string;
  title: string;
  benefitSummary: string;
  benefitShort: string;
  benefitType: BenefitType;
  modality: PromotionModality;
  capCents: number | null;
  minPurchaseCents: number | null;
  validDays: DayOfWeekCode[];
  daysOfWeek: DayOfWeekCode[];
  paymentMethods: string[];
  termsAndConditions: string;
  officialBankUrl: string | null;
  officialUrl: string | null;
  organizer?: string | null;
  portfolio?: string | null;
  cftPercent?: string | null;
  tnaPercent?: string | null;
  exclusions?: string | null;
  combinableWith?: string | null;
  howToUseSteps?: string[];
  showInHomeBanner: boolean;
  startsAt: number;
  endsAt: number;
  position: number;
  isActive: boolean;
  status: PromotionStatus;
  createdAt: number;
  updatedAt: number;
}

export type BannerPlacement = "HOME_HERO" | "PROMOTIONS_HERO" | "SALE_BANNER";

export interface HomeBanner {
  id: number;
  placement?: BannerPlacement;
  desktopImageUrl: string | null;
  mobileImageUrl: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string;
  ctaHref: string;
  promotionId?: number | null;
  promotionSlug?: string | null;
  startsAt: number | null;
  endsAt: number | null;
  position: number;
  isActive: boolean;
}

export interface UpsertBankInput {
  id?: number;
  name: string;
  slug?: string;
  logoUrl?: string | null;
  brandColor?: string;
  accentColor?: string;
  officialUrl?: string | null;
  isActive?: boolean;
}

export interface UpsertPromotionInput {
  id?: number;
  type?: PromotionType;
  promoType?: PromotionType;
  bankId?: number | null;
  slug?: string;
  title: string;
  benefitSummary?: string;
  benefitShort?: string;
  benefitType: BenefitType;
  modality?: PromotionModality;
  capCents?: number | null;
  minPurchaseCents?: number | null;
  validDays?: DayOfWeekCode[];
  daysOfWeek?: DayOfWeekCode[];
  paymentMethods: string[];
  termsAndConditions: string;
  officialBankUrl?: string | null;
  officialUrl?: string | null;
  organizer?: string | null;
  portfolio?: string | null;
  cftPercent?: string | null;
  tnaPercent?: string | null;
  exclusions?: string | null;
  combinableWith?: string | null;
  showInHomeBanner?: boolean;
  startsAt: number;
  endsAt: number;
  position?: number;
  isActive?: boolean;
  status?: PromotionStatus;
}

export interface UpsertHomeBannerInput {
  id?: number;
  placement?: BannerPlacement;
  desktopImageUrl: string;
  mobileImageUrl: string;
  title: string;
  subtitle?: string | null;
  ctaLabel: string;
  ctaHref: string;
  promotionId?: number | null;
  startsAt?: number | null;
  endsAt?: number | null;
  position?: number;
  isActive?: boolean;
}

