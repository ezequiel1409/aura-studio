import { describe, it, expect } from "vitest";
import {
  DaySchedule,
  formatStoreScheduleSummary,
  StoreScheduleConfig,
  StoreLocationConfig,
  DEFAULT_STORE_SCHEDULE,
  DEFAULT_STORE_LOCATION,
} from "../src/lib/schedule/store-schedule";

describe("ADM-07: Formateador de Horarios Agrupados", () => {
  const createSchedule = (
    openDays: Array<{
      day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
      ranges: Array<{ open: string; close: string }>;
    }>,
    pickupDays?: Array<{
      day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
      ranges: Array<{ open: string; close: string }>;
    }>,
    note?: string
  ): StoreScheduleConfig => {
    const allDays: Array<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"> = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    const openingHours: DaySchedule[] = allDays.map((d) => {
      const match = openDays.find((od) => od.day === d);
      return {
        day: d,
        isOpen: Boolean(match),
        ranges: match ? match.ranges : [],
      };
    });

    const pickupHours: DaySchedule[] = pickupDays
      ? allDays.map((d) => {
          const match = pickupDays.find((pd) => pd.day === d);
          return {
            day: d,
            isOpen: Boolean(match),
            ranges: match ? match.ranges : [],
          };
        })
      : openingHours;

    return {
      timezone: "America/Argentina/Buenos_Aires",
      openingHours,
      separatePickupHours: Boolean(pickupDays),
      pickupHours,
      note: note || null,
      exceptions: [],
    };
  };

  it("Caso 1: Todos los días mismo horario -> 'Todos los días de 10 a 20 hs'", () => {
    const schedule = createSchedule([
      { day: "monday", ranges: [{ open: "10:00", close: "20:00" }] },
      { day: "tuesday", ranges: [{ open: "10:00", close: "20:00" }] },
      { day: "wednesday", ranges: [{ open: "10:00", close: "20:00" }] },
      { day: "thursday", ranges: [{ open: "10:00", close: "20:00" }] },
      { day: "friday", ranges: [{ open: "10:00", close: "20:00" }] },
      { day: "saturday", ranges: [{ open: "10:00", close: "20:00" }] },
      { day: "sunday", ranges: [{ open: "10:00", close: "20:00" }] },
    ]);

    const result = formatStoreScheduleSummary(schedule, DEFAULT_STORE_LOCATION);
    expect(result.attendanceLines).toEqual(["Todos los días de 10 a 20 hs"]);
    expect(result.inlineText).toBe("Todos los días de 10 a 20 hs");
  });

  it("Caso 2: Lunes a viernes igual, finde cerrado -> 'Lunes a viernes de 9 a 18 hs'", () => {
    const schedule = createSchedule([
      { day: "monday", ranges: [{ open: "09:00", close: "18:00" }] },
      { day: "tuesday", ranges: [{ open: "09:00", close: "18:00" }] },
      { day: "wednesday", ranges: [{ open: "09:00", close: "18:00" }] },
      { day: "thursday", ranges: [{ open: "09:00", close: "18:00" }] },
      { day: "friday", ranges: [{ open: "09:00", close: "18:00" }] },
    ]);

    const result = formatStoreScheduleSummary(schedule, DEFAULT_STORE_LOCATION);
    expect(result.attendanceLines).toEqual(["Lunes a viernes de 9 a 18 hs"]);
    expect(result.inlineText).toBe("Lunes a viernes de 9 a 18 hs");
  });

  it("Caso 3: Lunes a viernes igual, sábado mediodía -> 'Lunes a viernes de 9 a 18 hs · Sábados de 9 a 13 hs'", () => {
    const schedule = createSchedule([
      { day: "monday", ranges: [{ open: "09:00", close: "18:00" }] },
      { day: "tuesday", ranges: [{ open: "09:00", close: "18:00" }] },
      { day: "wednesday", ranges: [{ open: "09:00", close: "18:00" }] },
      { day: "thursday", ranges: [{ open: "09:00", close: "18:00" }] },
      { day: "friday", ranges: [{ open: "09:00", close: "18:00" }] },
      { day: "saturday", ranges: [{ open: "09:00", close: "13:00" }] },
    ]);

    const result = formatStoreScheduleSummary(schedule, DEFAULT_STORE_LOCATION);
    expect(result.attendanceLines).toEqual([
      "Lunes a viernes de 9 a 18 hs",
      "Sábados de 9 a 13 hs",
    ]);
    expect(result.inlineText).toBe(
      "Lunes a viernes de 9 a 18 hs · Sábados de 9 a 13 hs"
    );
  });

  it("Caso 4: Dos turnos (cortado) -> 'Lunes a viernes de 9 a 13 y de 16 a 20 hs'", () => {
    const schedule = createSchedule([
      {
        day: "monday",
        ranges: [
          { open: "09:00", close: "13:00" },
          { open: "16:00", close: "20:00" },
        ],
      },
      {
        day: "tuesday",
        ranges: [
          { open: "09:00", close: "13:00" },
          { open: "16:00", close: "20:00" },
        ],
      },
      {
        day: "wednesday",
        ranges: [
          { open: "09:00", close: "13:00" },
          { open: "16:00", close: "20:00" },
        ],
      },
      {
        day: "thursday",
        ranges: [
          { open: "09:00", close: "13:00" },
          { open: "16:00", close: "20:00" },
        ],
      },
      {
        day: "friday",
        ranges: [
          { open: "09:00", close: "13:00" },
          { open: "16:00", close: "20:00" },
        ],
      },
    ]);

    const result = formatStoreScheduleSummary(schedule, DEFAULT_STORE_LOCATION);
    expect(result.attendanceLines).toEqual([
      "Lunes a viernes de 9 a 13 y de 16 a 20 hs",
    ]);
  });

  it("Caso 5: Días salteados -> 'Lunes, miércoles y viernes de 14 a 19 hs'", () => {
    const schedule = createSchedule([
      { day: "monday", ranges: [{ open: "14:00", close: "19:00" }] },
      { day: "wednesday", ranges: [{ open: "14:00", close: "19:00" }] },
      { day: "friday", ranges: [{ open: "14:00", close: "19:00" }] },
    ]);

    const result = formatStoreScheduleSummary(schedule, DEFAULT_STORE_LOCATION);
    expect(result.attendanceLines).toEqual([
      "Lunes, miércoles y viernes de 14 a 19 hs",
    ]);
  });

  it("Caso 6: Finde exclusivo -> 'Sábados y domingos de 11 a 19 hs'", () => {
    const schedule = createSchedule([
      { day: "saturday", ranges: [{ open: "11:00", close: "19:00" }] },
      { day: "sunday", ranges: [{ open: "11:00", close: "19:00" }] },
    ]);

    const result = formatStoreScheduleSummary(schedule, DEFAULT_STORE_LOCATION);
    expect(result.attendanceLines).toEqual(["Sábados y domingos de 11 a 19 hs"]);
  });

  it("Caso 7: Solo un día -> 'Sábados de 10 a 14 hs'", () => {
    const schedule = createSchedule([
      { day: "saturday", ranges: [{ open: "10:00", close: "14:00" }] },
    ]);

    const result = formatStoreScheduleSummary(schedule, DEFAULT_STORE_LOCATION);
    expect(result.attendanceLines).toEqual(["Sábados de 10 a 14 hs"]);
  });

  it("Caso 8: Sin atención al público -> 'Solo tienda online'", () => {
    const location: StoreLocationConfig = {
      ...DEFAULT_STORE_LOCATION,
      attendsPublic: false,
    };
    const schedule = createSchedule([]);

    const result = formatStoreScheduleSummary(schedule, location);
    expect(result.attendanceLines).toEqual(["Solo tienda online"]);
    expect(result.isOnlineOnly).toBe(true);
  });

  it("Caso 8b: Todos cerrados con cita previa -> 'Atención solo con cita previa'", () => {
    const schedule = createSchedule([], undefined, "Atención solo con cita previa");
    const result = formatStoreScheduleSummary(schedule, DEFAULT_STORE_LOCATION);
    expect(result.attendanceLines).toEqual(["Atención solo con cita previa"]);
  });

  it("Caso 9: Retiro diferenciado -> 'Atención: lunes a viernes de 10 a 18 hs\\nRetiros: martes y jueves de 14 a 18 hs'", () => {
    const schedule = createSchedule(
      [
        { day: "monday", ranges: [{ open: "10:00", close: "18:00" }] },
        { day: "tuesday", ranges: [{ open: "10:00", close: "18:00" }] },
        { day: "wednesday", ranges: [{ open: "10:00", close: "18:00" }] },
        { day: "thursday", ranges: [{ open: "10:00", close: "18:00" }] },
        { day: "friday", ranges: [{ open: "10:00", close: "18:00" }] },
      ],
      [
        { day: "tuesday", ranges: [{ open: "14:00", close: "18:00" }] },
        { day: "thursday", ranges: [{ open: "14:00", close: "18:00" }] },
      ]
    );

    const result = formatStoreScheduleSummary(schedule, DEFAULT_STORE_LOCATION);
    expect(result.attendanceLines).toEqual(["Lunes a viernes de 10 a 18 hs"]);
    expect(result.pickupLines).toEqual(["Retiros: martes y jueves de 14 a 18 hs"]);
    expect(result.fullText).toBe(
      "Atención: lunes a viernes de 10 a 18 hs\nRetiros: martes y jueves de 14 a 18 hs"
    );
  });
});
