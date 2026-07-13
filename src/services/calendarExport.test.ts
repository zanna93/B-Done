import { describe, expect, it } from "vitest";
import type { CollectionEvent, UserPreferences } from "../domain/models";
import { createReminderCalendar } from "./calendarExport";

const events: CollectionEvent[] = [
  {
    date: "2026-07-08",
    zone: "residenziale",
    wasteTypes: ["organico"],
    notes: "",
    isVariation: false,
    isDoublePickup: false,
  },
  {
    date: "2026-07-10",
    zone: "residenziale",
    wasteTypes: ["organico", "vetro"],
    notes: "Doppio ritiro",
    isVariation: false,
    isDoublePickup: true,
  },
];

const preferences: UserPreferences = {
  municipality: "jesi",
  street: "Via Montecappone",
  zone: "residenziale",
  onboardingCompleted: true,
  highContrast: false,
  largeText: false,
  notifications: {
    mode: "both",
    eveningTime: "20:30",
    morningTime: "07:30",
    permission: "granted",
  },
};

describe("createReminderCalendar", () => {
  it("creates morning and evening calendar reminders", () => {
    const calendar = createReminderCalendar(events, preferences, "2026-07-06", new Date("2026-07-06T10:00:00Z"));

    expect(calendar.count).toBe(4);
    expect(calendar.filename).toBe("b-done-jesi-residenziale-promemoria.ics");
    expect(calendar.content).toContain("BEGIN:VCALENDAR");
    expect(calendar.content).toContain("DTSTART:20260707T203000");
    expect(calendar.content).toContain("DTSTART:20260708T073000");
    expect(calendar.content).toContain("SUMMARY:Domani: Organico");
    expect(calendar.content).toContain("DESCRIPTION:Domani doppio ritiro: Organico + Vetro.");
    expect(calendar.content).toContain("BEGIN:VALARM");
  });

  it("does not create reminders when notifications are off", () => {
    const calendar = createReminderCalendar(
      events,
      { ...preferences, notifications: { ...preferences.notifications, mode: "none" } },
      "2026-07-06",
    );

    expect(calendar.count).toBe(0);
    expect(calendar.content).not.toContain("BEGIN:VEVENT");
  });
});