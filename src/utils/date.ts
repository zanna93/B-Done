import type { IsoDate } from "../domain/models";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): value is IsoDate {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = parseIsoDate(value);
  return toIsoDate(date) === value;
}

export function parseIsoDate(value: IsoDate | string): Date {
  return new Date(`${value}T00:00:00`);
}

export function toIsoDate(date: Date): IsoDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as IsoDate;
}

export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const next = parseIsoDate(date);
  next.setDate(next.getDate() + days);
  return toIsoDate(next);
}

export function daysBetween(start: IsoDate, end: IsoDate): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((parseIsoDate(end).getTime() - parseIsoDate(start).getTime()) / msPerDay);
}

export function formatDayLabel(date: IsoDate): string {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(parseIsoDate(date));
}

export function formatLongDate(date: IsoDate): string {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseIsoDate(date));
}
