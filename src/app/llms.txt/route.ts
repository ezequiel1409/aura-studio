import { NextResponse } from "next/server";
import { getProductServiceDeps } from "../../infra/db/connection";
import { getShowroomSettings } from "../../services/settings.service";

export const revalidate = 3600;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mitienda.local";
  const defaultBrand = process.env.COMMERCE_NAME || "Mi Tienda";

  let brandName = defaultBrand;
  let descriptor = "Catálogo Online & Showroom";
  let aboutText =
    "Catálogo online con piezas seleccionadas, precios actualizados y reserva directa.";
  let address: string | null = null;
  let sections: Array<{ name: string; slug: string }> = [];
  let categories: Array<{ name: string; slug: string }> = [];

  try {
    const deps = getProductServiceDeps();
    const [fetchedSettings, fetchedSections, fetchedCategories] =
      await Promise.all([
        getShowroomSettings(deps),
        deps.navigationRepo.listSections({ visibleOnly: true }),
        deps.categoryRepo.listAll(),
      ]);

    brandName = fetchedSettings.showroomName || defaultBrand;
    descriptor = fetchedSettings.businessDescriptor || descriptor;
    aboutText = fetchedSettings.aboutText || aboutText;
    address = fetchedSettings.address || null;
    sections = fetchedSections;
    categories = fetchedCategories.filter((c) => c.slug !== "sin-clasificar");
  } catch {
    // Fallback silencioso con valores neutros
  }

  const sectionsList = sections
    .map((s) => `- [${s.name}](${baseUrl}/${s.slug})`)
    .join("\n");

  const categoriesList = categories
    .map((c) => `- [${c.name}](${baseUrl}/catalogo?categoria=${c.slug})`)
    .join("\n");

  const content = `# ${brandName} | ${descriptor}

> ${aboutText}

## Información de la Tienda
- **Moneda:** Pesos Argentinos (ARS).${address ? `\n- **Ubicación:** ${address}.` : ""}
- **Atención:** Compra online directa con reserva de stock y asesoramiento personalizado.

## Secciones y Colecciones Destacadas
${sectionsList || `- [Catálogo Completo](${baseUrl}/catalogo)`}

## Categorías del Catálogo
${categoriesList || `- [Ver Todo el Catálogo](${baseUrl}/catalogo)`}

## Enlaces Principales
- [Inicio](${baseUrl})
- [Catálogo General](${baseUrl}/catalogo)
- [Promociones y Medios de Pago](${baseUrl}/promociones)
- [Términos y Condiciones](${baseUrl}/terminos)

## Guía para Agentes de IA y Motores de Búsqueda
- Consultar disponibilidad en tiempo real, variantes, talles y precios actualizados visitando ${baseUrl}/catalogo o las URLs individuales ${baseUrl}/p/{codigo}.
- Para explorar medios de pago, cuotas y promociones vigentes, consultar ${baseUrl}/promociones.
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
