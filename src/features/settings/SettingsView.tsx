import { Bell, Contrast, Info, MapPin, RotateCcw, Send, Type } from "lucide-react";
import { useMemo, useState } from "react";
import type { MunicipalityDataset, NotificationMode, UserPreferences, ZoneId } from "../../domain/models";
import { resolveStreet, suggestStreets } from "../../domain/streetResolver";
import {
  describeNotificationSupport,
  getNotificationCapabilities,
  requestNotificationPermission,
  showTestNotification,
} from "../../services/notificationManager";
import { zoneLabel } from "../../services/storage";

interface SettingsViewProps {
  dataset: MunicipalityDataset;
  preferences: UserPreferences;
  onChange: (preferences: UserPreferences) => void;
  onReset: () => void;
}

export function SettingsView({ dataset, preferences, onChange, onReset }: SettingsViewProps) {
  const [street, setStreet] = useState(preferences.street);
  const [manualZone, setManualZone] = useState<ZoneId>(preferences.zone);
  const [testMessage, setTestMessage] = useState("");
  const suggestions = useMemo(() => suggestStreets(street, dataset.streets), [dataset.streets, street]);
  const streetResolution = useMemo(() => resolveStreet(street, dataset.streets), [dataset.streets, street]);
  const capabilities = getNotificationCapabilities();

  async function saveAddress() {
    const resolution = street.trim() ? resolveStreet(street, dataset.streets) : null;
    onChange({
      ...preferences,
      street: street.trim(),
      zone: resolution?.zone ?? manualZone,
    });
  }

  async function updateNotificationMode(mode: NotificationMode) {
    const permission = mode === "none" ? preferences.notifications.permission : await requestNotificationPermission();
    onChange({
      ...preferences,
      notifications: { ...preferences.notifications, mode, permission },
    });
  }

  async function handleTestNotification() {
    const shown = await showTestNotification();
    setTestMessage(shown ? "Notifica inviata." : "Permesso notifiche non concesso.");
  }

  function resetWithConfirm() {
    if (window.confirm("Vuoi resettare B-Done su questo dispositivo?")) {
      onReset();
    }
  }

  return (
    <div className="screen stack">
      <header className="screen-header">
        <p className="eyebrow">B-Done</p>
        <h1>Impostazioni</h1>
      </header>

      <section className="panel stack">
        <div className="section-title">
          <MapPin aria-hidden="true" />
          <div>
            <p className="eyebrow">Indirizzo</p>
            <h2>{zoneLabel(preferences.zone)}</h2>
          </div>
        </div>
        <label className="field">
          <span>Via</span>
          <input value={street} onChange={(event) => setStreet(event.target.value)} placeholder="Via" />
        </label>
        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((suggestion) => (
              <button key={suggestion.street} type="button" onClick={() => setStreet(suggestion.street)}>
                {suggestion.street}
              </button>
            ))}
          </div>
        )}
        {street.trim() && !streetResolution.matchedStreet && (
          <div className="hint-box">
            Via non trovata: B-Done seleziona automaticamente {zoneLabel(streetResolution.zone)}.
          </div>
        )}
        <div className="zone-picker">
          {(["residenziale", "periferia_ovest", "industriale"] as const).map((zone) => (
            <button
              key={zone}
              type="button"
              aria-pressed={manualZone === zone}
              onClick={() => setManualZone(zone)}
            >
              {zoneLabel(zone)}
            </button>
          ))}
        </div>
        <button className="primary-action" type="button" onClick={saveAddress}>
          Salva indirizzo
        </button>
      </section>

      <section className="panel stack">
        <div className="section-title">
          <Bell aria-hidden="true" />
          <div>
            <p className="eyebrow">Notifiche</p>
            <h2>{describeNotificationSupport(capabilities)}</h2>
          </div>
        </div>
        <div className="segmented-control">
          {(["evening", "morning", "both", "none"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={preferences.notifications.mode === mode}
              onClick={() => updateNotificationMode(mode)}
            >
              {notificationModeLabel(mode)}
            </button>
          ))}
        </div>
        <div className="time-grid">
          <label className="field">
            <span>Sera prima</span>
            <input
              type="time"
              value={preferences.notifications.eveningTime}
              onChange={(event) =>
                onChange({
                  ...preferences,
                  notifications: { ...preferences.notifications, eveningTime: event.target.value },
                })
              }
            />
          </label>
          <label className="field">
            <span>Mattina</span>
            <input
              type="time"
              value={preferences.notifications.morningTime}
              onChange={(event) =>
                onChange({
                  ...preferences,
                  notifications: { ...preferences.notifications, morningTime: event.target.value },
                })
              }
            />
          </label>
        </div>
        <button className="secondary-action" type="button" onClick={handleTestNotification}>
          <Send aria-hidden="true" />
          Prova notifica
        </button>
        {testMessage && <p className="muted">{testMessage}</p>}
      </section>

      <section className="panel stack">
        <div className="toggle-row">
          <span>
            <Contrast aria-hidden="true" />
            Contrasto elevato
          </span>
          <input
            type="checkbox"
            checked={preferences.highContrast}
            onChange={(event) => onChange({ ...preferences, highContrast: event.target.checked })}
          />
        </div>
        <div className="toggle-row">
          <span>
            <Type aria-hidden="true" />
            Testo grande
          </span>
          <input
            type="checkbox"
            checked={preferences.largeText}
            onChange={(event) => onChange({ ...preferences, largeText: event.target.checked })}
          />
        </div>
      </section>

      <section className="panel stack">
        <div className="section-title">
          <Info aria-hidden="true" />
          <div>
            <p className="eyebrow">Versione dati</p>
            <h2>{dataset.meta.version}</h2>
          </div>
        </div>
        <p className="muted">{dataset.meta.source}</p>
        <button className="danger-action" type="button" onClick={resetWithConfirm}>
          <RotateCcw aria-hidden="true" />
          Reset app
        </button>
      </section>
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
