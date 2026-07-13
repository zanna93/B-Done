import type { Badge, CollectionEvent, GamificationState, GamificationSummary, IsoDate, ZoneId } from "./models";
import { addDays, daysBetween } from "../utils/date";

export function markMissionDone(state: GamificationState, date: IsoDate): GamificationState {
  if (state.completedDates.includes(date)) return state;
  return { completedDates: [...state.completedDates, date].sort() };
}

export function getGamificationSummary(
  state: GamificationState,
  events: CollectionEvent[],
  zone: ZoneId,
  today: IsoDate,
): GamificationSummary {
  const completed = new Set(state.completedDates);
  const collectionDates = Array.from(
    new Set(events.filter((event) => event.zone === zone && event.date <= today).map((event) => event.date)),
  ).sort();
  const streak = calculateStreak(collectionDates, completed, today);
  const completedMissions = collectionDates.filter((date) => completed.has(date)).length;

  return {
    streak,
    completedMissions,
    badges: buildBadges(completedMissions, streak),
  };
}

function calculateStreak(collectionDates: IsoDate[], completed: Set<IsoDate>, today: IsoDate): number {
  let streak = 0;
  const relevantDates = collectionDates.filter((date) => date <= today).reverse();

  for (const date of relevantDates) {
    if (completed.has(date)) {
      streak += 1;
      continue;
    }

    if (daysBetween(date, today) === 0) {
      continue;
    }

    break;
  }

  return streak;
}

function buildBadges(completedMissions: number, streak: number): Badge[] {
  return [
    {
      id: "first-bin",
      name: "Primo Bidone",
      description: "Hai completato il primo promemoria.",
      unlocked: completedMissions >= 1,
    },
    {
      id: "perfect-week",
      name: "Settimana Perfetta",
      description: "Tre ritiri consecutivi completati.",
      unlocked: streak >= 3,
    },
    {
      id: "perfect-month",
      name: "Mese Perfetto",
      description: "Dodici missioni completate.",
      unlocked: completedMissions >= 12,
    },
    {
      id: "eco-hero",
      name: "Eco Hero",
      description: "Venticinque missioni completate.",
      unlocked: completedMissions >= 25,
    },
    {
      id: "zero-misses",
      name: "Zero Dimenticanze",
      description: "Sette ritiri consecutivi senza saltarne uno.",
      unlocked: streak >= 7,
    },
  ];
}

export function getCurrentWeekWindow(today: IsoDate): { start: IsoDate; end: IsoDate } {
  const day = new Date(`${today}T00:00:00`).getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const start = addDays(today, offset);
  return { start, end: addDays(start, 6) };
}


