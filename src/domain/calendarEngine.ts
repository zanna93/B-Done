import type { CollectionEvent, IsoDate, WasteType, ZoneId } from "./models";
import { addDays, daysBetween } from "../utils/date";

export interface HomeSummary {
  today: CollectionEvent[];
  tomorrow: CollectionEvent[];
  nextPickup: CollectionEvent | null;
  featuredPickup: CollectionEvent | null;
  followingPickup: CollectionEvent | null;
  countdownDays: number | null;
  followingCountdownDays: number | null;
}

export interface HomeSummaryOptions {
  currentHour?: number;
}

export function getEventsForDate(events: CollectionEvent[], zone: ZoneId, date: IsoDate): CollectionEvent[] {
  return events.filter((event) => event.zone === zone && event.date === date);
}

export function getUpcomingEvents(
  events: CollectionEvent[],
  zone: ZoneId,
  fromDate: IsoDate,
  days = 30,
): CollectionEvent[] {
  const toDate = addDays(fromDate, days);
  return events
    .filter((event) => event.zone === zone && event.date >= fromDate && event.date <= toDate)
    .sort(compareEvents);
}

export function getNextPickup(events: CollectionEvent[], zone: ZoneId, fromDate: IsoDate): CollectionEvent | null {
  return getUpcomingEvents(events, zone, fromDate, 370)[0] ?? null;
}

export function getHomeSummary(
  events: CollectionEvent[],
  zone: ZoneId,
  today: IsoDate,
  options: HomeSummaryOptions = {},
): HomeSummary {
  const tomorrow = addDays(today, 1);
  const todayEvents = getEventsForDate(events, zone, today);
  const tomorrowEvents = getEventsForDate(events, zone, tomorrow);
  const isAfterNoon = (options.currentHour ?? 0) >= 12;
  const nextPickupSearchDate = isAfterNoon ? tomorrow : today;
  const nextPickup = getNextPickup(events, zone, nextPickupSearchDate);
  const featuredPickup = isAfterNoon ? nextPickup : todayEvents[0] ?? nextPickup;
  const followingPickup = featuredPickup ? getNextPickup(events, zone, addDays(featuredPickup.date, 1)) : nextPickup;
  const countdownDays = nextPickup ? daysBetween(today, nextPickup.date) : null;
  const followingCountdownDays = followingPickup ? daysBetween(today, followingPickup.date) : null;

  return {
    today: todayEvents,
    tomorrow: tomorrowEvents,
    nextPickup,
    featuredPickup,
    followingPickup,
    countdownDays,
    followingCountdownDays,
  };
}

export function formatWasteList(wasteTypes: WasteType[]): string {
  return wasteTypes.map(formatWasteName).join(" + ");
}

export function formatWasteName(wasteType: WasteType): string {
  const names: Record<WasteType, string> = {
    organico: "Organico",
    carta: "Carta",
    plastica: "Plastica",
    vetro: "Vetro",
    secco: "Secco",
    indifferenziato: "Indifferenziato",
  };
  return names[wasteType];
}

export function buildNotificationText(event: CollectionEvent, when: "today" | "tomorrow"): string {
  const prefix = when === "today" ? "Oggi passa" : "Domani passa";
  if (event.isDoublePickup || event.wasteTypes.length > 1) {
    return `${when === "today" ? "Oggi" : "Domani"} doppio ritiro: ${formatWasteList(event.wasteTypes)}.`;
  }
  return `${prefix} ${formatWasteList(event.wasteTypes)}.`;
}

function compareEvents(a: CollectionEvent, b: CollectionEvent): number {
  return a.date.localeCompare(b.date) || a.zone.localeCompare(b.zone);
}
