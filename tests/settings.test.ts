import { beforeEach, describe, expect, it } from "vitest";
import {
  getShowroomSettings,
  updateShowroomSettings,
} from "../src/services/settings.service";
import { createTestEnvironment } from "./setup-db";
import { ValidationError } from "../src/domain/errors";

describe("Servicio de Configuración del Showroom sin Deploy (BR-35)", () => {
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
        reservationHours: 72,
      },
      deps
    );

    expect(updated.whatsappNumber).toBe("+5491122334455");
    expect(updated.showroomName).toBe("Aura Studio Buenos Aires");
    expect(updated.reservationHours).toBe(72);

    // Verificar que una llamada subsiguiente a getShowroomSettings retorna los nuevos datos
    const fetchedAgain = await getShowroomSettings(deps);
    expect(fetchedAgain.whatsappNumber).toBe("+5491122334455");
    expect(fetchedAgain.showroomName).toBe("Aura Studio Buenos Aires");
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
  });
});
