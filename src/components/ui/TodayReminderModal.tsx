"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export interface ModalYahrzeit {
  deceasedId: string;
  fullName: string;
  hebrewDate: string;
  daysUntil: number;
}

export interface ModalHoliday {
  name: string;
  description: string;
  types: string[];
  daysUntil: number;
}

interface Props {
  yahrzeits: ModalYahrzeit[];
  holidays: ModalHoliday[];
  locale: string;
  todayStr: string;
}

function CandleIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: "#c9a84c" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2c0 0-2 2-2 4s2 2 2 2 2-2 2-2-2-4-2-4z" fill="currentColor" opacity={0.6} />
      <rect x="9" y="8" width="6" height="14" rx="1" />
    </svg>
  );
}

function dayLabel(daysUntil: number) {
  return daysUntil === 0 ? "היום" : "הלילה";
}

export function TodayReminderModal({ yahrzeits, holidays, locale, todayStr }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (yahrzeits.length === 0 && holidays.length === 0) return;
    const key = `today-modal-${todayStr}`;
    try {
      if (!sessionStorage.getItem(key)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    const key = `today-modal-${todayStr}`;
    try { sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
    setOpen(false);
  }

  if (!open) return null;

  const holidayColor = (types: string[]) => {
    if (types.includes("yizkor")) return { bg: "linear-gradient(135deg,#fff8e8,#fef3d0)", border: "#c9a84c40", text: "#8b6010", badge: "#c9a84c20", badgeText: "#8b6010" };
    if (types.includes("fast"))   return { bg: "linear-gradient(135deg,#f8f3ff,#f0e8ff)", border: "#a855f740", text: "#6b21a8", badge: "#a855f720", badgeText: "#6b21a8" };
    if (types.includes("holiday"))return { bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "#3b82f640", text: "#1d4ed8", badge: "#3b82f620", badgeText: "#1d4ed8" };
    return                               { bg: "linear-gradient(135deg,#f0fdfa,#ccfbf1)", border: "#14b8a640", text: "#0f766e", badge: "#14b8a620", badgeText: "#0f766e" };
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="אזכרות ומועדים היום"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.65)" }}
        onClick={close}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className="relative rounded-2xl w-full max-w-sm flex flex-col"
        style={{
          background: "var(--card)",
          border: "2px solid #c9a84c50",
          boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
          maxHeight: "85vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 rounded-t-2xl shrink-0"
          style={{ background: "linear-gradient(135deg,#c9a84c18,#8b601008)", borderBottom: "1px solid #c9a84c30" }}
        >
          <div className="flex items-center gap-2.5">
            <CandleIcon />
            <div>
              <p className="font-bold text-base leading-tight" style={{ color: "var(--foreground)" }}>
                אזכרות ומועדים
              </p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                היום ו/או הלילה הקרוב
              </p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="סגור"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-70"
            style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-4 space-y-2.5">
          {yahrzeits.map((y) => (
            <Link
              key={y.deceasedId}
              href={`/${locale}/deceased/${y.deceasedId}`}
              onClick={close}
              className="flex items-center gap-3 rounded-xl p-3 transition-all hover:opacity-85"
              style={{
                background: "linear-gradient(135deg,#fff8e8,#fef3d0)",
                border: "1px solid #c9a84c40",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm"
                style={{ background: "linear-gradient(135deg,#c9a84c,#8b6010)" }}
              >
                {y.fullName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "#8b6010" }}>
                  {y.fullName} ז״ל
                </p>
                <p className="text-xs" style={{ color: "#a07830" }}>{y.hebrewDate}</p>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: "#c9a84c20", color: "#8b6010" }}
              >
                {dayLabel(y.daysUntil)}
              </span>
            </Link>
          ))}

          {holidays.map((h, i) => {
            const c = holidayColor(h.types);
            return (
              <div
                key={i}
                className="rounded-xl p-3"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: c.text }}>
                      {h.name}
                    </p>
                    {h.description && (
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: c.text, opacity: 0.8 }}>
                        {h.description}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: c.badge, color: c.badgeText }}
                  >
                    {dayLabel(h.daysUntil)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2 shrink-0">
          <button
            onClick={close}
            className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg,#c9a84c,#8b6010)",
              color: "white",
              boxShadow: "0 4px 12px rgba(184,134,11,0.3)",
            }}
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
