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
import { useRef, useState } from "react";
import type { Badge, GamificationSummary, IsoDate, MunicipalityDataset, UserPreferences, WasteType } from "../../domain/models";
import type { HomeSummary } from "../../domain/calendarEngine";
import { buildReminderPreview, describeNotificationSupport, getNotificationCapabilities } from "../../services/notificationManager";
import { formatDayLabel, todayIso } from "../../utils/date";
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
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const badgeSectionRef = useRef<HTMLElement | null>(null);
  const capabilities = getNotificationCapabilities();
  const today = todayIso();
  const todayEvent = summary.today[0];
  const tomorrowEvent = summary.tomorrow[0];
  const featuredEvent = summary.featuredPickup ?? undefined;
  const featuredTitle = featuredEvent ? "Metti fuori" : "Oggi";
  const followingPickup = summary.followingPickup;
  const followingPickupWastes = followingPickup?.wasteTypes ?? [];
  const featuredWastes = featuredEvent?.wasteTypes ?? [];
  const isFeaturedGuideOpen = areSameWasteTypes(guideWastes, featuredWastes);
  const canComplete = summary.today.length > 0 && !completedToday;
  const reminderCta = preferences.notifications.mode === "none" ? "Attiva promemoria" : "Gestisci promemoria";
  const selectedBadge = gamification.badges.find((badge) => badge.id === selectedBadgeId) ?? null;

  function scrollToBadges() {
    badgeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
        <button className="stat-chip" type="button" onClick={scrollToBadges}>
          <Trophy aria-hidden="true" />
          {formatMissionCount(gamification.completedMissions)}
        </button>
      </div>

      <section className="panel next-panel">
        <div className="section-title next-pickup-title">
          <Clock aria-hidden="true" />
          <div>
            <p className="eyebrow">Prossimo ritiro</p>
            <h2>
              {followingPickup
                ? `${formatDayLabel(followingPickup.date)} - ${formatWasteList(followingPickup.wasteTypes)}`
                : "Nessun altro ritiro trovato"}
            </h2>
          </div>
          {followingPickupWastes.length > 0 && <WasteVisualGroup wasteTypes={followingPickupWastes} compact />}
        </div>
        {summary.followingCountdownDays !== null && (
          <div className="countdown" aria-label={formatCountdownLabel(summary.followingCountdownDays)}>
            {summary.followingCountdownDays === 0 ? (
              <strong>oggi</strong>
            ) : (
              <>
                <span>tra</span>
                <strong>{summary.followingCountdownDays}</strong>
                <span>{summary.followingCountdownDays === 1 ? "giorno" : "giorni"}</span>
              </>
            )}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-title">
          <Bell aria-hidden="true" />
          <div>
            <p className="eyebrow">Promemoria - in sviluppo</p>
            <h2>{buildReminderPreview(preferences.notifications, tomorrowEvent, todayEvent)}</h2>
          </div>
        </div>
        <p className="muted">{describeNotificationSupport(capabilities)}</p>
        <button className="secondary-action reminder-action" type="button" onClick={onOpenSettings}>
          <Bell aria-hidden="true" />
          {reminderCta}
        </button>
      </section>

      <section className="panel" ref={badgeSectionRef}>
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
              <button
                className="badge-pill"
                data-unlocked={badge.unlocked}
                data-selected={selectedBadgeId === badge.id}
                key={badge.id}
                type="button"
                aria-pressed={selectedBadgeId === badge.id}
                onClick={() => setSelectedBadgeId((current) => (current === badge.id ? null : badge.id))}
              >
                <BadgeIcon aria-hidden="true" />
                {badge.name}
              </button>
            );
          })}
        </div>
        {selectedBadge && <BadgeDetail badge={selectedBadge} />}
        <p className="data-version">Dati {dataset.meta.version} - oggi {formatDayLabel(today)}</p>
      </section>
    </div>
  );
}

function areSameWasteTypes(current: WasteType[] | null, next: WasteType[]): boolean {
  if (!current) return false;
  return current.length === next.length && current.every((waste, index) => waste === next[index]);
}

function formatMissionCount(count: number): string {
  return count === 1 ? "1 missione" : `${count} missioni`;
}

function formatCountdownLabel(days: number): string {
  if (days === 0) return "Oggi";
  return `Tra ${days} ${days === 1 ? "giorno" : "giorni"}`;
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
        <p className="eyebrow collection-card__eyebrow">
          <span>{title}</span>
          {date && <time className="collection-card__date" dateTime={date}>{formatDayLabel(date)}</time>}
        </p>
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

function BadgeDetail({ badge }: { badge: Badge }) {
  const BadgeIcon = BADGE_ICONS[badge.id] ?? Award;

  return (
    <div className="badge-detail" data-unlocked={badge.unlocked} aria-live="polite">
      <BadgeIcon aria-hidden="true" />
      <div>
        <strong>{badge.name}</strong>
        <p>{badge.description}</p>
        {!badge.unlocked && <small>Continua con le missioni: ci sei quasi.</small>}
      </div>
    </div>
  );
}

