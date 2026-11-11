import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import {
  duplicatePromotion,
  listAdminPromotions,
  upsertPromotion,
} from "../../../../services/promotion.service";
import { BenefitType } from "../../../../domain/promotion/types";
import { revalidatePromotions } from "../../../../infra/cache/revalidation";

function parseTimestamp(val: unknown, fallback: number = Date.now()): number {
  if (typeof val === "number" && !Number.isNaN(val) && val > 0) return val;
  if (typeof val === "string") {
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const deps = getProductServiceDeps();
    const [promotions, banks, banners] = await Promise.all([
      listAdminPromotions(deps),
      deps.promotionRepo.listBanks({ activeOnly: false }),
      deps.promotionRepo.listHomeBanners({ activeOnly: false }),
    ]);
    return NextResponse.json({ ok: true, promotions, banks, banners });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener promociones";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const deps = getProductServiceDeps();

    // 1. Manejo de Bancos
    if (body.action === "upsert_bank" || body.entity === "bank") {
      const bank = await deps.promotionRepo.upsertBank({
        id: body.id ? Number(body.id) : undefined,
        name: body.name,
        slug: body.slug,
        logoUrl: body.logoUrl,
        brandColor: body.brandColor || body.accentColor,
        officialUrl: body.officialUrl,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      });
      const banks = await deps.promotionRepo.listBanks({ activeOnly: false });
      revalidatePromotions();
      return NextResponse.json({ ok: true, bank, banks });
    }

    // 2. Duplicación de Promociones
    if (
      (body.action === "duplicate_promotion" || body.entity === "duplicate") &&
      body.id
    ) {
      const duplicated = await duplicatePromotion(Number(body.id), deps);
      const promotions = await listAdminPromotions(deps);
      revalidatePromotions();
      return NextResponse.json({ ok: true, promotion: duplicated, promotions });
    }

    // 3. Manejo de Banners de Inicio (Carrusel de Portada)
    if (body.action === "upsert_banner") {
      const banner = await deps.promotionRepo.upsertHomeBanner({
        id: body.id ? Number(body.id) : undefined,
        placement: body.placement || "HOME_HERO",
        desktopImageUrl: (body.desktopImageUrl || "").trim(),
        mobileImageUrl: (body.mobileImageUrl || body.desktopImageUrl || "").trim(),
        title: (body.title || "").trim(),
        subtitle: body.subtitle ? body.subtitle.trim() : null,
        ctaLabel: (body.ctaLabel || "Explorar colección").trim(),
        ctaHref: (body.ctaHref || "/catalogo").trim(),
        promotionId: body.promotionId ? Number(body.promotionId) : null,
        startsAt: body.startsAt ? parseTimestamp(body.startsAt) : null,
        endsAt: body.endsAt ? parseTimestamp(body.endsAt) : null,
        position: body.position !== undefined ? Number(body.position) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      });
      const banners = await deps.promotionRepo.listHomeBanners({ activeOnly: false });
      revalidatePromotions();
      return NextResponse.json({ ok: true, banner, banners });
    }

    if (body.action === "reorder_banners" && Array.isArray(body.banners)) {
      for (const item of body.banners) {
        if (item.id) {
          await deps.promotionRepo.upsertHomeBanner({
            id: Number(item.id),
            placement: item.placement || "HOME_HERO",
            desktopImageUrl: item.desktopImageUrl || "",
            mobileImageUrl: item.mobileImageUrl || item.desktopImageUrl || "",
            title: item.title || "",
            subtitle: item.subtitle || null,
            ctaLabel: item.ctaLabel || "Explorar",
            ctaHref: item.ctaHref || "/catalogo",
            promotionId: item.promotionId ? Number(item.promotionId) : null,
            position: Number(item.position) || 0,
            isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
          });
        }
      }
      const banners = await deps.promotionRepo.listHomeBanners({ activeOnly: false });
      revalidatePromotions();
      return NextResponse.json({ ok: true, banners });
    }

    if (body.action === "toggle_banner_active" && body.id) {
      const allBanners = await deps.promotionRepo.listHomeBanners({ activeOnly: false });
      const target = allBanners.find((b) => b.id === Number(body.id));
      if (target) {
        await deps.promotionRepo.upsertHomeBanner({
          id: target.id,
          placement: target.placement || "HOME_HERO",
          desktopImageUrl: target.desktopImageUrl || "",
          mobileImageUrl: target.mobileImageUrl || target.desktopImageUrl || "",
          title: target.title,
          subtitle: target.subtitle,
          ctaLabel: target.ctaLabel,
          ctaHref: target.ctaHref,
          startsAt: target.startsAt,
          endsAt: target.endsAt,
          position: target.position,
          isActive: !target.isActive,
        });
      }
      const banners = await deps.promotionRepo.listHomeBanners({ activeOnly: false });
      revalidatePromotions();
      return NextResponse.json({ ok: true, banners });
    }

    // 4. Upsert de Promoción
    const resolvedType = body.type || body.promoType || "BANK";
    const resolvedBenefitSummary = (body.benefitSummary || body.benefitShort || "").trim();
    
    // Mapeo flexible de modalidad/beneficio
    let resolvedBenefitType: BenefitType = "DISCOUNT";
    if (body.benefitType) {
      resolvedBenefitType = body.benefitType;
    } else if (body.modality === "REIMBURSEMENT") {
      resolvedBenefitType = "CASHBACK";
    } else if (body.modality === "INSTANT") {
      resolvedBenefitType = "DISCOUNT";
    }

    const resolvedDays = body.validDays || body.daysOfWeek || [];
    const resolvedMethods = body.paymentMethods || [];

    const startsAt = parseTimestamp(body.startsAt, Date.now());
    const endsAt = parseTimestamp(body.endsAt, Date.now() + 30 * 24 * 60 * 60 * 1000);

    const isPaused = body.status === "PAUSED" || body.status === "DRAFT";
    const isActive = isPaused ? false : body.isActive !== undefined ? Boolean(body.isActive) : true;

    const promotion = await upsertPromotion(
      {
        id: body.id ? Number(body.id) : undefined,
        type: resolvedType,
        bankId: resolvedType === "BANK" && body.bankId ? Number(body.bankId) : null,
        slug: body.slug,
        title: body.title,
        benefitSummary: resolvedBenefitSummary,
        benefitType: resolvedBenefitType,
        capCents:
          body.capCents !== null && body.capCents !== undefined
            ? Number(body.capCents)
            : null,
        minPurchaseCents:
          body.minPurchaseCents !== null && body.minPurchaseCents !== undefined
            ? Number(body.minPurchaseCents)
            : null,
        validDays: resolvedDays,
        paymentMethods: resolvedMethods,
        termsAndConditions: body.termsAndConditions,
        officialBankUrl: body.officialBankUrl || body.officialUrl,
        showInHomeBanner: Boolean(body.showInHomeBanner),
        startsAt,
        endsAt,
        position: body.position ?? 0,
        isActive,
      },
      deps
    );

    const promotions = await listAdminPromotions(deps);
    revalidatePromotions(promotion.slug);
    return NextResponse.json({ ok: true, promotion, promotions });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al guardar promoción";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export const PUT = POST;

export async function DELETE(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const target = searchParams.get("target") || "promotion";

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido." }, { status: 400 });
    }

    const deps = getProductServiceDeps();
    if (target === "bank") {
      await deps.promotionRepo.deleteBank(id);
    } else if (target === "banner") {
      await deps.promotionRepo.deleteHomeBanner(id);
    } else {
      await deps.promotionRepo.deletePromotion(id);
    }

    const [promotions, banks, banners] = await Promise.all([
      listAdminPromotions(deps),
      deps.promotionRepo.listBanks({ activeOnly: false }),
      deps.promotionRepo.listHomeBanners({ activeOnly: false }),
    ]);
    revalidatePromotions();

    return NextResponse.json({ ok: true, promotions, banks, banners });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
