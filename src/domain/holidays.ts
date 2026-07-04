import type { IsoDate, MunicipalityId } from "./models";
import { addDays, parseIsoDate, toIsoDate } from "../utils/date";

export type CalendarPauseReason = "holiday" | "sunday";

export interface CalendarPauseDay {
  date: IsoDate;
  reason: CalendarPauseReason;
  label: string;
}

const NATIONAL_FIXED_HOLIDAYS: Record<string, string> = {
  "01-01": "Capodanno",
  "01-06": "Epifania",
  "04-25": "Festa della Liberazione",
  "05-01": "Festa del Lavoro",
  "06-02": "Festa della Repubblica",
  "08-15": "Ferragosto",
  "10-04": "San Francesco d'Assisi",
  "11-01": "Ognissanti",
  "12-08": "Immacolata",
  "12-25": "Natale",
  "12-26": "Santo Stefano",
};

const MUNICIPAL_FIXED_HOLIDAYS: Partial<Record<MunicipalityId, Record<string, string>>> = {
  jesi: {
    "09-22": "San Settimio",
  },
};

export function getCalendarPauseDay(date: IsoDate, municipality: MunicipalityId): CalendarPauseDay | null {
  const holidayName = getHolidayName(date, municipality);
  if (holidayName) {
    return {
      date,
      reason: "holiday",
      label: holidayName,
    };
  }

  if (isSunday(date)) {
    return {
      date,
      reason: "sunday",
      label: "Domenica",
    };
  }

  return null;
}

export function getHolidayName(date: IsoDate, municipality: MunicipalityId): string | null {
  const key = date.slice(5);
  const year = parseIsoDate(date).getFullYear();
  const movable = getMovableItalianHolidays(year);

  return (
    movable[date] ??
    NATIONAL_FIXED_HOLIDAYS[key] ??
    MUNICIPAL_FIXED_HOLIDAYS[municipality]?.[key] ??
    null
  );
}

function isSunday(date: IsoDate): boolean {
  return parseIsoDate(date).getDay() === 0;
}

function getMovableItalianHolidays(year: number): Partial<Record<IsoDate, string>> {
  const easter = getEasterDate(year);
  return {
    [easter]: "Pasqua",
    [addDays(easter, 1)]: "Pasquetta",
  };
}

function getEasterDate(year: number): IsoDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return toIsoDate(new Date(year, month - 1, day));
}

