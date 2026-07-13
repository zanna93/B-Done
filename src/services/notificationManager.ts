import type { CollectionEvent, NotificationMode, NotificationSettings } from "../domain/models";
import { buildNotificationText } from "../domain/calendarEngine";
import { assetPath } from "../utils/assets";

export interface NotificationCapabilities {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  serviceWorker: boolean;
  push: boolean;
  installedDisplayMode: boolean;
}

export function getNotificationCapabilities(): NotificationCapabilities {
  const supported = "Notification" in window;
  const serviceWorker = "serviceWorker" in navigator;
  const push = serviceWorker && "PushManager" in window;
  const installedDisplayMode = window.matchMedia("(display-mode: standalone)").matches || isIosStandalone();

  return {
    supported,
    permission: supported ? Notification.permission : "unsupported",
    serviceWorker,
    push,
    installedDisplayMode,
  };
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

export async function showTestNotification(): Promise<boolean> {
  const permission = await requestNotificationPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker?.ready;
  if (registration?.showNotification) {
    await registration.showNotification("B-Done", {
      body: "Test riuscito. Per gli avvisi programmati usa il calendario o il futuro server push.",
      icon: assetPath("icons/b-done-icon-192.png"),
      badge: assetPath("icons/b-done-icon-192.png"),
    });
    return true;
  }

  new Notification("B-Done", {
    body: "Test riuscito. Per gli avvisi programmati usa il calendario o il futuro server push.",
    icon: assetPath("icons/b-done-icon-192.png"),
  });
  return true;
}

export function shouldSendForMode(mode: NotificationMode, moment: "evening" | "morning"): boolean {
  return mode === "both" || mode === moment;
}

export function describeNotificationSupport(capabilities: NotificationCapabilities): string {
  if (!capabilities.supported) return "Questo browser non supporta le notifiche web.";
  if (!capabilities.serviceWorker) return "Questo browser non supporta le notifiche persistenti via Service Worker.";
  if (!capabilities.push) {
    return "Questo browser non espone Web Push: usa il calendario del telefono per avvisi affidabili.";
  }
  if (!capabilities.installedDisplayMode) {
    return "Per iPhone: aggiungi B-Done alla schermata Home. Per promemoria affidabili usa anche il calendario.";
  }
  return "Le notifiche immediate funzionano. Per avvisi programmati a app chiusa serve il calendario o un server push.";
}

export function buildReminderPreview(settings: NotificationSettings, tomorrow?: CollectionEvent, today?: CollectionEvent): string {
  if (settings.mode === "none") return "Nessun promemoria attivo.";
  if (tomorrow && shouldSendForMode(settings.mode, "evening")) {
    return `${settings.eveningTime} - ${buildNotificationText(tomorrow, "tomorrow")}`;
  }
  if (today && shouldSendForMode(settings.mode, "morning")) {
    return `${settings.morningTime} - ${buildNotificationText(today, "today")}`;
  }
  return "Promemoria configurati. Scarica il calendario per riceverli anche ad app chiusa.";
}

function isIosStandalone(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return Boolean(navigatorWithStandalone.standalone);
}
