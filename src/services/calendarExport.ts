import { buildNotificationText, formatWasteList } from "../domain/calendarEngine";
import type { CollectionEvent, IsoDate, NotificationSettings, UserPreferences } from "../domain/models";
import { addDays, todayIso } from "../utils/date";
import { shouldSendForMode } from "./notificationManager";

interface ReminderCalendarEntry {
  date: IsoDate;
  event: CollectionEvent;
  moment: "evening" | "morning";
  time: string;
}

export interface ReminderCalendarData {
  content: string;
  count: number;
  filename: string;
}

export interface ReminderCalendarDownloadResult {
  ok: boolean;
  count: number;
  filename: string;
  message: string;
}

export function createReminderCalendar(
  events: CollectionEvent[],
  preferences: UserPreferences,
  fromDate: IsoDate = todayIso(),
  createdAt: Date = new Date(),
): ReminderCalendarData {
  const entries = createReminderEntries(events, preferences, fromDate);
  const filename = `b-done-${preferences.municipality}-${preferences.zone}-promemoria.ics`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//B-Done//Promemoria raccolta rifiuti//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:B-Done - Raccolta rifiuti",
    "X-WR-CALDESC:Promemoria generati da B-Done per la raccolta porta a porta.",
    ...entries.flatMap((entry) => createEventLines(entry, preferences.notifications, createdAt)),
    "END:VCALENDAR",
  ];

  return {
    content: lines.map(foldIcsLine).join("\r\n") + "\r\n",
    count: entries.length,
    filename,
  };
}

export function downloadReminderCalendar(
  events: CollectionEvent[],
  preferences: UserPreferences,
): ReminderCalendarDownloadResult {
  if (preferences.notifications.mode === "none") {
    return {
      ok: false,
      count: 0,
      filename: "",
      message: "Attiva almeno un promemoria prima di scaricare il calendario.",
    };
  }

  const calendar = createReminderCalendar(events, preferences);
  if (calendar.count === 0) {
    return {
      ok: false,
      count: 0,
      filename: calendar.filename,
      message: "Non ci sono ritiri futuri da esportare per questa zona.",
    };
  }

  const blob = new Blob([calendar.content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = calendar.filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return {
    ok: true,
    count: calendar.count,
    filename: calendar.filename,
    message: `Calendario creato con ${calendar.count} promemoria. Apri il file scaricato e aggiungilo al calendario del telefono.`,
  };
}

function createReminderEntries(
  events: CollectionEvent[],
  preferences: UserPreferences,
  fromDate: IsoDate,
): ReminderCalendarEntry[] {
  return events
    .filter((event) => event.zone === preferences.zone && event.date >= fromDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .flatMap((event) => {
      const entries: ReminderCalendarEntry[] = [];
      if (shouldSendForMode(preferences.notifications.mode, "evening")) {
        entries.push({
          date: addDays(event.date, -1),
          event,
          moment: "evening",
          time: preferences.notifications.eveningTime,
        });
      }
      if (shouldSendForMode(preferences.notifications.mode, "morning")) {
        entries.push({
          date: event.date,
          event,
          moment: "morning",
          time: preferences.notifications.morningTime,
        });
      }
      return entries;
    });
}

function createEventLines(
  entry: ReminderCalendarEntry,
  settings: NotificationSettings,
  createdAt: Date,
): string[] {
  const startsAt = toIcsDateTime(entry.date, entry.time);
  const endsAt = toIcsDateTime(entry.date, addMinutes(entry.time, 5));
  const when = entry.moment === "morning" ? "today" : "tomorrow";
  const titlePrefix = entry.moment === "morning" ? "Oggi" : "Domani";
  const summary = `${titlePrefix}: ${formatWasteList(entry.event.wasteTypes)}`;
  const description = buildNotificationText(entry.event, when);
  const alarmDescription = `${description} - B-Done`;

  return [
    "BEGIN:VEVENT",
    `UID:${createUid(entry, settings)}`,
    `DTSTAMP:${toUtcIcsDateTime(createdAt)}`,
    `DTSTART:${startsAt}`,
    `DTEND:${endsAt}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-PT0M",
    `DESCRIPTION:${escapeIcsText(alarmDescription)}`,
    "END:VALARM",
    "END:VEVENT",
  ];
}

function createUid(entry: ReminderCalendarEntry, settings: NotificationSettings): string {
  return [
    "b-done",
    entry.event.zone,
    entry.event.date,
    entry.moment,
    settings.eveningTime,
    settings.morningTime,
    entry.event.wasteTypes.join("-"),
  ]
    .join("-")
    .replace(/[^a-z0-9-]/gi, "-")
    .toLowerCase() + "@b-done.local";
}

function toIcsDateTime(date: IsoDate, time: string): string {
  const [year, month, day] = date.split("-");
  const [hour = "00", minute = "00"] = time.split(":");
  return `${year}${month}${day}T${hour.padStart(2, "0")}${minute.padStart(2, "0")}00`;
}

function toUtcIcsDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function addMinutes(time: string, minutes: number): string {
  const [rawHour = "0", rawMinute = "0"] = time.split(":");
  const total = Number(rawHour) * 60 + Number(rawMinute) + minutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function foldIcsLine(line: string): string {
  if (line.length <= 74) return line;
  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > 74) {
    chunks.push(remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  chunks.push(remaining);
  return chunks.map((chunk, index) => (index === 0 ? chunk : ` ${chunk}`)).join("\r\n");
}