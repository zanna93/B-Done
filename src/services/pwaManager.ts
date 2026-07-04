import { assetPath } from "../utils/assets";

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(assetPath("sw.js")).catch(() => {
      // La PWA resta funzionante online anche se la registrazione fallisce.
    });
  });
}
