"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

function HolidaysCard({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}/prayers/holidays`}
      className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:opacity-90"
      style={{
        background: "linear-gradient(135deg, #fff8e8, #fef3d0)",
        border: "1px solid #c9a84c50",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: "#8b6010" }}>חגים ומועדים</p>
        <p className="text-xs mt-0.5" style={{ color: "#b8860b" }}>יזכור, צומות, חגים וראשי חודשים</p>
      </div>
      <svg className="w-4 h-4 rotate-180 shrink-0" style={{ color: "#c9a84c" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export interface YahrzeitItem {
  id: string;
  fullName: string;
  photoUrl: string | null;
  relationship: string | null;
  groupId: string;
  groupName: string | null;
  groupIds: string[];       // all groups this deceased belongs to
  groupNames: string[];     // names of all groups
  relationshipDegree: "first" | "second" | "extended" | null;
  daysUntil: number;
  gregorianDay: number;
  gregorianMonthShort: string;
  gregorianMonthLabel: string;
  gregorianFormatted: string;
  hebrewDate: string;
  shabbatEveFormatted: string | null;
  yearsElapsed: number | null;
  isToday: boolean;
  isSoon: boolean;
  dayOfWeekHe: string;
  isSaturday: boolean;
  sundayFormattedIfShabbat: string | null;
}

export interface GroupOption {
  id: string;
  name: string;
}

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0.875rem",
};

export function CalendarClient({
  items,
  groups,
  locale,
}: {
  items: YahrzeitItem[];
  groups: GroupOption[];
  locale: string;
}) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedDegree, setSelectedDegree] = useState<"first" | "second" | "extended" | null>(null);

  const DEGREE_LABELS: Record<"first" | "second" | "extended", string> = {
    first:    "קרבה ראשונה",
    second:   "קרבה שנייה",
    extended: "אחרת",
  };

  const groupFiltered = useMemo(
    () => (selectedGroupId ? items.filter((y) => y.groupIds.includes(selectedGroupId)) : items),
    [items, selectedGroupId]
  );

  // Which degree categories exist in the current group filter
  const existingDegrees = useMemo(() => {
    const s = new Set<"first" | "second" | "extended">();
    for (const y of groupFiltered) {
      if (y.relationshipDegree) s.add(y.relationshipDegree);
    }
    return s;
  }, [groupFiltered]);

  const filtered = useMemo(() => {
    if (!selectedDegree) return groupFiltered;
    return groupFiltered.filter((y) => y.relationshipDegree === selectedDegree);
  }, [groupFiltered, selectedDegree]);

  // Group by month
  const byMonth = useMemo(() => {
    const map: Record<string, YahrzeitItem[]> = {};
    for (const y of filtered) {
      if (!map[y.gregorianMonthLabel]) map[y.gregorianMonthLabel] = [];
      map[y.gregorianMonthLabel].push(y);
    }
    return map;
  }, [filtered]);

  if (items.length === 0) {
    return (
      <div className="text-center py-14">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--muted)" }}
        >
          <svg className="w-8 h-8" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="font-medium" style={{ color: "var(--foreground)" }}>אין נפטרים רשומים</p>
        <Link href={`/${locale}/groups`} className="mt-2 text-sm font-semibold hover:underline" style={{ color: "var(--primary)" }}>
          הוסף נפטרים
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Holidays shortcut */}
      <HolidaysCard locale={locale} />

      {/* Group filter — only if more than 1 group */}
      {groups.length > 1 && (
        <div
          className="p-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "1rem" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
            סינון לפי קבוצה
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => { setSelectedGroupId(null); setSelectedDegree(null); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={
                !selectedGroupId
                  ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)", color: "white" }
                  : { background: "var(--muted)", color: "var(--muted-foreground)" }
              }
            >
              כל הקבוצות ({items.length})
            </button>
            {groups.map((g) => {
              const count = items.filter((y) => y.groupIds.includes(g.id)).length;
              const isActive = selectedGroupId === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => { setSelectedGroupId(isActive ? null : g.id); setSelectedDegree(null); }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={
                    isActive
                      ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)", color: "white", boxShadow: "0 2px 6px rgba(184,134,11,0.25)" }
                      : { background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
                  }
                >
                  {g.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Relationship degree filter */}
      {existingDegrees.size > 0 && (
        <div
          className="p-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "1rem" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
            סינון לפי קרבה
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDegree(null)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={
                !selectedDegree
                  ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)", color: "white" }
                  : { background: "var(--muted)", color: "var(--muted-foreground)" }
              }
            >
              הכל ({groupFiltered.length})
            </button>
            {(["first", "second", "extended"] as const).map((deg) => {
              if (!existingDegrees.has(deg)) return null;
              const count = groupFiltered.filter((y) => y.relationshipDegree === deg).length;
              const isActive = selectedDegree === deg;
              return (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setSelectedDegree(isActive ? null : deg)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={
                    isActive
                      ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)", color: "white", boxShadow: "0 2px 6px rgba(184,134,11,0.25)" }
                      : { background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
                  }
                >
                  {DEGREE_LABELS[deg]} ({count})
                </button>
              );
            })}
          </div>
          {selectedDegree && (
            <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
              מציג {filtered.length} מתוך {groupFiltered.length} אזכרות
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>אין אזכרות עבור הסינון הנבחר</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byMonth).map(([month, yahrzeits]) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold tracking-wide shrink-0" style={{ color: "var(--primary)" }}>
                  {month}
                </h2>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, #c9a84c40)" }} />
              </div>

              <div className="space-y-2">
                {yahrzeits.map((y) => (
                  <Link
                    key={y.id}
                    href={`/${locale}/deceased/${y.id}`}
                    className="flex items-center gap-3 p-3 transition-all hover:opacity-90"
                    style={
                      y.isToday
                        ? {
                            background: "linear-gradient(135deg, #fff8e8, #fef3d0)",
                            border: "1px solid #c9a84c60",
                            borderRadius: "0.875rem",
                            boxShadow: "0 3px 12px rgba(184,134,11,0.15)",
                          }
                        : {
                            ...cardStyle,
                            ...(y.isSoon ? { borderColor: "#c9a84c40" } : {}),
                          }
                    }
                  >
                    {/* Date bubble */}
                    <div
                      className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0"
                      style={
                        y.isToday
                          ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)" }
                          : { background: "var(--muted)" }
                      }
                    >
                      <span
                        className="text-xs font-semibold leading-none mb-0.5"
                        style={{ color: y.isToday ? "white" : "var(--muted-foreground)" }}
                      >
                        {y.gregorianMonthShort}
                      </span>
                      <span
                        className="text-base font-bold leading-none"
                        style={{ color: y.isToday ? "white" : "var(--foreground)" }}
                      >
                        {y.gregorianDay}
                      </span>
                    </div>

                    {/* Photo */}
                    <div
                      className="w-10 h-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm text-white"
                      style={
                        y.photoUrl
                          ? { border: "2px solid #c9a84c" }
                          : { background: "linear-gradient(135deg, #c9a84c, #8b6010)" }
                      }
                    >
                      {y.photoUrl ? (
                        <img src={y.photoUrl} alt={y.fullName} className="w-full h-full object-cover" />
                      ) : (
                        y.fullName[0]
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>
                        {y.fullName} ז״ל
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                        {y.hebrewDate}
                        {y.relationship && ` • ${y.relationship}`}
                      </p>
                      {y.groupNames.length > 0 && (
                        <p className="text-xs truncate" style={{ color: "var(--muted-foreground)", opacity: 0.75 }}>
                          {y.groupNames.join(" • ")}
                        </p>
                      )}
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {y.dayOfWeekHe} • {y.gregorianFormatted}
                        {y.yearsElapsed !== null && (
                          <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                            {" "}• שנה {y.yearsElapsed}
                          </span>
                        )}
                      </p>
                      {y.isSaturday && y.sundayFormattedIfShabbat && (
                        <p className="text-xs font-semibold" style={{ color: "#b45309" }}>
                          ⚠ חל בשבת — נדחה ליום ראשון {y.sundayFormattedIfShabbat}
                        </p>
                      )}
                      {y.shabbatEveFormatted && !y.isSaturday && (
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          ערב שב׳: <span style={{ color: "var(--foreground)" }}>{y.shabbatEveFormatted}</span>
                        </p>
                      )}
                    </div>

                    {/* Days counter */}
                    <div className="text-end shrink-0">
                      {y.isToday ? (
                        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "#c9a84c", color: "white" }}>
                          היום
                        </span>
                      ) : y.daysUntil === 1 ? (
                        <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>מחר</span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          עוד {y.daysUntil}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
