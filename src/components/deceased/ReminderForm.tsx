"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  boxShadow: "0 2px 10px rgba(184,134,11,0.07)",
};

const DAY_OPTIONS = [
  { value: 30, label: "30 יום לפני" },
  { value: 14, label: "14 יום לפני" },
  { value: 7,  label: "שבוע לפני" },
  { value: 2,  label: "יומיים לפני" },
  { value: 1,  label: "יום לפני" },
  { value: 0,  label: "ביום עצמו" },
];

const CHANNEL_OPTIONS = [
  { value: "email",    label: "אימייל",   icon: "✉️" },
  { value: "push",     label: "Push",     icon: "🔔" },
  { value: "sms",      label: "SMS",      icon: "💬" },
  { value: "whatsapp", label: "WhatsApp", icon: "📱" },
];

export function ReminderForm({
  deceasedId,
  userId,
  existingReminder,
}: {
  deceasedId: string;
  userId: string;
  existingReminder: ReminderSchedule | null;
}) {
  const router = useRouter();
  const [days, setDays] = useState<number[]>(existingReminder?.days_before ?? DEFAULT_DAYS);
  const [channels, setChannels] = useState<string[]>(existingReminder?.channels ?? DEFAULT_CHANNELS);
  const [customMessage, setCustomMessage] = useState(existingReminder?.custom_message ?? "");
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
      if (!channels.includes("push")) setChannels((prev) => [...prev, "push"]);
    }
  }

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
      await supabase.from("reminder_schedule").update(data).eq("id", existingReminder.id);
    } else {
      await supabase.from("reminder_schedule").insert(data);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => router.back(), 1000);
  }

  return (
    <div className="space-y-4">
      {/* Saved toast */}
      {saved && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #86efac, #4ade80)", color: "#14532d" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          הגדרות נשמרו
        </div>
      )}

      {/* Active / inactive status banner */}
      <button
        type="button"
        onClick={() => setActive((v) => !v)}
        className="w-full flex items-center justify-between p-4 rounded-2xl transition-all"
        style={
          active
            ? { background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #22c55e60" }
            : { background: "var(--muted)", border: "1px solid var(--border)" }
        }
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={
              active
                ? { background: "linear-gradient(135deg, #22c55e, #16a34a)" }
                : { background: "var(--secondary)" }
            }
          >
            <svg className="w-5 h-5" style={{ color: active ? "white" : "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm" style={{ color: active ? "#15803d" : "var(--foreground)" }}>
              {active ? "התזכורות פעילות" : "התזכורות מושהות"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: active ? "#16a34a" : "var(--muted-foreground)" }}>
              {active ? "תקבל התראות לפי ההגדרות" : "לחץ להפעלת התזכורות"}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <div
          className="w-12 h-6 rounded-full transition-all relative shrink-0"
          style={{ background: active ? "linear-gradient(135deg, #22c55e, #16a34a)" : "var(--secondary)" }}
        >
          <div
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
            style={{ right: active ? "4px" : "auto", left: active ? "auto" : "4px" }}
          />
        </div>
      </button>

      {/* Event timing */}
      <div style={cardStyle}>
        <div className="p-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>מתי לשלוח תזכורת</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>בחר כמה זמן לפני האזכרה</p>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map(({ value, label }) => {
              const isSelected = days.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                  style={
                    isSelected
                      ? {
                          background: "linear-gradient(135deg, #c9a84c, #8b6010)",
                          color: "white",
                          boxShadow: "0 2px 6px rgba(184,134,11,0.25)",
                        }
                      : {
                          background: "var(--muted)",
                          color: "var(--muted-foreground)",
                        }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          {days.length === 0 && (
            <p className="text-xs mt-2" style={{ color: "#ef4444" }}>יש לבחור לפחות מועד אחד</p>
          )}
        </div>
      </div>

      {/* Channels */}
      <div style={cardStyle}>
        <div className="p-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>ערוצי שליחה</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>כיצד לשלוח את התזכורת</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2">
          {CHANNEL_OPTIONS.map(({ value, label, icon }) => {
            const isPushChannel = value === "push";
            const pushBlocked = isPushChannel && pushSupported && pushPermission === "denied";
            const isSelected = channels.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  if (pushBlocked) return;
                  if (isPushChannel && pushPermission === "default" && !isSelected) {
                    handleEnablePush();
                  } else {
                    toggleChannel(value);
                  }
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl transition-all text-right"
                style={
                  isSelected && !pushBlocked
                    ? {
                        background: "linear-gradient(135deg, #fff8e8, #fef3d0)",
                        border: "1px solid #c9a84c60",
                      }
                    : {
                        background: "var(--muted)",
                        border: "1px solid transparent",
                        opacity: pushBlocked ? 0.4 : 1,
                      }
                }
              >
                <span className="text-base">{icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: isSelected && !pushBlocked ? "#8b6010" : "var(--foreground)" }}>
                    {label}
                  </p>
                  {pushBlocked && <p className="text-xs" style={{ color: "#ef4444" }}>חסום</p>}
                </div>
                {isSelected && !pushBlocked && (
                  <svg className="w-4 h-4 mr-auto shrink-0" style={{ color: "#c9a84c" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom message */}
      <div style={cardStyle}>
        <div className="p-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>הודעה אישית</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>אופציונלי — תצורף לתזכורת</p>
        </div>
        <div className="p-4">
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={2}
            placeholder="לזכר נשמת..."
            className="w-full px-3 py-2 rounded-xl text-sm resize-none focus:outline-none"
            style={{
              background: "var(--muted)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              direction: "rtl",
            }}
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || days.length === 0}
        className="w-full py-3.5 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2"
        style={{
          background: saving || days.length === 0
            ? "var(--muted)"
            : "linear-gradient(135deg, #c9a84c, #8b6010)",
          color: saving || days.length === 0 ? "var(--muted-foreground)" : "white",
          boxShadow: saving || days.length === 0 ? "none" : "0 4px 14px rgba(184,134,11,0.30)",
        }}
      >
        {saving ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            שומר...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            שמור וחזור
          </>
        )}
      </button>
    </div>
  );
}
