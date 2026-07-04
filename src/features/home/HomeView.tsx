import {
  Award,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Flame,
  Medal,
  ShieldCheck,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { GamificationSummary, IsoDate, MunicipalityDataset, UserPreferences, WasteType } from "../../domain/models";
import type { HomeSummary } from "../../domain/calendarEngine";
import { buildReminderPreview, describeNotificationSupport, getNotificationCapabilities } from "../../services/notificationManager";
import { addDays, formatDayLabel, todayIso } from "../../utils/date";
import { formatWasteList, formatWasteName } from "../../domain/calendarEngine";
import { WasteBadge } from "../../ui/components/WasteBadge";
import { WasteVisualGroup } from "../../ui/components/WasteVisual";

interface HomeViewProps {
  dataset: MunicipalityDataset;
  preferences: UserPreferences;
  summary: HomeSummary;
  gamification: GamificationSummary;
  completedToday: boolean;
  onDone: () => void;
  onOpenSettings: () => void;
}

const BADGE_ICONS: Record<string, LucideIcon> = {
  "first-bin": Award,
  "perfect-week": CalendarCheck,
  "perfect-month": Medal,
  "eco-hero": Sparkles,
  "zero-misses": ShieldCheck,
};

const WASTE_GUIDES: Record<WasteType, { yes: string[]; no: string[] }> = {
  organico: {
    yes: ["Scarti di cucina", "Avanzi di cibo", "Fondi di caffe", "Tovaglioli sporchi"],
    no: ["Pannolini", "Mozziconi", "Lettiere non compostabili"],
  },
  carta: {
    yes: ["Giornali", "Scatole", "Cartoni puliti", "Quaderni"],
    no: ["Carta oleata", "Scontrini", "Carta sporca di cibo"],
  },
  plastica: {
    yes: ["Bottiglie", "Flaconi", "Vaschette", "Imballaggi puliti"],
    no: ["Giocattoli", "Posate usa e getta non compostabili", "Oggetti rigidi non imballaggio"],
  },
  vetro: {
    yes: ["Bottiglie", "Vasetti", "Barattoli in vetro"],
    no: ["Ceramica", "Specchi", "Lampadine", "Cristallo"],
  },
  secco: {
    yes: ["Pannolini", "Mozziconi spenti", "Spugne", "Polvere"],
    no: ["Farmaci", "Pile", "Materiali riciclabili"],
  },
  indifferenziato: {
    yes: ["Rifiuti non riciclabili", "Piccoli oggetti misti non separabili"],
    no: ["Carta", "Vetro", "Plastica", "Organico"],
  },
};

export function HomeView({
  dataset,
  preferences,
  summary,
  gamification,
  completedToday,
  onDone,
  onOpenSettings,
}: HomeViewProps) {
  const [guideWastes, setGuideWastes] = useState<WasteType[] | null>(null);
  const capabilities = getNotificationCapabilities();
  const today = todayIso();
  const todayEvent = summary.today[0];
  const tomorrowEvent = summary.tomorrow[0];
  const featuredEvent = summary.featuredPickup ?? undefined;
  const featuredTitle = getFeaturedTitle(featuredEvent?.date, today);
  const nextPickupWastes = summary.nextPickup?.wasteTypes ?? [];
  const featuredWastes = featuredEvent?.wasteTypes ?? [];
  const isFeaturedGuideOpen = areSameWasteTypes(guideWastes, featuredWastes);
  const canComplete = summary.today.length > 0 && !completedToday;
  const reminderCta = preferences.notifications.mode === "none" ? "Attiva promemoria" : "Gestisci promemoria";

  return (
    <div className="screen stack">
      <section className="today-grid" aria-label="Raccolta in evidenza">
        <CollectionCard
          title={featuredTitle}
          date={featuredEvent?.date}
          event={featuredEvent}
          emptyText="Oggi puoi riposare."
          primary
          guideOpen={isFeaturedGuideOpen}
          onGuide={(wastes) => setGuideWastes((current) => (areSameWasteTypes(current, wastes) ? null : wastes))}
        />
        <button className="done-button done-button--today" type="button" disabled={!canComplete} onClick={onDone}>
          <CheckCircle2 aria-hidden="true" />
          {completedToday ? "Missione compiuta" : summary.today.length > 0 ? "Fatto" : "Niente da fare"}
        </button>
      </section>

      {guideWastes && <WasteGuide wasteTypes={guideWastes} onClose={() => setGuideWastes(null)} />}

      <div className="home-stats" aria-label="Statistiche personali">
        <span>
          <Flame aria-hidden="true" />
          Streak {gamification.streak}
        </span>
        <span>
          <Trophy aria-hidden="true" />
          {gamification.completedMissions} missioni
        </span>
      </div>

      <section className="panel next-panel">
        <div className="section-title next-pickup-title">
          <Clock aria-hidden="true" />
          <div>
            <p className="eyebrow">Prossimo ritiro</p>
            <h2>
              {summary.nextPickup
                ? `${formatDayLabel(summary.nextPickup.date)} - ${formatWasteList(summary.nextPickup.wasteTypes)}`
                : "Nessun ritiro trovato"}
            </h2>
          </div>
          {nextPickupWastes.length > 0 && <WasteVisualGroup wasteTypes={nextPickupWastes} compact />}
        </div>
        {summary.countdownDays !== null && (
          <div className="countdown" aria-label={`Mancano ${summary.countdownDays} giorni`}>
            <strong>{summary.countdownDays}</strong>
            <span>{summary.countdownDays === 1 ? "giorno" : "giorni"}</span>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-title">
          <Bell aria-hidden="true" />
          <div>
            <p className="eyebrow">Promemoria</p>
            <h2>{buildReminderPreview(preferences.notifications, tomorrowEvent, todayEvent)}</h2>
          </div>
        </div>
        <p className="muted">{describeNotificationSupport(capabilities)}</p>
        <button className="secondary-action reminder-action" type="button" onClick={onOpenSettings}>
          <Bell aria-hidden="true" />
          {reminderCta}
        </button>
      </section>

      <section className="panel">
        <div className="section-title">
          <Trophy aria-hidden="true" />
          <div>
            <p className="eyebrow">Badge</p>
            <h2>Ottimo lavoro</h2>
          </div>
        </div>
        <div className="badge-grid">
          {gamification.badges.map((badge) => {
            const BadgeIcon = BADGE_ICONS[badge.id] ?? Award;
            return (
              <span className="badge-pill" data-unlocked={badge.unlocked} key={badge.id}>
                <BadgeIcon aria-hidden="true" />
                {badge.name}
              </span>
            );
          })}
        </div>
        <p className="data-version">Dati {dataset.meta.version} - oggi {formatDayLabel(today)}</p>
      </section>
    </div>
  );
}

function areSameWasteTypes(current: WasteType[] | null, next: WasteType[]): boolean {
  if (!current) return false;
  return current.length === next.length && current.every((waste, index) => waste === next[index]);
}

function getFeaturedTitle(date: IsoDate | undefined, today: IsoDate): string {
  if (!date || date === today) return "Oggi";
  if (date === addDays(today, 1)) return "Domani";
  return "Prossimo";
}

function CollectionCard({
  title,
  date,
  event,
  emptyText,
  primary = false,
  guideOpen = false,
  onGuide,
}: {
  title: string;
  date?: IsoDate;
  event?: HomeSummary["today"][number];
  emptyText: string;
  primary?: boolean;
  guideOpen?: boolean;
  onGuide: (wastes: WasteType[]) => void;
}) {
  const wasteTypes = event?.wasteTypes ?? [];
  const isDoublePickup = Boolean(event && (event.isDoublePickup || wasteTypes.length > 1));
  const tone = event ? (isDoublePickup ? "mixed" : wasteTypes[0]) : "empty";

  return (
    <article className={`collection-card ${primary ? "collection-card--primary" : ""}`} data-waste={tone}>
      <div className="collection-card__topline">
        <p className="eyebrow collection-card__eyebrow"><span>{title}</span>{date && <time className="collection-card__date" dateTime={date}>{formatDayLabel(date)}</time>}</p>
        {wasteTypes.length > 0 && (
          <button
            className={`help-dot ${guideOpen ? "help-dot--active" : ""}`}
            type="button"
            aria-expanded={guideOpen}
            aria-label={`Cosa conferire in ${formatWasteList(wasteTypes)}`}
            onClick={() => onGuide(wasteTypes)}
          >
            ?
          </button>
        )}
      </div>
      {event ? (
        <>
          <WasteVisualGroup wasteTypes={wasteTypes} />
          {isDoublePickup && <span className="double-pickup-chip">Doppio ritiro</span>}
          <h2>{formatWasteList(wasteTypes)}</h2>
          {!primary && (
            <div className="waste-row">
              {wasteTypes.map((waste) => (
                <WasteBadge key={waste} type={waste} />
              ))}
            </div>
          )}
          {event.notes && <p className="muted">{event.notes}</p>}
        </>
      ) : (
        <h2>{emptyText}</h2>
      )}
    </article>
  );
}

function WasteGuide({ wasteTypes, onClose }: { wasteTypes: WasteType[]; onClose: () => void }) {
  return (
    <section className="panel waste-guide" aria-live="polite">
      <div className="collection-card__topline">
        <div>
          <p className="eyebrow">Dove lo metto?</p>
          <h2 className="guide-title">
            <WasteVisualGroup wasteTypes={wasteTypes} compact />
            {formatWasteList(wasteTypes)}
          </h2>
        </div>
        <button className="help-dot" type="button" aria-label="Chiudi guida" onClick={onClose}>
          x
        </button>
      </div>
      <div className="guide-stack">
        {wasteTypes.map((waste) => {
          const guide = WASTE_GUIDES[waste];
          return (
            <section className="guide-block" key={waste}>
              {wasteTypes.length > 1 && <h3>{formatWasteName(waste)}</h3>}
              <div className="guide-grid">
                <div>
                  <h3>Si</h3>
                  <ul>
                    {guide.yes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>No</h3>
                  <ul>
                    {guide.no.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}





