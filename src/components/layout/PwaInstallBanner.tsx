"use client";

import { useState, useEffect } from "react";
import { isPushSupported, getPushPermission, subscribeToPush } from "@/lib/push-notifications";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [dismissed, setDismissed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user already dismissed this session
    if (sessionStorage.getItem("pwa-banner-dismissed")) {
      setDismissed(true);
      return;
    }

    isPushSupported().then((supported) => {
      setPushSupported(supported);
      if (supported) getPushPermission().then(setPushPermission);
    });

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  }

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  }

  async function handleEnablePush() {
    setPushLoading(true);
    setPushError(null);
    try {
      const sub = await subscribeToPush();
      if (sub) {
        setPushPermission("granted");
      } else {
        setPushError("לא הצלחנו להפעיל התראות. נסה שוב מאוחר יותר.");
      }
    } catch {
      setPushError("הדפדפן חסם התראות. אפשר אותן בהגדרות הדפדפן.");
    }
    setPushLoading(false);
  }

  if (dismissed) return null;

  const showInstall = !!installPrompt;
  const showPush = pushSupported && pushPermission === "default";

  if (!showInstall && !showPush) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:right-6 md:left-auto md:w-72 bg-card border border-border rounded-xl shadow-xl p-4 z-40">
      {/* Close button — top-start in RTL */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 left-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="סגור"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="pr-1 pl-6 space-y-3">
        {showInstall && (
          <div>
            <p className="text-sm font-semibold mb-0.5">התקן את האפליקציה</p>
            <p className="text-xs text-muted-foreground mb-2">הוסף לדף הבית לגישה מהירה</p>
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
            <p className="text-sm font-semibold mb-0.5">קבל תזכורות אזכרה</p>
            <p className="text-xs text-muted-foreground mb-2">התראות ישירות למכשיר שלך</p>
            {pushError && (
              <p className="text-xs text-destructive mb-2">{pushError}</p>
            )}
            <button
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="w-full py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            >
              {pushLoading ? "מפעיל..." : "אפשר התראות"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
