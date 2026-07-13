import { Bell, CheckCircle2, ChevronLeft, ChevronRight, MapPin, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { MunicipalityDataset, NotificationMode, UserPreferences, ZoneId } from "../../domain/models";
import { resolveStreet, suggestStreets } from "../../domain/streetResolver";
import { requestNotificationPermission } from "../../services/notificationManager";
import { DEFAULT_NOTIFICATION_SETTINGS, DEFAULT_PREFERENCES, zoneLabel } from "../../services/storage";
import { assetPath } from "../../utils/assets";

interface OnboardingProps {
  dataset: MunicipalityDataset;
  onComplete: (preferences: UserPreferences) => void;
}

const STEPS = ["Ciao", "Comune", "Via", "Promemoria", "Pronto"] as const;

export function Onboarding({ dataset, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [street, setStreet] = useState("");
  const [manualZone, setManualZone] = useState<ZoneId>("residenziale");
  const [mode, setMode] = useState<NotificationMode>("evening");
  const [eveningTime, setEveningTime] = useState("20:30");
  const [morningTime, setMorningTime] = useState("07:30");
  const [saving, setSaving] = useState(false);

  const streetSuggestions = useMemo(() => suggestStreets(street, dataset.streets), [dataset.streets, street]);
  const resolution = useMemo(() => resolveStreet(street, dataset.streets), [dataset.streets, street]);
  const selectedZone = street.trim() ? resolution.zone : manualZone;

  async function finish() {
    setSaving(true);
    const permission = mode === "none" ? "unknown" : await requestNotificationPermission();
    onComplete({
      ...DEFAULT_PREFERENCES,
      street: street.trim(),
      zone: selectedZone,
      onboardingCompleted: true,
      notifications: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        mode,
        eveningTime,
        morningTime,
        permission,
      },
    });
  }

  return (
    <main className="onboarding">
      <div className="stepper" aria-label="Avanzamento onboarding">
        {STEPS.map((label, index) => (
          <span key={label} className="stepper__dot" data-active={index <= step} aria-label={label} />
        ))}
      </div>

      {step === 0 && (
        <section className="onboarding__panel">
          <div className="brand-mark" aria-hidden="true">
            <img src={assetPath("icons/b-done-icon-192.png")} alt="" />
          </div>
          <p className="eyebrow">Benvenuto</p>
          <h1>B-Done</h1>
          <p className="lede">
            Il tuo assistente per la raccolta rifiuti porta a porta. Una volta configurato, ti ricorda cosa mettere
            fuori.
          </p>
          <button className="primary-action" type="button" onClick={() => setStep(1)}>
            <Sparkles aria-hidden="true" />
            Inizia
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="onboarding__panel">
          <p className="eyebrow">Comune</p>
          <h1>Partiamo da Jesi</h1>
          <button className="choice-row" type="button" aria-pressed="true">
            <MapPin aria-hidden="true" />
            <span>
              <strong>Jesi</strong>
              <small>AN, calendario 2026</small>
            </span>
          </button>
          <StepActions onBack={() => setStep(0)} onNext={() => setStep(2)} />
        </section>
      )}

      {step === 2 && (
        <section className="onboarding__panel">
          <p className="eyebrow">Indirizzo</p>
          <h1>Scrivi la tua via</h1>
          <label className="field field--street-input">
            <div className="input-with-icon">
              <Search aria-hidden="true" />
              <input
                value={street}
                onChange={(event) => setStreet(event.target.value)}
                placeholder="es. Montecappone"
                aria-label="Via"
                autoComplete="street-address"
              />
            </div>
          </label>

          {street.trim() && (
            <div className="hint-box">
              {resolution.matchedStreet ? (
                <span>
                  Trovata: <strong>{resolution.matchedStreet}</strong> - {zoneLabel(resolution.zone)}
                </span>
              ) : (
                <span>Via non trovata: useremo {zoneLabel(resolution.zone)}.</span>
              )}
            </div>
          )}

          {streetSuggestions.length > 0 && (
            <div className="suggestions">
              {streetSuggestions.map((suggestion) => (
                <button key={suggestion.street} type="button" onClick={() => setStreet(suggestion.street)}>
                  {suggestion.street}
                </button>
              ))}
            </div>
          )}

          <div className="zone-picker" aria-label="Seleziona zona">
            {(["residenziale", "periferia_ovest", "industriale"] as const).map((zone) => (
              <button
                key={zone}
                type="button"
                aria-pressed={!street.trim() && manualZone === zone}
                disabled={Boolean(street.trim())}
                onClick={() => setManualZone(zone)}
              >
                {zoneLabel(zone)}
              </button>
            ))}
          </div>
          <StepActions onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </section>
      )}

      {step === 3 && (
        <section className="onboarding__panel">
          <p className="eyebrow">Promemoria</p>
          <h1>Quando ti avviso?</h1>
          <div className="segmented-control">
            {(["evening", "morning", "both", "none"] as const).map((option) => (
              <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)}>
                {notificationModeLabel(option)}
              </button>
            ))}
          </div>
          <div className="time-grid">
            <label className="field">
              <span>Sera prima</span>
              <input type="time" value={eveningTime} onChange={(event) => setEveningTime(event.target.value)} />
            </label>
            <label className="field">
              <span>Mattina</span>
              <input type="time" value={morningTime} onChange={(event) => setMorningTime(event.target.value)} />
            </label>
          </div>
          <StepActions onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </section>
      )}

      {step === 4 && (
        <section className="onboarding__panel">
          <p className="eyebrow">Fine onboarding</p>
          <h1>Missione quasi compiuta</h1>
          <div className="summary-list">
            <span>Comune: Jesi</span>
            <span>Zona: {zoneLabel(selectedZone)}</span>
            <span>Promemoria: {notificationModeLabel(mode)}</span>
          </div>
          <button className="primary-action" type="button" onClick={finish} disabled={saving}>
            <CheckCircle2 aria-hidden="true" />
            {saving ? "Attivo..." : "Attiva B-Done"}
          </button>
          <button className="ghost-action" type="button" onClick={() => setStep(3)}>
            <ChevronLeft aria-hidden="true" />
            Modifica
          </button>
        </section>
      )}
    </main>
  );
}

function StepActions({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="step-actions">
      <button className="icon-action" type="button" onClick={onBack} aria-label="Indietro">
        <ChevronLeft aria-hidden="true" />
      </button>
      <button className="primary-action" type="button" onClick={onNext}>
        Avanti
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}

function notificationModeLabel(mode: NotificationMode): string {
  const labels: Record<NotificationMode, string> = {
    evening: "Solo sera",
    morning: "Solo mattina",
    both: "Entrambe",
    none: "Nessuna",
  };
  return labels[mode];
}
