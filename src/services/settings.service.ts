import { ISettingsRepository } from "../domain/ports/repositories.port";
import { ValidationError } from "../domain/errors";

export interface SettingsServiceDeps {
  settingsRepo?: ISettingsRepository;
}

export interface ShowroomSettings {
  whatsappNumber: string;
  showroomName: string;
  reservationHours: number;
}

export interface UpdateShowroomSettingsInput {
  whatsappNumber?: string;
  showroomName?: string;
  reservationHours?: number;
}

const DEFAULT_WHATSAPP_NUMBER = "+5491100000000";
const DEFAULT_SHOWROOM_NAME = "Aura Studio";
const DEFAULT_RESERVATION_HOURS = 48;

/**
 * BR-35: Obtiene la configuración del showroom desde la base de datos sin deploy.
 * Si alguna clave no fue configurada en DB, utiliza los valores por defecto del sistema/entorno.
 */
export async function getShowroomSettings(
  deps: SettingsServiceDeps
): Promise<ShowroomSettings> {
  const { settingsRepo } = deps;

  let storedWhatsapp: string | null = null;
  let storedName: string | null = null;
  let storedHours: string | null = null;

  if (settingsRepo) {
    [storedWhatsapp, storedName, storedHours] = await Promise.all([
      settingsRepo.get("whatsapp_number"),
      settingsRepo.get("showroom_name"),
      settingsRepo.get("reservation_hours"),
    ]);
  }

  const parsedHours = storedHours ? parseInt(storedHours, 10) : NaN;

  return {
    whatsappNumber: storedWhatsapp || process.env.WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER,
    showroomName: storedName || DEFAULT_SHOWROOM_NAME,
    reservationHours: !Number.isNaN(parsedHours) && parsedHours > 0 ? parsedHours : DEFAULT_RESERVATION_HOURS,
  };
}

/**
 * BR-35: Actualiza la configuración del showroom persistiendo en la base de datos sin deploy.
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

  if (input.reservationHours !== undefined) {
    const hours = Number(input.reservationHours);
    if (!Number.isInteger(hours) || hours <= 0) {
      throw new ValidationError("Las horas de reserva deben ser un número entero mayor a 0.");
    }
    await settingsRepo.set("reservation_hours", String(hours));
  }

  return getShowroomSettings(deps);
}
