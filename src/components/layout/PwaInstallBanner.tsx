"use client";

import { useState, useEffect } from "react";
import { subscribeToPush, isPushSupported, getPushPermission } from "@/lib/push-notifications";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    isPushSupported().then((supported) => {
      setPushSupported(supported);
      if (supported) {
        getPushPermission().then(setPushPermission);
      }
    });

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    // Register SW on load
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  }

  async function handleEnablePush() {
    const sub = await subscribeToPush();
    if (sub) {
      setPushPermission("granted");
    }
  }

  if (dismissed) return null;

  const showInstall = !!installPrompt;
  const showPush = pushSupported && pushPermission === "default";

  if (!showInstall && !showPush) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:left-auto md:w-80 bg-card border border-border rounded-xl shadow-lg p-4 z-40">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 left-3 text-muted-foreground hover:text-foreground"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {showInstall && (
        <div className="mb-3">
          <p className="text-sm font-semibold mb-1">התקן את האפליקציה</p>
          <p className="text-xs text-muted-foreground mb-2">
            הוסף לדף הבית לגישה מהירה
          </p>
          <button
            onClick={handleInstall}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            הוסף לדף הבית
          </button>
        </div>
      )}

      {showPush && (
        <div>
          <p className="text-sm font-semibold mb-1">אפשר התראות</p>
          <p className="text-xs text-muted-foreground mb-2">
            קבל תזכורות אזכרה ישירות למכשיר
          </p>
          <button
            onClick={handleEnablePush}
            className="w-full py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            אפשר התראות
          </button>
        </div>
      )}
    </div>
  );
}
