"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToPush, isPushSupported, getPushPermission } from "@/lib/push-notifications";

const DEFAULT_DAYS = [30, 7, 2, 1, 0];
const DEFAULT_CHANNELS = ["email", "push"];

interface ReminderSchedule {
  id: string;
  days_before: number[];
  channels: string[];
  custom_message: string | null;
  active: boolean;
}

export function ReminderForm({
  deceasedId,
  userId,
  existingReminder,
}: {
  deceasedId: string;
  userId: string;
  existingReminder: ReminderSchedule | null;
}) {
  const [days, setDays] = useState<number[]>(
    existingReminder?.days_before || DEFAULT_DAYS
  );
  const [channels, setChannels] = useState<string[]>(
    existingReminder?.channels || DEFAULT_CHANNELS
  );
  const [customMessage, setCustomMessage] = useState(
    existingReminder?.custom_message || ""
  );
  const [active, setActive] = useState(existingReminder?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    isPushSupported().then((supported) => {
      setPushSupported(supported);
      if (supported) getPushPermission().then(setPushPermission);
    });
  }, []);

  async function handleEnablePush() {
    const sub = await subscribeToPush();
    if (sub) {
      setPushPermission("granted");
      if (!channels.includes("push")) {
        setChannels((prev) => [...prev, "push"]);
      }
    }
  }

  const allDayOptions = [
    { value: 30, label: "30 ימים" },
    { value: 14, label: "14 ימים" },
    { value: 7, label: "7 ימים" },
    { value: 2, label: "יומיים" },
    { value: 1, label: "יום אחד" },
    { value: 0, label: "ביום עצמו" },
  ];

  const channelOptions = [
    { value: "email", label: "אימייל" },
    { value: "push", label: "Push" },
    { value: "sms", label: "SMS" },
    { value: "whatsapp", label: "WhatsApp" },
  ];

  function toggleDay(val: number) {
    setDays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val].sort((a, b) => b - a)
    );
  }

  function toggleChannel(val: string) {
    setChannels((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const data = {
      deceased_id: deceasedId,
      user_id: userId,
      days_before: days,
      channels,
      custom_message: customMessage || null,
      active,
    };

    if (existingReminder) {
      await supabase
        .from("reminder_schedule")
        .update(data)
        .eq("id", existingReminder.id);
    } else {
      await supabase.from("reminder_schedule").insert(data);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">הגדרות תזכורות</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-muted-foreground">פעיל</span>
          <div
            onClick={() => setActive(!active)}
            className={`w-10 h-6 rounded-full transition-colors relative ${
              active ? "bg-primary" : "bg-secondary"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                active ? "right-1" : "left-1"
              }`}
            />
          </div>
        </label>
      </div>

      {/* Days before */}
      <div>
        <p className="text-sm font-medium mb-2">שלח תזכורת לפני:</p>
        <div className="flex flex-wrap gap-2">
          {allDayOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleDay(value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                days.includes(value)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Channels */}
      <div>
        <p className="text-sm font-medium mb-2">ערוצי שליחה:</p>
        <div className="grid grid-cols-2 gap-2">
          {channelOptions.map(({ value, label }) => {
            const isPushChannel = value === "push";
            const pushBlocked = isPushChannel && pushSupported && pushPermission === "denied";
            const needsPermission = isPushChannel && pushSupported && pushPermission === "default";
            return (
              <div key={value}>
                <label className={`flex items-center gap-2 cursor-pointer ${pushBlocked ? "opacity-50" : ""}`}>
                  <input
                    type="checkbox"
                    checked={channels.includes(value)}
                    onChange={() => {
                      if (isPushChannel && pushPermission === "default" && !channels.includes("push")) {
                        handleEnablePush();
                      } else {
                        toggleChannel(value);
                      }
                    }}
                    disabled={pushBlocked}
                    className="w-4 h-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm">{label}</span>
                </label>
                {needsPermission && channels.includes("push") && pushPermission === "default" && (
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    className="mt-1 text-xs text-primary hover:underline"
                  >
                    אשר הרשאה
                  </button>
                )}
                {pushBlocked && (
                  <p className="text-xs text-destructive mt-0.5">חסום בדפדפן</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom message */}
      <div>
        <label className="block text-sm font-medium mb-1">הודעה אישית (אופציונלי)</label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          rows={2}
          placeholder="לזכר נשמת..."
          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "שומר..." : saved ? "נשמר!" : "שמור הגדרות"}
      </button>
    </div>
  );
}
