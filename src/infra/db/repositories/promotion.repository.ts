import { and, asc, eq, gte, lte, or, isNull } from "drizzle-orm";
import {
  Bank,
  BannerPlacement,
  BenefitType,
  DayOfWeekCode,
  HomeBanner,
  Promotion,
  PromotionType,
  UpsertBankInput,
  UpsertHomeBannerInput,
  UpsertPromotionInput,
} from "../../../domain/promotion/types";
import { IPromotionRepository } from "../../../domain/ports/repositories.port";
import { DbClient } from "../client";
import { banks, homeBanners, promotions } from "../schema";
import { DEFAULT_ARGENTINE_BANKS } from "../../../domain/promotion/default-banks";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class DrizzlePromotionRepository implements IPromotionRepository {
  constructor(private readonly db: DbClient) {}

  async listBanks(options?: { activeOnly?: boolean }): Promise<Bank[]> {
    try {
      let rows = options?.activeOnly
        ? await this.db
            .select()
            .from(banks)
            .where(eq(banks.isActive, 1))
            .orderBy(asc(banks.name))
        : await this.db.select().from(banks).orderBy(asc(banks.name));

      if (rows.length < DEFAULT_ARGENTINE_BANKS.length) {
        for (const preset of DEFAULT_ARGENTINE_BANKS) {
          try {
            await this.db
              .insert(banks)
              .values({
                name: preset.name,
                slug: preset.slug,
                logoUrl: preset.logoUrl ?? "",
                brandColor: preset.brandColor,
                officialUrl: preset.officialUrl ?? null,
                isActive: 1,
              })
              .onConflictDoNothing();
          } catch {
            // omit conflict
          }
        }

        rows = options?.activeOnly
          ? await this.db
              .select()
              .from(banks)
              .where(eq(banks.isActive, 1))
              .orderBy(asc(banks.name))
          : await this.db.select().from(banks).orderBy(asc(banks.name));
      }

      return rows.map((r) => this.mapBank(r));
    } catch {
      return [];
    }
  }

  async findBankById(id: number): Promise<Bank | null> {
    try {
      const [row] = await this.db.select().from(banks).where(eq(banks.id, id));
      return row ? this.mapBank(row) : null;
    } catch {
      return null;
    }
  }

  async upsertBank(input: UpsertBankInput): Promise<Bank> {
    const slug = slugify(input.slug || input.name) || `banco-${Date.now()}`;
    const brandColor = (input.brandColor || input.accentColor || "").trim() || "#1c1917";

    if (input.id) {
      const [updated] = await this.db
        .update(banks)
        .set({
          name: input.name.trim(),
          slug,
          logoUrl: (input.logoUrl || "").trim(),
          brandColor,
          officialUrl: input.officialUrl?.trim() || null,
          isActive: input.isActive === false ? 0 : 1,
        })
        .where(eq(banks.id, input.id))
        .returning();

      return this.mapBank(updated);
    }

    const [inserted] = await this.db
      .insert(banks)
      .values({
        name: input.name.trim(),
        slug,
        logoUrl: (input.logoUrl || "").trim(),
        brandColor,
        officialUrl: input.officialUrl?.trim() || null,
        isActive: input.isActive === false ? 0 : 1,
      })
      .returning();

    return this.mapBank(inserted);
  }

  async deleteBank(id: number): Promise<void> {
    await this.db.delete(banks).where(eq(banks.id, id));
  }

  async listPromotions(options?: {
    activeOnly?: boolean;
    now?: number;
  }): Promise<Promotion[]> {
    try {
      const allBanks = await this.listBanks();
      const bankMap = new Map<number, Bank>(allBanks.map((b) => [b.id, b]));

      let rows = await this.db
        .select()
        .from(promotions)
        .orderBy(asc(promotions.position), asc(promotions.id));

      if (options?.activeOnly) {
        const now = options.now ?? Date.now();
        rows = rows.filter(
          (r) => r.isActive === 1 && r.startsAt <= now && r.endsAt >= now
        );
      }

      return rows.map((r) => this.mapPromotion(r, r.bankId ? bankMap.get(r.bankId) || null : null));
    } catch {
      return [];
    }
  }

  async findPromotionBySlug(slug: string): Promise<Promotion | null> {
    try {
      const [row] = await this.db
        .select()
        .from(promotions)
        .where(eq(promotions.slug, slugify(slug)));

      if (!row) return null;
      const bank = row.bankId ? await this.findBankById(row.bankId) : null;
      return this.mapPromotion(row, bank);
    } catch {
      return null;
    }
  }

  async findPromotionById(id: number): Promise<Promotion | null> {
    try {
      const [row] = await this.db
        .select()
        .from(promotions)
        .where(eq(promotions.id, id));

      if (!row) return null;
      const bank = row.bankId ? await this.findBankById(row.bankId) : null;
      return this.mapPromotion(row, bank);
    } catch {
      return null;
    }
  }

  async upsertPromotion(input: UpsertPromotionInput): Promise<Promotion> {
    const now = Date.now();
    const slug = slugify(input.slug || input.title) || `promo-${now}`;
    const resolvedType = input.type || input.promoType || "BANK";
    const resolvedBenefitSummary = (input.benefitSummary || input.benefitShort || "").trim();
    const resolvedDays = input.validDays || input.daysOfWeek || [];
    const resolvedOfficialUrl =
      (input.officialBankUrl !== undefined ? input.officialBankUrl : input.officialUrl)?.trim() ||
      null;
    const isActiveBool =
      input.status === "PAUSED" ? false : input.isActive === false ? false : true;

    const validDaysJson = JSON.stringify(resolvedDays);
    const paymentMethodsJson = JSON.stringify(input.paymentMethods || []);

    if (input.id) {
      const [updated] = await this.db
        .update(promotions)
        .set({
          type: resolvedType,
          bankId: resolvedType === "BANK" ? (input.bankId ?? null) : null,
          slug,
          title: input.title.trim(),
          benefitSummary: resolvedBenefitSummary,
          benefitType: input.benefitType,
          capCents: input.capCents ?? null,
          validDaysJson,
          paymentMethodsJson,
          termsAndConditions: input.termsAndConditions.trim(),
          officialBankUrl: resolvedOfficialUrl,
          showInHomeBanner: input.showInHomeBanner ? 1 : 0,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          position: input.position ?? 0,
          isActive: isActiveBool ? 1 : 0,
          updatedAt: now,
        })
        .where(eq(promotions.id, input.id))
        .returning();

      const bank = updated.bankId ? await this.findBankById(updated.bankId) : null;
      return this.mapPromotion(updated, bank);
    }

    const [inserted] = await this.db
      .insert(promotions)
      .values({
        type: resolvedType,
        bankId: resolvedType === "BANK" ? (input.bankId ?? null) : null,
        slug,
        title: input.title.trim(),
        benefitSummary: resolvedBenefitSummary,
        benefitType: input.benefitType,
        capCents: input.capCents ?? null,
        validDaysJson,
        paymentMethodsJson,
        termsAndConditions: input.termsAndConditions.trim(),
        officialBankUrl: resolvedOfficialUrl,
        showInHomeBanner: input.showInHomeBanner ? 1 : 0,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        position: input.position ?? 0,
        isActive: isActiveBool ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const bank = inserted.bankId ? await this.findBankById(inserted.bankId) : null;
    return this.mapPromotion(inserted, bank);
  }

  async deletePromotion(id: number): Promise<void> {
    await this.db.delete(promotions).where(eq(promotions.id, id));
  }

  async listHomeBanners(options?: {
    placement?: BannerPlacement;
    activeOnly?: boolean;
    now?: number;
  }): Promise<HomeBanner[]> {
    try {
      const conditions = [];
      if (options?.placement) {
        conditions.push(eq(homeBanners.placement, options.placement));
      }
      if (options?.activeOnly) {
        const now = options.now ?? Date.now();
        conditions.push(eq(homeBanners.isActive, 1));
        conditions.push(or(isNull(homeBanners.startsAt), lte(homeBanners.startsAt, now)));
        conditions.push(or(isNull(homeBanners.endsAt), gte(homeBanners.endsAt, now)));
      }

      const rows = await this.db
        .select()
        .from(homeBanners)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(homeBanners.position), asc(homeBanners.id));

      const allPromos = await this.db.select().from(promotions);
      const promoSlugById = new Map<number, string>(
        allPromos.map((p) => [p.id, p.slug])
      );

      return rows.map((r) =>
        this.mapBanner(
          r,
          r.promotionId ? promoSlugById.get(r.promotionId) || null : null
        )
      );
    } catch {
      return [];
    }
  }

  async upsertHomeBanner(input: UpsertHomeBannerInput): Promise<HomeBanner> {
    let ctaHref = input.ctaHref.trim();
    let promotionSlug: string | null = null;

    if (input.promotionId) {
      const promo = await this.findPromotionById(input.promotionId);
      if (promo) {
        promotionSlug = promo.slug;
        ctaHref = `/promociones/${promo.slug}`;
      }
    }

    if (input.id) {
      const [updated] = await this.db
        .update(homeBanners)
        .set({
          placement: input.placement || "HOME_HERO",
          desktopImageUrl: input.desktopImageUrl.trim(),
          mobileImageUrl: input.mobileImageUrl.trim() || input.desktopImageUrl.trim(),
          title: input.title.trim(),
          subtitle: input.subtitle?.trim() || null,
          ctaLabel: input.ctaLabel.trim(),
          ctaHref,
          promotionId: input.promotionId ?? null,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
          position: input.position ?? 0,
          isActive: input.isActive === false ? 0 : 1,
        })
        .where(eq(homeBanners.id, input.id))
        .returning();

      return this.mapBanner(updated, promotionSlug);
    }

    const [inserted] = await this.db
      .insert(homeBanners)
      .values({
        placement: input.placement || "HOME_HERO",
        desktopImageUrl: input.desktopImageUrl.trim(),
        mobileImageUrl: input.mobileImageUrl.trim() || input.desktopImageUrl.trim(),
        title: input.title.trim(),
        subtitle: input.subtitle?.trim() || null,
        ctaLabel: input.ctaLabel.trim(),
        ctaHref,
        promotionId: input.promotionId ?? null,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        position: input.position ?? 0,
        isActive: input.isActive === false ? 0 : 1,
      })
      .returning();

    return this.mapBanner(inserted, promotionSlug);
  }

  async deleteHomeBanner(id: number): Promise<void> {
    await this.db.delete(homeBanners).where(eq(homeBanners.id, id));
  }

  private mapBank(row: typeof banks.$inferSelect): Bank {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      logoUrl: row.logoUrl || null,
      brandColor: row.brandColor,
      accentColor: row.brandColor,
      officialUrl: row.officialUrl,
      isActive: Boolean(row.isActive),
    };
  }

  private mapPromotion(
    row: typeof promotions.$inferSelect,
    bank: Bank | null
  ): Promotion {
    let validDays: DayOfWeekCode[] = [];
    try {
      const parsed = JSON.parse(row.validDaysJson || "[]");
      if (Array.isArray(parsed)) validDays = parsed;
    } catch {
      validDays = [];
    }

    let paymentMethods: string[] = [];
    try {
      const parsed = JSON.parse(row.paymentMethodsJson || "[]");
      if (Array.isArray(parsed)) paymentMethods = parsed.map((m) => String(m));
    } catch {
      paymentMethods = [];
    }

    const now = Date.now();
    const isActive = Boolean(row.isActive);
    const status = !isActive
      ? "PAUSED"
      : row.endsAt < now
      ? "EXPIRED"
      : row.startsAt > now
      ? "SCHEDULED"
      : "ACTIVE";

    return {
      id: row.id,
      type: row.type as PromotionType,
      promoType: row.type as PromotionType,
      bankId: row.bankId,
      bank,
      slug: row.slug,
      title: row.title,
      benefitSummary: row.benefitSummary,
      benefitShort: row.benefitSummary,
      benefitType: row.benefitType as BenefitType,
      modality: row.benefitType === "CASHBACK" ? "REIMBURSEMENT" : "INSTANT",
      capCents: row.capCents,
      minPurchaseCents: null,
      validDays,
      daysOfWeek: validDays,
      paymentMethods,
      termsAndConditions: row.termsAndConditions,
      officialBankUrl: row.officialBankUrl,
      officialUrl: row.officialBankUrl,
      showInHomeBanner: Boolean(row.showInHomeBanner),
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      position: row.position,
      isActive,
      status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapBanner(
    row: typeof homeBanners.$inferSelect,
    promotionSlug: string | null
  ): HomeBanner {
    const resolvedHref =
      row.promotionId && promotionSlug ? `/promociones/${promotionSlug}` : row.ctaHref;
    return {
      id: row.id,
      placement: row.placement as BannerPlacement,
      desktopImageUrl: row.desktopImageUrl,
      mobileImageUrl: row.mobileImageUrl || row.desktopImageUrl,
      title: row.title,
      subtitle: row.subtitle,
      ctaLabel: row.ctaLabel,
      ctaHref: resolvedHref,
      promotionId: row.promotionId,
      promotionSlug,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      position: row.position,
      isActive: Boolean(row.isActive),
    };
  }
}
