"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  gregorianToHebrew,
  hebrewToGregorian,
  getHebrewDaysInMonth,
  getCurrentHebrewYear,
  HEBREW_MONTHS,
} from "@/lib/hebrew-calendar";
import { createDeceased, searchDeceased, upsertUserDeceasedRelationship } from "@/lib/deceased/actions";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const RELATIONSHIPS = [
  "אב", "אם", "סבא", "סבתא", "סב רבא", "סבתא רבא",
  "בעל", "אישה", "אח", "אחות", "בן", "בת",
  "דוד", "דודה", "בן דוד", "בת דוד",
  "אחיין", "אחיינית", "נכד", "נכדה", "אחר",
];

const DEGREE_MAP: Record<string, string> = {
  "אב": "first", "אם": "first", "בן": "first", "בת": "first",
  "בעל": "first", "אישה": "first", "אח": "first", "אחות": "first",
  "סבא": "second", "סבתא": "second", "נכד": "second", "נכדה": "second",
  "דוד": "second", "דודה": "second", "בן דוד": "second", "בת דוד": "second",
  "אחיין": "second", "אחיינית": "second",
  "סב רבא": "extended", "סבתא רבא": "extended",
};

const DEGREE_LABELS: Record<string, string> = {
  first: "ראשונה", second: "שנייה", extended: "מורחבת",
};

const inputClass = "w-full px-3 py-2.5 border border-[color:var(--border)] rounded-xl bg-white/70 text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] text-sm transition-shadow";
const labelClass = "block text-xs font-semibold mb-1 text-[color:var(--muted-foreground)]";

interface Group { id: string; name: string; }

interface Props {
  locale: string;
  groups: Group[];
  initialGroupId?: string;
}

export function NewDeceasedForm({ locale, groups, initialGroupId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group
  const [groupId] = useState(initialGroupId || groups[0]?.id || "");

  // Basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Relationship
  const [relLabel, setRelLabel] = useState("");
  const [relDegree, setRelDegree] = useState("");
  useEffect(() => {
    const auto = DEGREE_MAP[relLabel];
    if (auto) setRelDegree(auto);
  }, [relLabel]);

  // Date mode
  const [dateMode, setDateMode] = useState<"gregorian" | "hebrew">("gregorian");
  const [gregorianDate, setGregorianDate] = useState("");
  const [afterSunset, setAfterSunset] = useState(false);
  const [hebrewDay, setHebrewDay] = useState("");
  const [hebrewMonth, setHebrewMonth] = useState("7");
  const [hebrewYear, setHebrewYear] = useState(getCurrentHebrewYear().toString());
  const [convertedDisplay, setConvertedDisplay] = useState("");
  const [convertedGregorian, setConvertedGregorian] = useState("");

  // Gregorian → Hebrew conversion display
  useEffect(() => {
    if (dateMode !== "gregorian" || !gregorianDate) { setConvertedDisplay(""); return; }
    try {
      const d = new Date(gregorianDate + "T12:00:00");
      if (afterSunset) d.setDate(d.getDate() + 1);
      const h = gregorianToHebrew(d);
      setConvertedDisplay(h.hebrewString);
    } catch { setConvertedDisplay(""); }
  }, [gregorianDate, afterSunset, dateMode]);

  // Hebrew → Gregorian conversion display
  useEffect(() => {
    if (dateMode !== "hebrew" || !hebrewDay || !hebrewMonth || !hebrewYear) {
      setConvertedGregorian(""); return;
    }
    try {
      const g = hebrewToGregorian(parseInt(hebrewDay), parseInt(hebrewMonth), parseInt(hebrewYear));
      if (g) {
        setConvertedGregorian(g.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" }));
      } else {
        setConvertedGregorian("תאריך לא תקין");
      }
    } catch { setConvertedGregorian(""); }
  }, [hebrewDay, hebrewMonth, hebrewYear, dateMode]);

  // Days in selected Hebrew month
  const hebrewDaysInMonth = hebrewMonth && hebrewYear
    ? getHebrewDaysInMonth(parseInt(hebrewMonth), parseInt(hebrewYear))
    : 30;

  // Photo preview
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  }

  // Search existing deceased
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; full_name: string; death_date_hebrew: string; relationship_label?: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkRel, setLinkRel] = useState("");
  const [linkDegree, setLinkDegree] = useState("");
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      const { data } = await searchDeceased(searchQuery);
      setSearchResults(data as typeof searchResults);
      setSearchLoading(false);
    }, 400);
  }, [searchQuery]);

  useEffect(() => {
    const auto = DEGREE_MAP[linkRel];
    if (auto) setLinkDegree(auto);
  }, [linkRel]);

  async function handleLinkDeceased(deceasedId: string) {
    if (!linkRel) return;
    const result = await upsertUserDeceasedRelationship(deceasedId, linkRel, linkDegree);
    if (result?.error) setError(result.error);
    else {
      setLinkSuccess("הקשר נשמר בהצלחה");
      setLinkingId(null);
      setLinkRel("");
      setLinkDegree("");
      setTimeout(() => setLinkSuccess(null), 3000);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!firstName.trim()) { setError("שם פרטי הוא שדה חובה"); return; }
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    fd.set("date_mode", dateMode);
    fd.set("death_after_sunset", afterSunset.toString());
    fd.set("relationship_degree", relDegree);
    if (dateMode === "hebrew") {
      fd.set("death_hebrew_day", hebrewDay);
      fd.set("death_hebrew_month", hebrewMonth);
      fd.set("death_hebrew_year", hebrewYear);
    }

    const result = await createDeceased(fd);
    if (result?.error) { setError(result.error); setLoading(false); }
    else if (result?.id) { router.push(`/${locale}/deceased/${result.id}`); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="first_name" value={firstName} />
      <input type="hidden" name="last_name" value={lastName} />

      {error && <ErrorMessage message={error} />}

      {/* Search existing */}
      <div className="memorial-card p-5">
        <h2 className="font-bold text-sm text-[color:var(--foreground)] mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          חיפוש נפטר קיים במערכת
        </h2>
        <input
          type="text"
          placeholder="חפש לפי שם..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={inputClass}
        />
        {searchLoading && <p className="text-xs text-muted-foreground mt-2">מחפש...</p>}
        {linkSuccess && <p className="text-xs text-green-600 mt-2">{linkSuccess}</p>}
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-2">
            {searchResults.map(d => (
              <div key={d.id} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{d.full_name}</p>
                    <p className="text-xs text-muted-foreground">{d.death_date_hebrew}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLinkingId(linkingId === d.id ? null : d.id)}
                    className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors whitespace-nowrap"
                  >
                    הוסף קשר
                  </button>
                </div>
                {linkingId === d.id && (
                  <div className="mt-3 flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">הקשר שלי אליו/אליה</label>
                      <select
                        value={linkRel}
                        onChange={e => setLinkRel(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">-- בחר --</option>
                        {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    {linkDegree && (
                      <p className="text-xs text-muted-foreground mb-3">({DEGREE_LABELS[linkDegree]})</p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleLinkDeceased(d.id)}
                      disabled={!linkRel}
                      className="mb-0 px-3 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
                    >
                      שמור
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">אם הנפטר כבר קיים — הוסף רק קשר אישי. אחרת מלא את הפרטים למטה.</p>
      </div>

      {/* Group selector */}
      {!initialGroupId && groups.length > 1 && (
        <div>
          <label className={labelClass}>קבוצה</label>
          <select name="group_id" className={inputClass}>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      )}

      {/* Basic info */}
      <div className="memorial-card p-5 space-y-4">
        <h2 className="font-bold text-sm text-[color:var(--foreground)]">פרטים בסיסיים</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>שם פרטי <span className="text-destructive">*</span></label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>שם משפחה</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>שם האב</label>
            <input name="father_name" type="text" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>שם האם</label>
            <input name="mother_name" type="text" className={inputClass} />
          </div>
        </div>

        {/* Photo */}
        <div>
          <label className={labelClass}>תמונת הנפטר</label>
          <div className="flex items-center gap-3">
            {photoPreview && (
              <img src={photoPreview} alt="תצוגה מקדימה" className="w-16 h-16 rounded-full object-cover border border-border" />
            )}
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-input rounded-lg hover:bg-secondary transition-colors text-sm text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {photoPreview ? "החלף תמונה" : "בחר תמונה או צלם"}
              </div>
              <input
                ref={photoRef}
                name="photo"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Death date */}
      <div className="memorial-card p-5 space-y-4">
        <h2 className="font-bold text-sm text-[color:var(--foreground)]">תאריך פטירה <span className="text-destructive">*</span></h2>

        {/* Mode tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setDateMode("gregorian")}
            className={`flex-1 py-2 text-sm font-semibold transition-all ${dateMode === "gregorian" ? "text-white" : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]"}`}
            style={dateMode === "gregorian" ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)" } : {}}
          >
            תאריך לועזי
          </button>
          <button
            type="button"
            onClick={() => setDateMode("hebrew")}
            className={`flex-1 py-2 text-sm font-semibold transition-all ${dateMode === "hebrew" ? "text-white" : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]"}`}
            style={dateMode === "hebrew" ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)" } : {}}
          >
            תאריך עברי
          </button>
        </div>

        {dateMode === "gregorian" ? (
          <div className="space-y-3">
            <input
              name="death_date_gregorian"
              type="date"
              required
              value={gregorianDate}
              onChange={e => setGregorianDate(e.target.value)}
              className={inputClass}
              dir="ltr"
            />
            {convertedDisplay && (
              <div className="flex items-center gap-2 text-sm bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <span className="text-muted-foreground">תאריך עברי:</span>
                <span className="font-bold text-sm text-[color:var(--foreground)] text-primary">{convertedDisplay}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">יום</label>
                <select
                  value={hebrewDay}
                  onChange={e => setHebrewDay(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">--</option>
                  {Array.from({ length: hebrewDaysInMonth }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">חודש</label>
                <select
                  value={hebrewMonth}
                  onChange={e => setHebrewMonth(e.target.value)}
                  className={inputClass}
                >
                  {HEBREW_MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">שנה</label>
                <input
                  type="number"
                  value={hebrewYear}
                  onChange={e => setHebrewYear(e.target.value)}
                  className={inputClass}
                  min={5700}
                  max={6000}
                  dir="ltr"
                />
              </div>
            </div>
            {convertedGregorian && (
              <div className="flex items-center gap-2 text-sm bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <span className="text-muted-foreground">תאריך לועזי:</span>
                <span className="font-bold text-sm text-[color:var(--foreground)] text-primary">{convertedGregorian}</span>
              </div>
            )}
          </div>
        )}

        {/* Sunset toggle — relevant for Gregorian mode */}
        {dateMode === "gregorian" && (
          <div className="border border-border rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">שעת הפטירה ביחס לשקיעה</p>
            <p className="text-xs text-muted-foreground">משפיע על חישוב התאריך העברי הנכון</p>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sunset_time"
                  checked={!afterSunset}
                  onChange={() => setAfterSunset(false)}
                  className="text-primary"
                />
                <span className="text-sm">לפני שקיעה / בוקר</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sunset_time"
                  checked={afterSunset}
                  onChange={() => setAfterSunset(true)}
                  className="text-primary"
                />
                <span className="text-sm">אחרי שקיעה</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Relationship */}
      <div className="memorial-card p-5 space-y-4">
        <h2 className="font-bold text-sm text-[color:var(--foreground)]">קשר משפחתי</h2>

        <div>
          <label className={labelClass}>קשר אליי</label>
          <select
            name="relationship_label"
            value={relLabel}
            onChange={e => setRelLabel(e.target.value)}
            className={inputClass}
          >
            <option value="">-- בחר --</option>
            {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {relDegree && (
          <div className="flex items-center gap-2 text-sm bg-secondary rounded-lg px-3 py-2">
            <span className="text-muted-foreground">דרגת קרבה שחושבה אוטומטית:</span>
            <span className="font-bold text-sm text-[color:var(--foreground)]">{DEGREE_LABELS[relDegree]}</span>
          </div>
        )}

        <div>
          <label className={labelClass}>דרגת קרבה (לשינוי ידני)</label>
          <select
            value={relDegree}
            onChange={e => setRelDegree(e.target.value)}
            className={inputClass}
          >
            <option value="">-- בחר --</option>
            <option value="first">ראשונה (אב/אם/אח/בן...)</option>
            <option value="second">שנייה (סבא/דוד/נכד...)</option>
            <option value="extended">מורחבת</option>
          </select>
        </div>
      </div>

      {/* Birth date */}
      <div className="memorial-card p-5 space-y-3">
        <h2 className="font-bold text-sm text-[color:var(--foreground)]">תאריך לידה (רשות)</h2>
        <input
          name="birth_date_gregorian"
          type="date"
          className={inputClass}
          dir="ltr"
        />
      </div>

      {/* Cemetery */}
      <div className="memorial-card p-5 space-y-3">
        <h2 className="font-bold text-sm text-[color:var(--foreground)]">פרטי בית קברות</h2>
        <input name="cemetery_name" type="text" placeholder="שם בית קברות" className={inputClass} />
        <div className="grid grid-cols-2 gap-3">
          <input name="cemetery_block" type="text" placeholder="חלקה" className={inputClass} />
          <input name="cemetery_plot" type="text" placeholder="קבר" className={inputClass} />
        </div>
        <input name="cemetery_notes" type="text" placeholder="הערות מיקום" className={inputClass} />
      </div>

      {/* Gravestone photo */}
      <div className="memorial-card p-5">
        <h2 className="font-bold text-sm text-[color:var(--foreground)] mb-3">תמונת מצבה</h2>
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-input rounded-lg hover:bg-secondary transition-colors text-sm text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            בחר תמונת מצבה או צלם
          </div>
          <input name="gravestone_photo" type="file" accept="image/*" capture="environment" className="hidden" />
        </label>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>הערות</label>
        <textarea
          name="notes"
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="הערות נוספות..."
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pb-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)", boxShadow: "0 4px 14px rgba(184,134,11,0.35)" }}
        >
          {loading ? <LoadingSpinner size="sm" label="שומר..." /> : "שמור נפטר"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-3 border border-border rounded-xl font-medium text-foreground hover:bg-secondary transition-colors"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
