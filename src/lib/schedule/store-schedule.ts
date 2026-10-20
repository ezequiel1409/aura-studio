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

export interface StoreLocationConfig {
  attendsPublic: boolean;
  streetAddress: string;
  locality: string;
  province: string;
  postalCode: string;
  googleMapsUrl: string | null;
  freeShippingFromCents: number | null;
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

export const DEFAULT_STORE_LOCATION: StoreLocationConfig = {
  attendsPublic: true,
  streetAddress: "Gurruchaga 1650",
  locality: "Palermo Soho, CABA",
  province: "Buenos Aires",
  postalCode: "C1414",
  googleMapsUrl: null,
  freeShippingFromCents: 8500000, // $85.000
};

export function formatDayRanges(dayItem?: DaySchedule | null): string {
  if (!dayItem || !dayItem.isOpen || !dayItem.ranges || dayItem.ranges.length === 0) {
    return "Cerrado";
  }
  return dayItem.ranges.map((r) => `${r.open} a ${r.close}`).join(" / ");
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

