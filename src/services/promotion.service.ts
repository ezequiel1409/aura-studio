import { ValidationError } from "../domain/errors";
import { IPromotionRepository } from "../domain/ports/repositories.port";
import {
  Bank,
  BannerPlacement,
  BenefitType,
  DayOfWeekCode,
  HomeBanner,
  Promotion,
  UpsertBankInput,
  UpsertHomeBannerInput,
  UpsertPromotionInput,
} from "../domain/promotion/types";

export interface PromotionServiceDeps {
  promotionRepo: IPromotionRepository;
}

export type PromotionComputedStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "PAUSED";

export interface PromotionWithStatus extends Promotion {
  computedStatus: PromotionComputedStatus;
}

export function getPromotionComputedStatus(
  promo: Promotion,
  now: number = Date.now()
): PromotionComputedStatus {
  if (!promo.isActive) return "PAUSED";
  if (promo.endsAt < now) return "EXPIRED";
  if (promo.startsAt > now) return "SCHEDULED";
  return "ACTIVE";
}

/**
 * Obtiene promociones vigentes y programadas ("Próximamente") con filtros livianos por banco, tipo y día.
 * Las promociones vencidas se ocultan solas.
 */
export async function listPublicPromotions(
  deps: PromotionServiceDeps,
  filters?: {
    bankId?: number;
    benefitType?: BenefitType;
    day?: DayOfWeekCode;
    now?: number;
  }
): Promise<{
  active: Promotion[];
  upcoming: Promotion[];
  banks: Bank[];
}> {
  const now = filters?.now ?? Date.now();
  const [allPromos, allBanks] = await Promise.all([
    deps.promotionRepo.listPromotions({ activeOnly: false }),
    deps.promotionRepo.listBanks({ activeOnly: true }),
  ]);

  const matchesFilters = (p: Promotion): boolean => {
    if (filters?.bankId && p.bankId !== filters.bankId) return false;
    if (filters?.benefitType && p.benefitType !== filters.benefitType) return false;
    if (filters?.day && !p.validDays.includes(filters.day)) return false;
    return true;
  };

  const active = allPromos.filter(
    (p) =>
      p.isActive &&
      p.startsAt <= now &&
      p.endsAt >= now &&
      matchesFilters(p)
  );

  const upcoming = allPromos.filter(
    (p) =>
      p.isActive &&
      p.startsAt > now &&
      matchesFilters(p)
  );

  return {
    active,
    upcoming,
    banks: allBanks,
  };
}

export async function listAdminPromotions(
  deps: PromotionServiceDeps,
  now: number = Date.now()
): Promise<PromotionWithStatus[]> {
  const all = await deps.promotionRepo.listPromotions({ activeOnly: false });
  return all.map((p) => ({
    ...p,
    computedStatus: getPromotionComputedStatus(p, now),
  }));
}

/**
 * Reglas de la promo bancaria (Sección 5.3):
 * - No se puede publicar sin términos y condiciones ni fechas de vigencia.
 * - Datos obligatorios: banco (si es bancaria), beneficio, días, vigencia y medios de pago alcanzados.
 */
export async function upsertPromotion(
  input: UpsertPromotionInput,
  deps: PromotionServiceDeps
): Promise<Promotion> {
  if (!input.title || !input.title.trim()) {
    throw new ValidationError("El título de la promoción es obligatorio.");
  }
  const benefitSummary = (input.benefitSummary || input.benefitShort || "").trim();
  if (!benefitSummary) {
    throw new ValidationError("El resumen del beneficio es obligatorio.");
  }
  const resolvedType = input.type || input.promoType || "BANK";
  if (resolvedType === "BANK" && !input.bankId) {
    throw new ValidationError("Seleccioná un banco para publicar una promoción bancaria.");
  }
  if (!input.termsAndConditions || !input.termsAndConditions.trim()) {
    throw new ValidationError(
      "No se puede publicar una promoción sin términos y condiciones."
    );
  }
  if (!input.startsAt || !input.endsAt || input.endsAt <= input.startsAt) {
    throw new ValidationError(
      "Las fechas de inicio y fin de vigencia son obligatorias y la fecha de fin debe ser posterior al inicio."
    );
  }
  const resolvedDays = input.validDays || input.daysOfWeek || [];
  if (resolvedDays.length === 0) {
    throw new ValidationError("Seleccioná al menos un día de la semana en que aplica la promoción.");
  }
  if (!input.paymentMethods || input.paymentMethods.length === 0) {
    throw new ValidationError("Indicá al menos un medio de pago alcanzado.");
  }

  return deps.promotionRepo.upsertPromotion({
    ...input,
    type: resolvedType,
    benefitSummary,
    validDays: resolvedDays,
  });
}

export async function duplicatePromotion(
  id: number,
  deps: PromotionServiceDeps
): Promise<Promotion> {
  const existing = await deps.promotionRepo.findPromotionById(id);
  if (!existing) {
    throw new ValidationError("No se encontró la promoción a duplicar.");
  }

  return deps.promotionRepo.upsertPromotion({
    type: existing.type,
    bankId: existing.bankId,
    slug: `${existing.slug}-copia-${Date.now().toString().slice(-4)}`,
    title: `${existing.title} (Copia)`,
    benefitSummary: existing.benefitSummary,
    benefitType: existing.benefitType,
    capCents: existing.capCents,
    validDays: existing.validDays,
    paymentMethods: existing.paymentMethods,
    termsAndConditions: existing.termsAndConditions,
    officialBankUrl: existing.officialBankUrl,
    showInHomeBanner: false,
    startsAt: existing.startsAt,
    endsAt: existing.endsAt,
    position: existing.position + 1,
    isActive: false,
  });
}

export async function listActiveHomeBanners(
  deps: PromotionServiceDeps,
  placement: BannerPlacement = "HOME_HERO",
  now: number = Date.now()
): Promise<HomeBanner[]> {
  return deps.promotionRepo.listHomeBanners({
    placement,
    activeOnly: true,
    now,
  });
}

export class PromotionService {
  private readonly promotionRepo: IPromotionRepository;

  constructor(depsOrRepo: IPromotionRepository | PromotionServiceDeps) {
    if ("promotionRepo" in depsOrRepo) {
      this.promotionRepo = depsOrRepo.promotionRepo;
    } else {
      this.promotionRepo = depsOrRepo;
    }
  }

  async listActivePublicPromotions(now: number = Date.now()): Promise<Promotion[]> {
    const res = await listPublicPromotions({ promotionRepo: this.promotionRepo }, { now });
    return [...res.active, ...res.upcoming];
  }

  async listAllPromotions(now: number = Date.now()): Promise<PromotionWithStatus[]> {
    return listAdminPromotions({ promotionRepo: this.promotionRepo }, now);
  }

  async listBanks(options?: { activeOnly?: boolean }): Promise<Bank[]> {
    return this.promotionRepo.listBanks(options);
  }

  async listActiveHomeBanners(
    placement: BannerPlacement = "HOME_HERO",
    now: number = Date.now()
  ): Promise<HomeBanner[]> {
    return listActiveHomeBanners({ promotionRepo: this.promotionRepo }, placement, now);
  }

  async findPublicPromotionBySlug(slug: string): Promise<Promotion | null> {
    return this.promotionRepo.findPromotionBySlug(slug);
  }

  async upsertPromotion(input: UpsertPromotionInput): Promise<Promotion> {
    return upsertPromotion(input, { promotionRepo: this.promotionRepo });
  }

  async duplicatePromotion(id: number): Promise<Promotion> {
    return duplicatePromotion(id, { promotionRepo: this.promotionRepo });
  }

  async deletePromotion(id: number): Promise<void> {
    return this.promotionRepo.deletePromotion(id);
  }

  async upsertBank(input: UpsertBankInput): Promise<Bank> {
    return this.promotionRepo.upsertBank(input);
  }

  async upsertHomeBanner(input: UpsertHomeBannerInput): Promise<HomeBanner> {
    return this.promotionRepo.upsertHomeBanner(input);
  }
}

