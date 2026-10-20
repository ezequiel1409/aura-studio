import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import {
  duplicatePromotion,
  listAdminPromotions,
  upsertPromotion,
} from "../../../../services/promotion.service";

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

    if (body.action === "upsert_bank") {
      const bank = await deps.promotionRepo.upsertBank({
        id: body.id,
        name: body.name,
        slug: body.slug,
        logoUrl: body.logoUrl,
        brandColor: body.brandColor,
        officialUrl: body.officialUrl,
        isActive: body.isActive,
      });
      const banks = await deps.promotionRepo.listBanks({ activeOnly: false });
      return NextResponse.json({ ok: true, bank, banks });
    }

    if (body.action === "duplicate_promotion" && body.id) {
      const duplicated = await duplicatePromotion(Number(body.id), deps);
      const promotions = await listAdminPromotions(deps);
      return NextResponse.json({ ok: true, promotion: duplicated, promotions });
    }

    if (body.action === "upsert_banner") {
      const banner = await deps.promotionRepo.upsertHomeBanner({
        id: body.id,
        placement: body.placement,
        desktopImageUrl: body.desktopImageUrl,
        mobileImageUrl: body.mobileImageUrl,
        title: body.title,
        subtitle: body.subtitle,
        ctaLabel: body.ctaLabel,
        ctaHref: body.ctaHref,
        promotionId: body.promotionId ? Number(body.promotionId) : null,
        startsAt: body.startsAt ?? null,
        endsAt: body.endsAt ?? null,
        position: body.position ?? 0,
        isActive: body.isActive,
      });
      const banners = await deps.promotionRepo.listHomeBanners({ activeOnly: false });
      return NextResponse.json({ ok: true, banner, banners });
    }

    const promotion = await upsertPromotion(
      {
        id: body.id,
        type: body.type || "BANK",
        bankId: body.bankId ? Number(body.bankId) : null,
        slug: body.slug,
        title: body.title,
        benefitSummary: body.benefitSummary,
        benefitType: body.benefitType,
        capCents:
          body.capCents !== null && body.capCents !== undefined
            ? Number(body.capCents)
            : null,
        validDays: body.validDays || [],
        paymentMethods: body.paymentMethods || [],
        termsAndConditions: body.termsAndConditions,
        officialBankUrl: body.officialBankUrl,
        showInHomeBanner: Boolean(body.showInHomeBanner),
        startsAt: Number(body.startsAt),
        endsAt: Number(body.endsAt),
        position: body.position ?? 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
      deps
    );

    const promotions = await listAdminPromotions(deps);
    return NextResponse.json({ ok: true, promotion, promotions });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al guardar promoción";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

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

    return NextResponse.json({ ok: true, promotions, banks, banners });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

