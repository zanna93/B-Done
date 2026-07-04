export type IsoDate = `${number}-${number}-${number}`;

export const MUNICIPALITIES = ["jesi"] as const;
export type MunicipalityId = (typeof MUNICIPALITIES)[number];

export const ZONES = ["residenziale", "periferia_ovest", "industriale"] as const;
export type ZoneId = (typeof ZONES)[number];

export const WASTE_TYPES = ["organico", "carta", "plastica", "vetro", "secco", "indifferenziato"] as const;
export type WasteType = (typeof WASTE_TYPES)[number];

export const DEFAULT_ZONE: ZoneId = "residenziale";

export interface CollectionEvent {
  date: IsoDate;
  zone: ZoneId;
  wasteTypes: WasteType[];
  notes: string;
  isVariation: boolean;
  isDoublePickup: boolean;
}

export interface StreetRecord {
  street: string;
  zone: ZoneId;
  notes: string;
}

export interface DataMeta {
  municipality: string;
  year: number;
  version: string;
  lastUpdated: IsoDate;
  source: string;
}

export interface MunicipalityDataset {
  collections: CollectionEvent[];
  streets: StreetRecord[];
  meta: DataMeta;
}

export type NotificationMode = "none" | "evening" | "morning" | "both";

export interface NotificationSettings {
  mode: NotificationMode;
  eveningTime: string;
  morningTime: string;
  permission: NotificationPermission | "unsupported" | "unknown";
}

export interface UserPreferences {
  municipality: MunicipalityId;
  street: string;
  zone: ZoneId;
  onboardingCompleted: boolean;
  notifications: NotificationSettings;
  highContrast: boolean;
  largeText: boolean;
}

export interface GamificationState {
  completedDates: IsoDate[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface GamificationSummary {
  streak: number;
  completedMissions: number;
  badges: Badge[];
}

export interface ValidationIssue {
  file: string;
  line: number;
  message: string;
}
