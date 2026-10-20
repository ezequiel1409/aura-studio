import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { listProducts } from "../../../../services/product.service";
import { formatProductCode } from "../../../../domain/product/rules";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({
        ok: true,
        products: [],
        categories: [],
      });
    }

    const deps = getProductServiceDeps();
    const [productsRes, allCategories] = await Promise.all([
      listProducts({ search: q, sortBy: "relevance", page: 1, pageSize: 5 }, deps),
      deps.categoryRepo.listAll(),
    ]);

    const lowerQ = q.toLowerCase();
    const matchedCategories = allCategories
      .filter(
        (c) =>
          !c.isHidden &&
          !c.isSystem &&
          c.name.toLowerCase().includes(lowerQ)
      )
      .slice(0, 4)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));

    const matchedProducts = productsRes.items.map((p) => {
      const paddedCode = p.code.toString().padStart(3, "0");
      return {
        id: p.id,
        code: p.code,
        formattedCode: formatProductCode(p.code),
        title: p.title || `Pieza ${formatProductCode(p.code)}`,
        priceCents: p.priceCents,
        compareAtPriceCents: p.compareAtPriceCents ?? null,
        currency: p.currency,
        href: `/p/${paddedCode}`,
        thumbUrl:
          p.photos && p.photos.length > 0
            ? p.photos[0].keyThumb || p.photos[0].keyFull
            : null,
      };
    });

    return NextResponse.json({
      ok: true,
      products: matchedProducts,
      categories: matchedCategories,
    });
  } catch {
    return NextResponse.json({
      ok: true,
      products: [],
      categories: [],
    });
  }
}

