export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface ScheduleTimeRange {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export interface DaySchedule {
  day: DayOfWeek;
  isOpen: boolean;
  ranges: ScheduleTimeRange[];
}

export interface ScheduleException {
  date: string; // "YYYY-MM-DD"
  label: string;
  isOpen: boolean;
  ranges?: ScheduleTimeRange[];
}

export interface StoreScheduleConfig {
  timezone: string;
  openingHours: DaySchedule[];
  separatePickupHours: boolean;
  pickupHours: DaySchedule[];
  note?: string | null;
  exceptions: ScheduleException[];
}

export type PickupAddressVisibility = "PUBLIC" | "COORDINATE_WHATSAPP";

export interface ShippingZoneConfig {
  id: string;
  name: string;
  costCents: number;
  estimatedDelivery?: string;
  enabled: boolean;
}

export interface StoreLocationConfig {
  attendsPublic: boolean;
  streetAddress: string;
  locality: string;
  province: string;
  postalCode: string;
  googleMapsUrl: string | null;
  freeShippingFromCents: number | null;
  pickupAddressVisibility?: PickupAddressVisibility;
  pickupEnabled?: boolean;
  // Correo / Envío a Domicilio
  homeDeliveryEnabled?: boolean;
  homeDeliveryCostCents?: number;
  homeDeliveryEstimatedDays?: string;
  homeDeliveryFreeThresholdCents?: number | null;
  homeDeliveryZones?: ShippingZoneConfig[];
  // Moto Express
  motorcycleDeliveryEnabled?: boolean;
  motorcycleDeliveryCostCents?: number;
  motorcycleDeliveryEstimatedDays?: string;
  motorcycleZones?: ShippingZoneConfig[];
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
};

export const DAY_ORDER: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DEFAULT_DAYS: DaySchedule[] = [
  { day: "monday", isOpen: false, ranges: [{ open: "14:00", close: "19:30" }] },
  { day: "tuesday", isOpen: true, ranges: [{ open: "14:00", close: "19:30" }] },
  { day: "wednesday", isOpen: true, ranges: [{ open: "14:00", close: "19:30" }] },
  { day: "thursday", isOpen: true, ranges: [{ open: "14:00", close: "19:30" }] },
  { day: "friday", isOpen: true, ranges: [{ open: "14:00", close: "19:30" }] },
  {
    day: "saturday",
    isOpen: true,
    ranges: [
      { open: "11:00", close: "14:00" },
      { open: "16:00", close: "20:00" },
    ],
  },
  { day: "sunday", isOpen: false, ranges: [{ open: "14:00", close: "19:30" }] },
];

export const DEFAULT_STORE_SCHEDULE: StoreScheduleConfig = {
  timezone: "America/Argentina/Buenos_Aires",
  openingHours: DEFAULT_DAYS,
  separatePickupHours: false,
  pickupHours: DEFAULT_DAYS,
  note: "Sábados atención personalizada y retiros en el día.",
  exceptions: [],
};

export const DEFAULT_SHIPPING_HOME_ZONES: ShippingZoneConfig[] = [
  { id: "caba_gba", name: "CABA y Gran Buenos Aires", costCents: 380000, estimatedDelivery: "2 a 3 días hábiles", enabled: true },
  { id: "interior", name: "Interior del país / Resto de Argentina", costCents: 490000, estimatedDelivery: "4 a 6 días hábiles", enabled: true },
];

export const DEFAULT_SHIPPING_MOTO_ZONES: ShippingZoneConfig[] = [
  { id: "caba", name: "CABA (Capital Federal)", costCents: 350000, estimatedDelivery: "En el día", enabled: true },
  { id: "gba_norte", name: "GBA Zona Norte (Vicente López, San Isidro)", costCents: 450000, estimatedDelivery: "En el día / 24 hs", enabled: true },
  { id: "gba_oeste", name: "GBA Zona Oeste (Morón, Ramos Mejía)", costCents: 450000, estimatedDelivery: "En el día / 24 hs", enabled: true },
  { id: "gba_sur", name: "GBA Zona Sur (Avellaneda, Lanús, Quilmes)", costCents: 480000, estimatedDelivery: "En el día / 24 hs", enabled: true },
];

export const DEFAULT_STORE_LOCATION: StoreLocationConfig = {
  attendsPublic: true,
  streetAddress: "Gurruchaga 1650",
  locality: "Palermo Soho, CABA",
  province: "Buenos Aires",
  postalCode: "C1414",
  googleMapsUrl: null,
  freeShippingFromCents: 8500000, // $85.000
  pickupAddressVisibility: "PUBLIC",
  pickupEnabled: true,
  homeDeliveryEnabled: false,
  homeDeliveryCostCents: 450000,
  homeDeliveryEstimatedDays: "3 a 5 días hábiles",
  homeDeliveryFreeThresholdCents: null,
  homeDeliveryZones: DEFAULT_SHIPPING_HOME_ZONES,
  motorcycleDeliveryEnabled: false,
  motorcycleDeliveryCostCents: 350000,
  motorcycleDeliveryEstimatedDays: "En el día",
  motorcycleZones: DEFAULT_SHIPPING_MOTO_ZONES,
};

export function formatDayRanges(dayItem?: DaySchedule | null): string {
  if (!dayItem || !dayItem.isOpen || !dayItem.ranges || dayItem.ranges.length === 0) {
    return "Cerrado";
  }
  return dayItem.ranges.map((r) => `${r.open} a ${r.close}`).join(" / ");
}

/**
 * Formatea una hora HH:MM a formato amigable en español:
 * "09:00" -> "9"
 * "14:00" -> "14"
 * "09:30" -> "9:30"
 * "19:30" -> "19:30"
 */
export function formatTimeHour(time: string): string {
  const [hStr, mStr] = (time || "00:00").split(":");
  const h = parseInt(hStr || "0", 10);
  const m = parseInt(mStr || "0", 10);
  if (m === 0) {
    return `${h}`;
  }
  return `${h}:${mStr.padStart(2, "0")}`;
}

/**
 * Convierte un array de rangos horarios en texto amigable:
 * 1 rango: "de 9 a 18 hs"
 * 2 rangos: "de 9 a 13 y de 16 a 20 hs"
 */
export function formatRangesText(ranges: ScheduleTimeRange[]): string {
  if (!ranges || ranges.length === 0) return "Cerrado";
  const formattedRanges = ranges.map(
    (r) => `de ${formatTimeHour(r.open)} a ${formatTimeHour(r.close)}`
  );
  if (formattedRanges.length === 1) {
    return `${formattedRanges[0]} hs`;
  }
  if (formattedRanges.length === 2) {
    return `${formattedRanges[0]} y ${formattedRanges[1]} hs`;
  }
  return `${formattedRanges.slice(0, -1).join(", ")} y ${
    formattedRanges[formattedRanges.length - 1]
  } hs`;
}

const DAY_NAMES_PLURAL: Record<DayOfWeek, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábados",
  sunday: "Domingos",
};

/**
 * Formatea un listado de días (consecutivos o no) en texto amigable:
 * - 7 días: "Todos los días"
 * - lunes a viernes: "Lunes a viernes"
 * - sábados y domingos: "Sábados y domingos"
 * - lunes, miércoles y viernes: "Lunes, miércoles y viernes"
 * - sábados: "Sábados"
 */
export function formatDayGroup(days: DayOfWeek[]): string {
  if (days.length === 0) return "";
  if (days.length === 7) return "Todos los días";

  const indices = days.map((d) => DAY_ORDER.indexOf(d)).sort((a, b) => a - b);
  const isConsecutive =
    indices.every((val, i) => i === 0 || val === indices[i - 1] + 1) &&
    indices.length >= 3;

  if (isConsecutive) {
    const firstDay = DAY_ORDER[indices[0]];
    const lastDay = DAY_ORDER[indices[indices.length - 1]];
    return `${DAY_NAMES_PLURAL[firstDay]} a ${DAY_NAMES_PLURAL[lastDay].toLowerCase()}`;
  }

  const names = days.map((d, i) =>
    i === 0 ? DAY_NAMES_PLURAL[d] : DAY_NAMES_PLURAL[d].toLowerCase()
  );

  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    return `${names[0]} y ${names[1]}`;
  }
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

export interface FormattedScheduleSummary {
  attendanceLines: string[];
  pickupLines: string[];
  fullText: string;
  inlineText: string;
  isOnlineOnly: boolean;
}

/**
 * Agrupa días de un listado de horarios (DaySchedule[]) y devuelve líneas formateadas.
 */
function groupDaySchedules(daySchedules: DaySchedule[]): string[] {
  const openDays = daySchedules.filter(
    (d) => d.isOpen && d.ranges && d.ranges.length > 0
  );
  if (openDays.length === 0) {
    return [];
  }

  // Agrupamos por firma de horarios
  const signatureMap = new Map<
    string,
    { days: DayOfWeek[]; ranges: ScheduleTimeRange[] }
  >();

  for (const dayItem of openDays) {
    const sig = dayItem.ranges.map((r) => `${r.open}-${r.close}`).join("|");
    if (!signatureMap.has(sig)) {
      signatureMap.set(sig, { days: [dayItem.day], ranges: dayItem.ranges });
    } else {
      signatureMap.get(sig)!.days.push(dayItem.day);
    }
  }

  const results: string[] = [];
  for (const group of signatureMap.values()) {
    const dayLabel = formatDayGroup(group.days);
    const rangeLabel = formatRangesText(group.ranges);
    results.push(`${dayLabel} ${rangeLabel}`);
  }

  return results;
}

/**
 * Formateador unificado de horarios agrupados para Footer, Home y Checkout (ADM-07).
 */
export function formatStoreScheduleSummary(
  schedule?: StoreScheduleConfig | null,
  location?: StoreLocationConfig | null
): FormattedScheduleSummary {
  const attendsPublic = location?.attendsPublic ?? true;
  if (!attendsPublic) {
    return {
      attendanceLines: ["Solo tienda online"],
      pickupLines: [],
      fullText: "Solo tienda online",
      inlineText: "Solo tienda online",
      isOnlineOnly: true,
    };
  }

  const openingDays = schedule?.openingHours || DEFAULT_DAYS;
  const attendanceLines = groupDaySchedules(openingDays);

  if (attendanceLines.length === 0) {
    const isByAppointment =
      schedule?.note?.toLowerCase().includes("cita previa") || false;
    const fallbackText = isByAppointment
      ? "Atención solo con cita previa"
      : "Solo tienda online";
    return {
      attendanceLines: [fallbackText],
      pickupLines: [],
      fullText: fallbackText,
      inlineText: fallbackText,
      isOnlineOnly: !isByAppointment,
    };
  }

  let pickupLines: string[] = [];
  if (schedule?.separatePickupHours && schedule.pickupHours) {
    const rawPickupLines = groupDaySchedules(schedule.pickupHours);
    // Verificamos si los horarios de retiro difieren de los de atención
    const attJoined = attendanceLines.join("|");
    const pickJoined = rawPickupLines.join("|");
    if (pickJoined && pickJoined !== attJoined) {
      pickupLines = rawPickupLines.map((line) => {
        const lowerLine = line.charAt(0).toLowerCase() + line.slice(1);
        return `Retiros: ${lowerLine}`;
      });
    }
  }

  const attendanceText = attendanceLines.join(" · ");
  const pickupText = pickupLines.join(" · ");

  let fullText = attendanceText;
  if (pickupLines.length > 0) {
    fullText = `Atención: ${attendanceText.charAt(0).toLowerCase() + attendanceText.slice(1)}\n${pickupText}`;
  }

  const inlineText =
    pickupLines.length > 0 ? `${attendanceText} · ${pickupText}` : attendanceText;

  return {
    attendanceLines,
    pickupLines,
    fullText,
    inlineText,
    isOnlineOnly: false,
  };
}

function parseMinutes(hhmm: string): number {
  const [hStr, mStr] = (hhmm || "00:00").split(":");
  const h = parseInt(hStr || "0", 10);
  const m = parseInt(mStr || "0", 10);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

/**
 * Construye la URL de búsqueda en Google Maps sin requerir clave de API (Etapa 1).
 */
export function buildGoogleMapsSearchUrl(location: StoreLocationConfig): string {
  if (location.googleMapsUrl && location.googleMapsUrl.trim()) {
    return location.googleMapsUrl.trim();
  }
  const parts = [
    location.streetAddress,
    location.locality,
    location.province,
    location.postalCode,
    "Argentina",
  ]
    .map((p) => (p || "").trim())
    .filter(Boolean);

  const query = parts.length > 0 ? parts.join(", ") : "Palermo Soho, Buenos Aires, Argentina";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Calcula si el local está abierto ahora mismo y devuelve la etiqueta accesible ("Abierto ahora" o "Cerrado · abre...").
 */
export function computeStoreOpenStatus(
  schedule: StoreScheduleConfig,
  nowDate: Date = new Date()
): {
  isOpen: boolean;
  badgeText: string;
  todayKey: DayOfWeek;
} {
  const tz = schedule?.timezone || "America/Argentina/Buenos_Aires";

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(nowDate);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const dateIso = `${year}-${month}-${day}`;
  const weekdayShort = getPart("weekday").toLowerCase();
  const hour = parseInt(getPart("hour") || "0", 10);
  const minute = parseInt(getPart("minute") || "0", 10);
  const currentMinutes = (hour === 24 ? 0 : hour) * 60 + minute;

  const weekdayMap: Record<string, DayOfWeek> = {
    mon: "monday",
    tue: "tuesday",
    wed: "wednesday",
    thu: "thursday",
    fri: "friday",
    sat: "saturday",
    sun: "sunday",
  };
  const todayKey: DayOfWeek = weekdayMap[weekdayShort.slice(0, 3)] || "monday";

  const openingHoursList = Array.isArray(schedule?.openingHours)
    ? schedule.openingHours
    : DEFAULT_DAYS;

  const getRangesForDay = (dayKey: DayOfWeek, isoDate?: string): ScheduleTimeRange[] => {
    if (isoDate && schedule?.exceptions && schedule.exceptions.length > 0) {
      const exc = schedule.exceptions.find((e) => e.date === isoDate);
      if (exc) {
        return exc.isOpen ? exc.ranges || [] : [];
      }
    }
    const found = openingHoursList.find((d) => d.day === dayKey);
    if (!found || !found.isOpen) return [];
    return found.ranges || [];
  };

  const todayRanges = getRangesForDay(todayKey, dateIso);
  for (const r of todayRanges) {
    const start = parseMinutes(r.open);
    const end = parseMinutes(r.close);
    if (currentMinutes >= start && currentMinutes < end) {
      return {
        isOpen: true,
        badgeText: `Abierto ahora · hasta las ${r.close}`,
        todayKey,
      };
    }
    if (currentMinutes < start) {
      return {
        isOpen: false,
        badgeText: `Cerrado · abre hoy ${r.open}`,
        todayKey,
      };
    }
  }

  // Buscar el próximo día con horario de apertura
  const todayIdx = DAY_ORDER.indexOf(todayKey);
  for (let offset = 1; offset <= 7; offset++) {
    const nextIdx = (todayIdx + offset) % 7;
    const nextDayKey = DAY_ORDER[nextIdx];
    const nextRanges = getRangesForDay(nextDayKey);
    if (nextRanges.length > 0) {
      const dayLabel = offset === 1 ? "mañana" : DAY_SHORT_LABELS[nextDayKey].toLowerCase();
      return {
        isOpen: false,
        badgeText: `Cerrado · abre ${dayLabel} ${nextRanges[0].open}`,
        todayKey,
      };
    }
  }

  return {
    isOpen: false,
    badgeText: "Cerrado temporalmente",
    todayKey,
  };
}

