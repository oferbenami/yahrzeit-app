"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateDeceased } from "@/lib/deceased/actions";
import {
  gregorianToHebrew,
  hebrewToGregorian,
  getHebrewDaysInMonth,
  getCurrentHebrewYear,
  HEBREW_MONTHS,
  yearToHebrewLetters,
} from "@/lib/hebrew-calendar";
import { DeceasedPhotoUpload } from "./DeceasedPhotoUpload";
import { CemeteryLocationPicker } from "./CemeteryLocationPicker";
import { DeleteDeceasedButton } from "./DeleteDeceasedButton";

interface DeceasedData {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  death_date_gregorian?: string | null;
  death_date_hebrew_day?: number | null;
  death_date_hebrew_month?: number | null;
  birth_date_gregorian?: string | null;
  cemetery_name?: string | null;
  cemetery_block?: string | null;
  cemetery_plot?: string | null;
  cemetery_notes?: string | null;
  cemetery_lat?: number | null;
  cemetery_lng?: number | null;
  photo_url?: string | null;
  notes?: string | null;
  group_id?: string | null;
}

interface Props {
  deceased: DeceasedData;
  locale: string;
  id: string;
  groups: { id: string; name: string }[];
}

const inputClass =
  "w-full px-3 py-2.5 border rounded-xl focus:outline-none text-sm transition-colors";
const iStyle = {
  borderColor: "var(--border)",
  background: "var(--muted)",
  color: "var(--foreground)",
} as const;

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  boxShadow: "0 2px 10px rgba(184,134,11,0.07)",
};

function initHebrewFromGregorian(gregorianStr: string | null | undefined) {
  if (!gregorianStr) {
    return { day: "", month: "7", year: String(getCurrentHebrewYear()) };
  }
  try {
    const h = gregorianToHebrew(new Date(gregorianStr + "T12:00:00"));
    return { day: String(h.day), month: String(h.month), year: String(h.year) };
  } catch {
    return { day: "", month: "7", year: String(getCurrentHebrewYear()) };
  }
}

export function EditDeceasedForm({ deceased, locale, id, groups }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Name fields — prefer stored split names, fall back to parsing full_name
  const parts = deceased.full_name.split(" ");
  const [firstName, setFirstName] = useState(deceased.first_name ?? parts[0] ?? "");
  const [lastName, setLastName] = useState(deceased.last_name ?? parts.slice(1).join(" ") ?? "");

  // Death date mode
  const [dateMode, setDateMode] = useState<"gregorian" | "hebrew">("gregorian");
  const [gregorianDate, setGregorianDate] = useState(deceased.death_date_gregorian || "");
  const [afterSunset, setAfterSunset] = useState(false);

  const initHe = initHebrewFromGregorian(deceased.death_date_gregorian);
  const [hebrewDay, setHebrewDay] = useState(
    deceased.death_date_hebrew_day ? String(deceased.death_date_hebrew_day) : initHe.day
  );
  const [hebrewMonth, setHebrewMonth] = useState(
    deceased.death_date_hebrew_month ? String(deceased.death_date_hebrew_month) : initHe.month
  );
  const [hebrewYear, setHebrewYear] = useState(initHe.year);

  const [gregorianToHebrewPreview, setGregorianToHebrewPreview] = useState("");
  const [hebrewToGregorianPreview, setHebrewToGregorianPreview] = useState("");

  useEffect(() => {
    if (dateMode !== "gregorian" || !gregorianDate) { setGregorianToHebrewPreview(""); return; }
    try {
      const d = new Date(gregorianDate + "T12:00:00");
      if (afterSunset) d.setDate(d.getDate() + 1);
      setGregorianToHebrewPreview(gregorianToHebrew(d).hebrewString);
    } catch { setGregorianToHebrewPreview(""); }
  }, [gregorianDate, afterSunset, dateMode]);

  useEffect(() => {
    if (dateMode !== "hebrew" || !hebrewDay || !hebrewMonth || !hebrewYear) {
      setHebrewToGregorianPreview(""); return;
    }
    try {
      const g = hebrewToGregorian(parseInt(hebrewDay), parseInt(hebrewMonth), parseInt(hebrewYear));
      if (g) {
        const dd = String(g.getDate()).padStart(2, "0");
        const mm = String(g.getMonth() + 1).padStart(2, "0");
        setHebrewToGregorianPreview(`${dd}/${mm}/${g.getFullYear()}`);
      } else {
        setHebrewToGregorianPreview("תאריך לא תקין");
      }
    } catch { setHebrewToGregorianPreview(""); }
  }, [hebrewDay, hebrewMonth, hebrewYear, dateMode]);

  const hebrewDaysInMonth =
    hebrewMonth && hebrewYear
      ? getHebrewDaysInMonth(parseInt(hebrewMonth), parseInt(hebrewYear))
      : 30;

  const currentHebrewYear = getCurrentHebrewYear();
  const hebrewYearOptions = Array.from({ length: 130 }, (_, i) => currentHebrewYear - i);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("first_name", firstName.trim());
    formData.set("last_name", lastName.trim());
    startTransition(async () => {
      const result = await updateDeceased(id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => router.push(`/${locale}/deceased/${id}`), 1000);
      }
    });
  }

  return (
    <>
      {/* Success toast */}
      {saved && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg"
          style={{
            background: "linear-gradient(135deg, #86efac, #4ade80)",
            color: "#14532d",
            whiteSpace: "nowrap",
          }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          נתונים נשמרו
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Photo */}
        <div className="p-4" style={cardStyle}>
          <DeceasedPhotoUpload
            deceasedId={id}
            currentPhotoUrl={deceased.photo_url}
            deceasedName={deceased.full_name}
          />
        </div>

        {/* Basic info */}
        <div className="p-4 space-y-3" style={cardStyle}>
          <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>פרטים בסיסיים</h2>

          {/* First + Last name */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
                שם פרטי *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                style={iStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
                שם משפחה
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                style={iStyle}
              />
            </div>
          </div>

          {/* Father + Mother name */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
                שם האב
              </label>
              <input
                name="father_name"
                type="text"
                defaultValue={deceased.father_name || ""}
                className={inputClass}
                style={iStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
                שם האם
              </label>
              <input
                name="mother_name"
                type="text"
                defaultValue={deceased.mother_name || ""}
                className={inputClass}
                style={iStyle}
              />
            </div>
          </div>

        </div>

        {/* Dates */}
        <div className="p-4 space-y-3" style={cardStyle}>
          <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>תאריכים</h2>

          {/* Death date */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                תאריך פטירה *
              </label>
              <div
                className="flex rounded-xl overflow-hidden text-xs font-bold"
                style={{ border: "1px solid var(--border)" }}
              >
                <button
                  type="button"
                  onClick={() => setDateMode("gregorian")}
                  className="px-3 py-1.5 transition-all"
                  style={
                    dateMode === "gregorian"
                      ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)", color: "white" }
                      : { background: "var(--muted)", color: "var(--muted-foreground)" }
                  }
                >לועזי</button>
                <button
                  type="button"
                  onClick={() => setDateMode("hebrew")}
                  className="px-3 py-1.5 transition-all"
                  style={
                    dateMode === "hebrew"
                      ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)", color: "white" }
                      : { background: "var(--muted)", color: "var(--muted-foreground)" }
                  }
                >עברי</button>
              </div>
            </div>

            <input type="hidden" name="date_mode" value={dateMode} />

            {dateMode === "gregorian" ? (
              <div className="space-y-1.5">
                <input
                  name="death_date_gregorian"
                  type="date"
                  required
                  value={gregorianDate}
                  onChange={(e) => setGregorianDate(e.target.value)}
                  className={inputClass + " text-center"}
                  style={{ ...iStyle, direction: "ltr" }}
                />
                {gregorianToHebrewPreview && (
                  <p className="text-xs text-center font-medium" style={{ color: "#c9a84c" }}>
                    {gregorianToHebrewPreview}
                  </p>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={afterSunset}
                    onChange={(e) => setAfterSunset(e.target.checked)}
                    className="rounded"
                  />
                  <input type="hidden" name="death_after_sunset" value={afterSunset ? "true" : "false"} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    נפטר/ה אחרי שקיעה
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>יום</label>
                    <select
                      name="death_hebrew_day"
                      value={hebrewDay}
                      onChange={(e) => setHebrewDay(e.target.value)}
                      className={inputClass + " text-center px-1"}
                      style={iStyle}
                      required
                    >
                      <option value="">--</option>
                      {Array.from({ length: hebrewDaysInMonth }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>חודש</label>
                    <select
                      name="death_hebrew_month"
                      value={hebrewMonth}
                      onChange={(e) => setHebrewMonth(e.target.value)}
                      className={inputClass + " px-1"}
                      style={iStyle}
                      required
                    >
                      {HEBREW_MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>שנה</label>
                    <select
                      name="death_hebrew_year"
                      value={hebrewYear}
                      onChange={(e) => setHebrewYear(e.target.value)}
                      className={inputClass + " text-center px-1"}
                      style={iStyle}
                      required
                    >
                      {hebrewYearOptions.map((y) => (
                        <option key={y} value={y}>{yearToHebrewLetters(y)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {hebrewToGregorianPreview && (
                  <p
                    className="text-xs text-center font-medium"
                    dir="ltr"
                    style={{
                      color: hebrewToGregorianPreview === "תאריך לא תקין" ? "#dc2626" : "#c9a84c",
                    }}
                  >
                    {hebrewToGregorianPreview}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Birth date */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
              תאריך לידה
            </label>
            <input
              name="birth_date_gregorian"
              type="date"
              defaultValue={deceased.birth_date_gregorian || ""}
              className={inputClass + " text-center"}
              style={{ ...iStyle, direction: "ltr" }}
            />
          </div>
        </div>

        {/* Cemetery */}
        <div className="p-4 space-y-3" style={cardStyle}>
          <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>בית קברות</h2>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
              שם בית קברות
            </label>
            <input
              name="cemetery_name"
              type="text"
              defaultValue={deceased.cemetery_name || ""}
              className={inputClass}
              style={iStyle}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>חלקה</label>
              <input name="cemetery_block" type="text" defaultValue={deceased.cemetery_block || ""}
                className={inputClass + " text-center px-1"} style={iStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>שורה</label>
              <input name="cemetery_plot" type="text" defaultValue={deceased.cemetery_plot || ""}
                className={inputClass + " text-center px-1"} style={iStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>קבר</label>
              <input name="cemetery_notes" type="text" defaultValue={deceased.cemetery_notes || ""}
                className={inputClass + " text-center px-1"} style={iStyle} />
            </div>
          </div>

          <CemeteryLocationPicker
            initialLat={deceased.cemetery_lat}
            initialLng={deceased.cemetery_lng}
          />
        </div>

        {/* Group assignment */}
        {groups.length > 0 && (
          <div className="p-4" style={cardStyle}>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              שיוך לקבוצה
            </label>
            <select
              name="group_id"
              defaultValue={deceased.group_id || ""}
              className={inputClass}
              style={iStyle}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div className="p-4" style={cardStyle}>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
            הערות
          </label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={deceased.notes || ""}
            className={inputClass + " resize-none"}
            style={iStyle}
          />
        </div>

        {error && (
          <p className="text-sm text-center" style={{ color: "#dc2626" }}>{error}</p>
        )}

        {/* Action buttons — equal width, no overflow */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="submit"
            disabled={isPending || saved}
            className="py-3 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #c9a84c 0%, #8b6010 100%)",
              boxShadow: "0 3px 10px rgba(184,134,11,0.3)",
            }}
          >
            {isPending ? "שומר..." : "שמור"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/deceased/${id}`)}
            className="py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              background: "var(--muted)",
            }}
          >
            ביטול
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div
        className="mt-4 p-4 rounded-2xl"
        style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <h3 className="font-bold text-sm mb-1" style={{ color: "#dc2626" }}>מחיקה</h3>
        <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>פעולה זו אינה הפיכה</p>
        <DeleteDeceasedButton
          deceasedId={id}
          groupId={deceased.group_id ?? ""}
          locale={locale}
        />
      </div>
    </>
  );
}
