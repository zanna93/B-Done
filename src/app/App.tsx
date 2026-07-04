import { CalendarDays, Home, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { loadJesiDataset } from "../data/calendarRepository";
import { getGamificationSummary, markMissionDone } from "../domain/gamificationEngine";
import type { GamificationState, UserPreferences } from "../domain/models";
import { getHomeSummary } from "../domain/calendarEngine";
import { CalendarView } from "../features/calendar/CalendarView";
import { HomeView } from "../features/home/HomeView";
import { Onboarding } from "../features/onboarding/Onboarding";
import { SettingsView } from "../features/settings/SettingsView";
import { BottomNav, type NavItem } from "../ui/components/BottomNav";
import { DataIssuePanel } from "../ui/components/DataIssuePanel";
import { todayIso } from "../utils/date";
import {
  DEFAULT_GAMIFICATION,
  DEFAULT_PREFERENCES,
  loadGamification,
  loadPreferences,
  resetAppStorage,
  saveGamification,
  savePreferences,
} from "../services/storage";

type AppTab = "home" | "calendar" | "settings";

const NAV_ITEMS: Array<NavItem<AppTab>> = [
  { id: "home", label: "Home", icon: Home },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "settings", label: "Impostazioni", icon: Settings },
];

export function App() {
  const datasetResult = useMemo(() => loadJesiDataset(), []);
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());
  const [gamification, setGamification] = useState<GamificationState>(() => loadGamification());
  const [activeTab, setActiveTab] = useState<AppTab>(() => getInitialTab());
  const today = todayIso();
  const currentHour = new Date().getHours();

  useEffect(() => {
    document.documentElement.dataset.highContrast = String(preferences.highContrast);
    document.documentElement.dataset.largeText = String(preferences.largeText);
  }, [preferences.highContrast, preferences.largeText]);

  if (!datasetResult.ok) {
    return <DataIssuePanel issues={datasetResult.errors} />;
  }

  const dataset = datasetResult.value;

  function persistPreferences(next: UserPreferences) {
    setPreferences(next);
    savePreferences(next);
  }

  function persistGamification(next: GamificationState) {
    setGamification(next);
    saveGamification(next);
  }

  function handleReset() {
    resetAppStorage();
    setPreferences(DEFAULT_PREFERENCES);
    setGamification(DEFAULT_GAMIFICATION);
    setActiveTab("home");
  }

  if (!preferences.onboardingCompleted) {
    return <Onboarding dataset={dataset} onComplete={persistPreferences} />;
  }

  const summary = getHomeSummary(dataset.collections, preferences.zone, today, { currentHour });
  const game = getGamificationSummary(gamification, dataset.collections, preferences.zone, today);

  return (
    <div className="app-shell">
      <main className="app-content">
        {activeTab === "home" && (
          <HomeView
            dataset={dataset}
            preferences={preferences}
            summary={summary}
            gamification={game}
            completedToday={gamification.completedDates.includes(today)}
            onDone={() => persistGamification(markMissionDone(gamification, today))}
            onOpenSettings={() => setActiveTab("settings")}
          />
        )}
        {activeTab === "calendar" && (
          <CalendarView
            events={dataset.collections}
            municipality={preferences.municipality}
            zone={preferences.zone}
            today={today}
          />
        )}
        {activeTab === "settings" && (
          <SettingsView
            dataset={dataset}
            preferences={preferences}
            onChange={persistPreferences}
            onReset={handleReset}
          />
        )}
      </main>
      <BottomNav items={NAV_ITEMS} activeId={activeTab} onChange={setActiveTab} />
    </div>
  );
}

function getInitialTab(): AppTab {
  const tab = new URLSearchParams(window.location.search).get("tab");
  return tab === "calendar" || tab === "settings" ? tab : "home";
}

