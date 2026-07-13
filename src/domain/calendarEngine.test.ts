import { describe, expect, it } from "vitest";
import type { CollectionEvent } from "./models";
import { buildNotificationText, getHomeSummary, getUpcomingEvents } from "./calendarEngine";

const events: CollectionEvent[] = [
  {
    date: "2026-07-04",
    zone: "residenziale",
    wasteTypes: ["organico"],
    notes: "",
    isVariation: false,
    isDoublePickup: false,
  },
  {
    date: "2026-07-05",
    zone: "residenziale",
    wasteTypes: ["organico", "vetro"],
    notes: "doppio",
    isVariation: false,
    isDoublePickup: true,
  },
  {
    date: "2026-07-07",
    zone: "residenziale",
    wasteTypes: ["carta"],
    notes: "",
    isVariation: false,
    isDoublePickup: false,
  },
];

describe("calendarEngine", () => {
  it("builds home summary for today and tomorrow", () => {
    const summary = getHomeSummary(events, "residenziale", "2026-07-04");

    expect(summary.today).toHaveLength(1);
    expect(summary.tomorrow).toHaveLength(1);
    expect(summary.countdownDays).toBe(0);
    expect(summary.featuredPickup?.date).toBe("2026-07-04");
    expect(summary.followingPickup?.date).toBe("2026-07-05");
  });

  it("filters upcoming events by zone and range", () => {
    expect(getUpcomingEvents(events, "residenziale", "2026-07-04", 1)).toHaveLength(2);
    expect(getUpcomingEvents(events, "industriale", "2026-07-04", 1)).toHaveLength(0);
  });

  it("moves next pickup after today when it is past noon", () => {
    const summary = getHomeSummary(events, "residenziale", "2026-07-04", { currentHour: 12 });

    expect(summary.nextPickup?.date).toBe("2026-07-05");
    expect(summary.featuredPickup?.date).toBe("2026-07-05");
    expect(summary.followingPickup?.date).toBe("2026-07-07");
    expect(summary.countdownDays).toBe(1);
    expect(summary.followingCountdownDays).toBe(3);
  });

  it("formats double pickup notification text", () => {
    expect(buildNotificationText(events[1], "tomorrow")).toBe("Domani doppio ritiro: Organico + Vetro.");
  });
});
