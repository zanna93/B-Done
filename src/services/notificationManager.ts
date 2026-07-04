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
      body: "Promemoria attivi. Bidone pronto al momento giusto.",
      icon: assetPath("icons/icon-192.png"),
      badge: assetPath("icons/icon-192.png"),
    });
    return true;
  }

  new Notification("B-Done", {
    body: "Promemoria attivi. Bidone pronto al momento giusto.",
    icon: assetPath("icons/icon-192.png"),
  });
  return true;
}

export function shouldSendForMode(mode: NotificationMode, moment: "evening" | "morning"): boolean {
  return mode === "both" || mode === moment;
}

export function describeNotificationSupport(capabilities: NotificationCapabilities): string {
  if (!capabilities.supported) return "Questo browser non supporta le notifiche web.";
  if (!capabilities.serviceWorker) return "Le notifiche persistenti richiedono un Service Worker.";
  if (!capabilities.push) {
    return "Le notifiche sono salvate, ma questo browser non espone Web Push.";
  }
  if (!capabilities.installedDisplayMode) {
    return "Per notifiche piu affidabili su iPhone, aggiungi B-Done alla schermata Home.";
  }
  return "Dispositivo pronto per notifiche web. In futuro potremo collegare un server push senza cambiare impostazioni.";
}

export function buildReminderPreview(settings: NotificationSettings, tomorrow?: CollectionEvent, today?: CollectionEvent): string {
  if (settings.mode === "none") return "Nessun promemoria attivo.";
  if (tomorrow && shouldSendForMode(settings.mode, "evening")) {
    return `${settings.eveningTime} - ${buildNotificationText(tomorrow, "tomorrow")}`;
  }
  if (today && shouldSendForMode(settings.mode, "morning")) {
    return `${settings.morningTime} - ${buildNotificationText(today, "today")}`;
  }
  return "Promemoria configurati. Ti avviseremo quando c'e un ritiro utile.";
}

function isIosStandalone(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return Boolean(navigatorWithStandalone.standalone);
}
