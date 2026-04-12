"use client";

import { useState, useMemo } from "react";

export type HolidayType = "yizkor" | "fast" | "holiday" | "rosh-chodesh";

export interface HolidayItem {
  name: string;
  hebrewDate: string;
  gregorianDate: string;
  gregorianTimestamp: number;
  description: string;
  types: HolidayType[];
}

const TYPE_META: Record<HolidayType, { bg: string; border: string; text: string; badge: string; label: string }> = {
  yizkor:          { bg: "linear-gradient(135deg, #fff8e8, #fef3d0)", border: "#c9a84c50", text: "#8b6010", badge: "#c9a84c", label: "יזכור" },
  fast:            { bg: "linear-gradient(135deg, #f8f3ff, #f0e8ff)", border: "#a855f750", text: "#6b21a8", badge: "#a855f7", label: "צום" },
  holiday:         { bg: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "#3b82f650", text: "#1d4ed8", badge: "#3b82f6", label: "חג" },
  "rosh-chodesh":  { bg: "linear-gradient(135deg, #f0fdfa, #ccfbf1)", border: "#14b8a650", text: "#0f766e", badge: "#14b8a6", label: "ראש חודש" },
};

function primaryType(types: HolidayType[]): HolidayType {
  if (types.includes("yizkor")) return "yizkor";
  if (types.includes("fast")) return "fast";
  if (types.includes("holiday")) return "holiday";
  return "rosh-chodesh";
}

export function HolidaysClient({ items }: { items: HolidayItem[] }) {
  const [activeFilter, setActiveFilter] = useState<HolidayType | null>(null);
  const now = Date.now();

  const filtered = useMemo(
    () => (activeFilter ? items.filter((h) => h.types.includes(activeFilter)) : items),
    [items, activeFilter]
  );

  const filterTypes: HolidayType[] = ["yizkor", "fast", "holiday", "rosh-chodesh"];

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div
        className="p-3 rounded-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
          סינון לפי סוג
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={
              !activeFilter
                ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)", color: "white" }
                : { background: "var(--muted)", color: "var(--muted-foreground)" }
            }
          >
            הכל ({items.length})
          </button>
          {filterTypes.map((t) => {
            const count = items.filter((h) => h.types.includes(t)).length;
            if (count === 0) return null;
            const meta = TYPE_META[t];
            const isActive = activeFilter === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveFilter(isActive ? null : t)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={
                  isActive
                    ? { background: meta.badge, color: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }
                    : { background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
                }
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
        {activeFilter && (
          <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
            מציג {filtered.length} מתוך {items.length} אירועים
          </p>
        )}
      </div>

      {/* Holiday list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              אין אירועים עבור הסינון הנבחר
            </p>
          </div>
        )}
        {filtered.map((h, i) => {
          const primary = primaryType(h.types);
          const colors = TYPE_META[primary];
          const daysUntil = Math.ceil((h.gregorianTimestamp - now) / (1000 * 60 * 60 * 24));
          return (
            <div
              key={i}
              className="p-4 rounded-2xl"
              style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-sm" style={{ color: colors.text }}>
                      {h.name}
                    </h2>
                    {h.types.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                        style={{ background: TYPE_META[t].badge }}
                      >
                        {TYPE_META[t].label}
                      </span>
                    ))}
                  </div>
                  {h.description && (
                    <p className="text-xs mt-1" style={{ color: colors.text, opacity: 0.85 }}>
                      {h.description}
                    </p>
                  )}
                </div>
                <div className="text-left shrink-0">
                  <p className="text-xs font-bold" style={{ color: colors.text }}>
                    {h.gregorianDate}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: colors.text, opacity: 0.75 }}>
                    {h.hebrewDate}
                  </p>
                  {daysUntil >= 0 && daysUntil <= 30 && (
                    <p className="text-xs mt-1 font-semibold" style={{ color: colors.badge }}>
                      {daysUntil === 0 ? "היום" : daysUntil === 1 ? "מחר" : `בעוד ${daysUntil} ימים`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
