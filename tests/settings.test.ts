import { beforeEach, describe, expect, it } from "vitest";
import {
  getShowroomSettings,
  updateShowroomSettings,
} from "../src/services/settings.service";
import { createTestEnvironment } from "./setup-db";
import { ValidationError } from "../src/domain/errors";

describe("Servicio de Configuración del Showroom sin Deploy (BR-35, ADM-05, ADM-10)", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  it("obtiene la configuración por defecto o inicial", async () => {
    const { deps } = env;

    const config = await getShowroomSettings(deps);
    expect(config.whatsappNumber).toBeDefined();
    expect(config.showroomName).toBe("Aura Studio");
    expect(config.reservationHours).toBe(48);
  });

  it("actualiza la configuración persistiendo en base de datos sin deploy (BR-35)", async () => {
    const { deps } = env;

    const updated = await updateShowroomSettings(
      {
        whatsappNumber: "+5491122334455",
        showroomName: "Aura Studio Buenos Aires",
        aboutText: "Curaduría exclusiva de prendas y sastrería.",
        businessDescriptor: "Showroom & Archivo",
        businessVertical: "indumentaria",
        logoUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        instagramHandle: "@aurastudio.ba",
        tiktokHandle: "@aurastudio",
        address: "Honduras 4800, Palermo Soho, CABA",
        dataFiscalUrl: "https://serviciosweb.afip.gob.ar/clavefiscal/qr/default.aspx",
        reservationHours: 72,
        heroMode: "featured_carousel",
        heroTitle: "Colección Exclusiva 2026",
        heroSubtitle: "Diseño de autor en edición limitada",
        themePalette: "terracota",
        themePrimaryColor: "#b45309",
        themeFont: "playfair",
      },
      deps
    );

    expect(updated.whatsappNumber).toBe("+5491122334455");
    expect(updated.showroomName).toBe("Aura Studio Buenos Aires");
    expect(updated.aboutText).toBe("Curaduría exclusiva de prendas y sastrería.");
    expect(updated.businessDescriptor).toBe("Showroom & Archivo");
    expect(updated.businessVertical).toBe("indumentaria");
    expect(updated.logoUrl).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");
    expect(updated.instagramHandle).toBe("@aurastudio.ba");
    expect(updated.tiktokHandle).toBe("@aurastudio");
    expect(updated.address).toBe("Honduras 4800, Palermo Soho, CABA");
    expect(updated.dataFiscalUrl).toBe("https://serviciosweb.afip.gob.ar/clavefiscal/qr/default.aspx");
    expect(updated.reservationHours).toBe(72);
    expect(updated.heroMode).toBe("featured_carousel");
    expect(updated.heroTitle).toBe("Colección Exclusiva 2026");
    expect(updated.heroSubtitle).toBe("Diseño de autor en edición limitada");
    expect(updated.themePalette).toBe("terracota");
    expect(updated.themePrimaryColor).toBe("#b45309");
    expect(updated.themeFont).toBe("playfair");

    // Verificar que una llamada subsiguiente a getShowroomSettings retorna los nuevos datos
    const fetchedAgain = await getShowroomSettings(deps);
    expect(fetchedAgain.whatsappNumber).toBe("+5491122334455");
    expect(fetchedAgain.showroomName).toBe("Aura Studio Buenos Aires");
    expect(fetchedAgain.aboutText).toBe("Curaduría exclusiva de prendas y sastrería.");
    expect(fetchedAgain.businessDescriptor).toBe("Showroom & Archivo");
    expect(fetchedAgain.reservationHours).toBe(72);
  });

  it("valida campos erróneos arrojando ValidationError", async () => {
    const { deps } = env;

    await expect(
      updateShowroomSettings({ whatsappNumber: "telefono-invalido" }, deps)
    ).rejects.toThrow(ValidationError);

    await expect(
      updateShowroomSettings({ reservationHours: -5 }, deps)
    ).rejects.toThrow(ValidationError);

    await expect(
      updateShowroomSettings({ showroomName: "" }, deps)
    ).rejects.toThrow(ValidationError);

    await expect(
      updateShowroomSettings({ aboutText: "a".repeat(161) }, deps)
    ).rejects.toThrow("El texto 'Acerca de la tienda' no puede superar los 160 caracteres.");

    await expect(
      updateShowroomSettings({ businessDescriptor: "b".repeat(41) }, deps)
    ).rejects.toThrow("El descriptor de negocio no puede superar los 40 caracteres.");
  });

  it("ADM-10: cambiar el tiempo de reserva en el panel actualiza el texto dinámicamente y mantiene consistencia", async () => {
    const { deps } = env;

    // Actualizamos a 24 horas y descriptor de negocio
    await updateShowroomSettings(
      {
        reservationHours: 24,
        showroomName: "SheFit Showroom",
        aboutText: "Prendas deportivas exclusivas y accesorios.",
        businessDescriptor: "Showroom & Archivo",
        businessVertical: "indumentaria",
      },
      deps
    );

    const config = await getShowroomSettings(deps);
    expect(config.showroomName).toBe("SheFit Showroom");
    expect(config.reservationHours).toBe(24);
    expect(config.aboutText).toBe("Prendas deportivas exclusivas y accesorios.");
    expect(config.businessDescriptor).toBe("Showroom & Archivo");

    // Función de formato usada en checkout
    const resHours = config.reservationHours || 48;
    const reservationText =
      resHours === 1
        ? "1 hora"
        : resHours < 1
        ? `${Math.round(resHours * 60)} minutos`
        : `${resHours} horas`;

    expect(reservationText).toBe("24 horas");

    // Si el comercio configura 48 horas
    await updateShowroomSettings({ reservationHours: 48 }, deps);
    const config48 = await getShowroomSettings(deps);
    const resHours48 = config48.reservationHours;
    expect(`${resHours48} horas`).toBe("48 horas");
  });
});
