import {
  DEFAULT_ZONE,
  type GamificationState,
  type NotificationSettings,
  type UserPreferences,
  type ZoneId,
} from "../domain/models";

const STORAGE_VERSION = 1;
const PREFERENCES_KEY = "b-done/preferences";
const GAMIFICATION_KEY = "b-done/gamification";

interface Versioned<T> {
  version: number;
  value: T;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  mode: "evening",
  eveningTime: "20:30",
  morningTime: "07:30",
  permission: "unknown",
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  municipality: "jesi",
  street: "",
  zone: DEFAULT_ZONE,
  onboardingCompleted: false,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  highContrast: false,
  largeText: false,
};

export const DEFAULT_GAMIFICATION: GamificationState = {
  completedDates: [],
};

export function loadPreferences(): UserPreferences {
  return readVersioned<UserPreferences>(PREFERENCES_KEY) ?? DEFAULT_PREFERENCES;
}

export function savePreferences(preferences: UserPreferences): void {
  writeVersioned(PREFERENCES_KEY, preferences);
}

export function loadGamification(): GamificationState {
  return readVersioned<GamificationState>(GAMIFICATION_KEY) ?? DEFAULT_GAMIFICATION;
}

export function saveGamification(state: GamificationState): void {
  writeVersioned(GAMIFICATION_KEY, state);
}

export function resetAppStorage(): void {
  localStorage.removeItem(PREFERENCES_KEY);
  localStorage.removeItem(GAMIFICATION_KEY);
}

export function zoneLabel(zone: ZoneId): string {
  const labels: Record<ZoneId, string> = {
    residenziale: "Zona Residenziale",
    periferia_ovest: "Periferia Ovest",
    industriale: "Zona Industriale",
  };
  return labels[zone];
}

function readVersioned<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Versioned<T>;
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

function writeVersioned<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, value }));
  } catch {
    // Storage pieno o non disponibile: l'app resta usabile per la sessione corrente.
  }
}
