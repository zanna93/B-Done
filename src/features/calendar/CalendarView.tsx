import { Ban, CalendarDays, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { formatWasteList } from "../../domain/calendarEngine";
import { getUpcomingEvents } from "../../domain/calendarEngine";
import { getCalendarPauseDay, type CalendarPauseDay } from "../../domain/holidays";
import {
  WASTE_TYPES,
  type CollectionEvent,
  type IsoDate,
  type MunicipalityId,
  type WasteType,
  type ZoneId,
} from "../../domain/models";
import { addDays, formatDayLabel } from "../../utils/date";
import { WasteVisualGroup } from "../../ui/components/WasteVisual";

interface CalendarViewProps {
  events: CollectionEvent[];
  municipality: MunicipalityId;
  zone: ZoneId;
  today: IsoDate;
}

type WasteFilter = "all" | WasteType;

type CalendarListItem =
  | { kind: "collection"; date: IsoDate; event: CollectionEvent }
  | { kind: "pause"; date: IsoDate; pause: CalendarPauseDay };

export function CalendarView({ events, municipality, zone, today }: CalendarViewProps) {
  const [filter, setFilter] = useState<WasteFilter>("all");
  const calendarItems = useMemo(
    () => buildCalendarItems(events, municipality, zone, today),
    [events, municipality, zone, today],
  );
  const filtered =
    filter === "all"
      ? calendarItems
      : calendarItems.filter((item) => item.kind === "collection" && item.event.wasteTypes.includes(filter));

  return (
    <div className="screen stack">
      <header className="screen-header">
        <div className="section-title">
          <CalendarDays aria-hidden="true" />
          <div>
            <p className="eyebrow">Prossimi 30 giorni</p>
            <h1>Calendario</h1>
          </div>
        </div>
      </header>

      <label className="field compact-field calendar-filter">
        <span>
          <Filter aria-hidden="true" />
          Filtro
        </span>
        <select value={filter} onChange={(event) => setFilter(event.target.value as WasteFilter)}>
          <option value="all">Tutti</option>
          {WASTE_TYPES.map((waste) => (
            <option key={waste} value={waste}>
              {formatWasteList([waste])}
            </option>
          ))}
        </select>
      </label>

      <section className="calendar-list" aria-label="Lista ritiri">
        {filtered.length === 0 && <p className="empty-state">Nessun ritiro nel periodo selezionato.</p>}
        {filtered.map((item) => {
          if (item.kind === "pause") {
            return <CalendarPauseItem key={`pause-${item.date}`} pause={item.pause} />;
          }

          const isDoublePickup = item.event.isDoublePickup || item.event.wasteTypes.length > 1;
          const tone = isDoublePickup ? "mixed" : item.event.wasteTypes[0];

          return (
            <article className="calendar-item" data-waste={tone} key={`${item.event.date}-${item.event.zone}`}>
              <time dateTime={item.event.date}>{formatDayLabel(item.event.date)}</time>
              <div className="calendar-item__main">
                <WasteVisualGroup wasteTypes={item.event.wasteTypes} compact />
                <div>
                  <h2>{formatWasteList(item.event.wasteTypes)}</h2>
                  {item.event.notes && <p className="muted">{item.event.notes}</p>}
                </div>
              </div>
              {isDoublePickup && <span className="double-pickup-chip calendar-chip">Doppio ritiro</span>}
              {item.event.isVariation && <span className="variation-chip">Variazione</span>}
            </article>
          );
        })}
      </section>
    </div>
  );
}

function buildCalendarItems(
  events: CollectionEvent[],
  municipality: MunicipalityId,
  zone: ZoneId,
  today: IsoDate,
): CalendarListItem[] {
  const upcoming = getUpcomingEvents(events, zone, today, 30);
  const eventsByDate = new Map(upcoming.map((event) => [event.date, event]));
  const items: CalendarListItem[] = [];

  for (let offset = 0; offset <= 30; offset += 1) {
    const date = addDays(today, offset);
    const event = eventsByDate.get(date);

    if (event) {
      items.push({ kind: "collection", date, event });
      continue;
    }

    const pause = getCalendarPauseDay(date, municipality);
    if (pause) {
      items.push({ kind: "pause", date, pause });
    }
  }

  return items;
}

function CalendarPauseItem({ pause }: { pause: CalendarPauseDay }) {
  const detail =
    pause.reason === "sunday"
      ? "Domenica: niente bidoni da preparare."
      : `${pause.label}: raccolta non prevista.`;

  return (
    <article className="calendar-item calendar-item--pause" data-reason={pause.reason}>
      <time dateTime={pause.date}>{formatDayLabel(pause.date)}</time>
      <div className="calendar-item__main calendar-item__main--pause">
        <span className="calendar-pause-icon" aria-hidden="true">
          <Ban />
        </span>
        <div>
          <h2>Nessuna raccolta</h2>
          <p className="muted">{detail}</p>
        </div>
      </div>
    </article>
  );
}

