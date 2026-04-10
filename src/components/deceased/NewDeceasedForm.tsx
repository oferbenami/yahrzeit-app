"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  gregorianToHebrew,
  hebrewToGregorian,
  getHebrewDaysInMonth,
  getCurrentHebrewYear,
  HEBREW_MONTHS,
  numberToHebrewLetters,
  yearToHebrewLetters,
} from "@/lib/hebrew-calendar";
import { createDeceased, searchDeceased, upsertUserDeceasedRelationship } from "@/lib/deceased/actions";
import { analyzeGravestone } from "@/lib/deceased/analyze-gravestone";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PhotoPicker } from "@/components/ui/PhotoPicker";

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
  const [hebrewBeforeMidnight, setHebrewBeforeMidnight] = useState(false);
  const [hebrewDay, setHebrewDay] = useState("");
  const [hebrewMonth, setHebrewMonth] = useState("7");
  const [hebrewYear, setHebrewYear] = useState(getCurrentHebrewYear().toString());
  const [convertedDisplay, setConvertedDisplay] = useState("");
  const [convertedGregorian, setConvertedGregorian] = useState("");

  useEffect(() => {
    if (dateMode !== "gregorian" || !gregorianDate) { setConvertedDisplay(""); return; }
    try {
      const d = new Date(gregorianDate + "T12:00:00");
      if (afterSunset) d.setDate(d.getDate() + 1);
      const h = gregorianToHebrew(d);
      setConvertedDisplay(h.hebrewString);
    } catch { setConvertedDisplay(""); }
  }, [gregorianDate, afterSunset, dateMode]);

  useEffect(() => {
    if (dateMode !== "hebrew" || !hebrewDay || !hebrewMonth || !hebrewYear) {
      setConvertedGregorian(""); return;
    }
    try {
      const g = hebrewToGregorian(parseInt(hebrewDay), parseInt(hebrewMonth), parseInt(hebrewYear));
      if (g) {
        if (hebrewBeforeMidnight) g.setDate(g.getDate() - 1);
        const [y, m, d] = g.toISOString().split("T")[0].split("-");
        setConvertedGregorian(`${d}/${m}/${y}`);
      } else {
        setConvertedGregorian("תאריך לא תקין");
      }
    } catch { setConvertedGregorian(""); }
  }, [hebrewDay, hebrewMonth, hebrewYear, dateMode, hebrewBeforeMidnight]);

  const hebrewDaysInMonth = hebrewMonth && hebrewYear
    ? getHebrewDaysInMonth(parseInt(hebrewMonth), parseInt(hebrewYear))
    : 30;

  // Photos
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [gravestoneFile, setGravestoneFile] = useState<File | null>(null);
  const [gravestonePreview, setGravestonePreview] = useState<string | null>(null);

  // Gravestone analysis
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeSuccess, setAnalyzeSuccess] = useState(false);

  async function handleAnalyzeGravestone(file: File) {
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    setAnalyzeSuccess(false);

    const fd = new FormData();
    fd.append("image", file);
    const result = await analyzeGravestone(fd);

    if (result.error) {
      setAnalyzeError(result.error);
      setAnalyzeLoading(false);
      return;
    }

    const d = result.data!;

    // Auto-fill fields with extracted data
    if (d.firstName) setFirstName(d.firstName);
    if (d.lastName) setLastName(d.lastName);
    if (d.fatherName) {
      // Set via DOM since it's a plain name input
      const el = document.querySelector<HTMLInputElement>('input[name="father_name"]');
      if (el) { el.value = d.fatherName; el.dispatchEvent(new Event("input", { bubbles: true })); }
    }
    if (d.hebrewDay && d.hebrewMonth && d.hebrewYear) {
      setDateMode("hebrew");
      setHebrewDay(String(d.hebrewDay));
      setHebrewMonth(String(d.hebrewMonth));
      setHebrewYear(String(d.hebrewYear));
    } else if (d.deathDateGregorian) {
      setDateMode("gregorian");
      setGregorianDate(d.deathDateGregorian);
    }
    if (d.birthDateGregorian) {
      const el = document.querySelector<HTMLInputElement>('input[name="birth_date_gregorian"]');
      if (el) { el.value = d.birthDateGregorian; el.dispatchEvent(new Event("input", { bubbles: true })); }
    }
    if (d.cemeteryName) {
      const el = document.querySelector<HTMLInputElement>('input[name="cemetery_name"]');
      if (el) { el.value = d.cemeteryName; el.dispatchEvent(new Event("input", { bubbles: true })); }
    }

    setAnalyzeSuccess(true);
    setAnalyzeLoading(false);
    setTimeout(() => setAnalyzeSuccess(false), 4000);
  }

  // GPS
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");
  const [gpsError, setGpsError] = useState<string | null>(null);

  function handleGetGps() {
    if (!navigator.geolocation) { setGpsError("GPS אינו נתמך בדפדפן זה"); return; }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(pos.coords.latitude.toFixed(7));
        setGpsLng(pos.coords.longitude.toFixed(7));
        setGpsLoading(false);
      },
      () => { setGpsError("לא ניתן לקבל מיקום GPS"); setGpsLoading(false); }
    );
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
      setLinkRel(""); setLinkDegree("");
      setTimeout(() => setLinkSuccess(null), 3000);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!firstName.trim()) { setError("שם פרטי הוא שדה חובה"); return; }
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    fd.set("first_name", firstName);
    fd.set("last_name", lastName);
    fd.set("date_mode", dateMode);
    fd.set("death_after_sunset", afterSunset.toString());
    fd.set("relationship_degree", relDegree);
    if (dateMode === "hebrew") {
      fd.set("death_hebrew_day", hebrewDay);
      fd.set("death_hebrew_month", hebrewMonth);
      fd.set("death_hebrew_year", hebrewYear);
    }
    if (photoFile) fd.set("photo", photoFile);
    if (gravestoneFile) fd.set("gravestone_photo", gravestoneFile);
    if (dateMode === "hebrew") fd.set("death_before_midnight_hebrew", hebrewBeforeMidnight.toString());

    const result = await createDeceased(fd);
    if (result?.error) { setError(result.error); setLoading(false); }
    else if (result?.id) { router.refresh(); router.push(`/${locale}/deceased/${result.id}`); }
  }

  const sectionStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "1rem", boxShadow: "0 2px 10px rgba(184,134,11,0.07)" };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="cemetery_lat" value={gpsLat} />
      <input type="hidden" name="cemetery_lng" value={gpsLng} />

      {error && <ErrorMessage message={error} />}

      {/* Search existing deceased */}
      <div className="p-4" style={sectionStyle}>
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <svg className="w-4 h-4" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          חיפוש נפטר קיים במערכת
        </h2>
        <input
          type="text" placeholder="חפש לפי שם..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className={inputClass}
        />
        {searchLoading && <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>מחפש...</p>}
        {linkSuccess && <p className="text-xs mt-1 font-semibold" style={{ color: "#6b9e6b" }}>{linkSuccess}</p>}
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-2">
            {searchResults.map(d => (
              <div key={d.id} className="rounded-xl p-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{d.full_name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{d.death_date_hebrew}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLinkingId(linkingId === d.id ? null : d.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap"
                    style={{ background: "linear-gradient(135deg, #c9a84c20, #c9a84c10)", color: "var(--primary)", border: "1px solid #c9a84c50" }}
                  >
                    הוסף קשר
                  </button>
                </div>
                {linkingId === d.id && (
                  <div className="mt-3 flex gap-2 items-end">
                    <div className="flex-1">
                      <label className={labelClass}>הקשר שלי אליו/אליה</label>
                      <select value={linkRel} onChange={e => setLinkRel(e.target.value)} className={inputClass}>
                        <option value="">-- בחר --</option>
                        {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    {linkDegree && <p className="text-xs mb-2.5" style={{ color: "var(--muted-foreground)" }}>({DEGREE_LABELS[linkDegree]})</p>}
                    <button
                      type="button" onClick={() => handleLinkDeceased(d.id)} disabled={!linkRel}
                      className="mb-0 px-3 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
                    >
                      שמור
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
          אם הנפטר כבר קיים — הוסף רק קשר אישי. אחרת מלא את הפרטים למטה.
        </p>
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
      <div className="p-4 space-y-3" style={sectionStyle}>
        <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>פרטים בסיסיים</h2>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>שם פרטי <span className="text-red-500">*</span></label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>שם משפחה</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
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
          <PhotoPicker
            name="photo"
            preview={photoPreview}
            label="הוסף תמונת נפטר"
            onFile={(f) => { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }}
          />
        </div>
      </div>

      {/* Death date */}
      <div className="p-4 space-y-3" style={sectionStyle}>
        <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
          תאריך פטירה <span className="text-red-500">*</span>
        </h2>

        {/* Mode tabs */}
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          <button
            type="button" onClick={() => setDateMode("gregorian")}
            className={`flex-1 py-2 text-sm font-semibold transition-all ${dateMode === "gregorian" ? "text-white" : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]"}`}
            style={dateMode === "gregorian" ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)" } : {}}
          >
            תאריך לועזי
          </button>
          <button
            type="button" onClick={() => setDateMode("hebrew")}
            className={`flex-1 py-2 text-sm font-semibold transition-all ${dateMode === "hebrew" ? "text-white" : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]"}`}
            style={dateMode === "hebrew" ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)" } : {}}
          >
            תאריך עברי
          </button>
        </div>

        {dateMode === "gregorian" ? (
          <div className="space-y-2">
            <input
              name="death_date_gregorian" type="date" required
              value={gregorianDate} onChange={e => setGregorianDate(e.target.value)}
              className={inputClass} dir="ltr"
            />
            {convertedDisplay && (
              <div className="flex items-center gap-2 text-sm rounded-xl px-3 py-2" style={{ background: "#fff8e8", border: "1px solid #c9a84c40" }}>
                <span style={{ color: "var(--muted-foreground)" }}>תאריך עברי:</span>
                <span className="font-bold" style={{ color: "var(--primary)" }}>{convertedDisplay}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Hebrew date pickers */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>יום</label>
                <select value={hebrewDay} onChange={e => setHebrewDay(e.target.value)} className={inputClass} required>
                  <option value="">--</option>
                  {Array.from({ length: hebrewDaysInMonth }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>
                      {numberToHebrewLetters(d)} ({d})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>חודש</label>
                <select value={hebrewMonth} onChange={e => setHebrewMonth(e.target.value)} className={inputClass}>
                  {HEBREW_MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>שנה</label>
                <input
                  type="number" value={hebrewYear}
                  onChange={e => setHebrewYear(e.target.value)}
                  className={inputClass} min={5700} max={6000} dir="ltr"
                />
              </div>
            </div>
            {/* Year in Hebrew letters */}
            {hebrewYear && parseInt(hebrewYear) >= 5700 && (
              <div className="text-xs text-center font-semibold" style={{ color: "var(--primary)" }}>
                {hebrewDay ? `${numberToHebrewLetters(parseInt(hebrewDay))} ` : ""}
                {HEBREW_MONTHS.find(m => m.value === parseInt(hebrewMonth))?.label || ""}
                {" "}
                {yearToHebrewLetters(parseInt(hebrewYear))}
              </div>
            )}
            {convertedGregorian && (
              <div className="flex items-center gap-2 text-sm rounded-xl px-3 py-2" style={{ background: "#fff8e8", border: "1px solid #c9a84c40" }}>
                <span style={{ color: "var(--muted-foreground)" }}>תאריך לועזי:</span>
                <span className="font-bold" style={{ color: "var(--primary)" }} dir="ltr">{convertedGregorian}</span>
              </div>
            )}
            {/* Midnight toggle for Hebrew mode */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>שעת הפטירה ביחס לחצות</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>משפיע על חישוב התאריך הלועזי</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="hebrew_midnight" checked={!hebrewBeforeMidnight} onChange={() => setHebrewBeforeMidnight(false)} />
                  <span className="text-xs font-medium">ביום / אחרי חצות</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="hebrew_midnight" checked={hebrewBeforeMidnight} onChange={() => setHebrewBeforeMidnight(true)} />
                  <span className="text-xs font-medium">בלילה לפני חצות</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Sunset toggle */}
        {dateMode === "gregorian" && (
          <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>שעת הפטירה ביחס לשקיעה</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>משפיע על חישוב התאריך העברי</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="sunset_time" checked={!afterSunset} onChange={() => setAfterSunset(false)} />
                <span className="text-xs font-medium">לפני שקיעה / בוקר</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="sunset_time" checked={afterSunset} onChange={() => setAfterSunset(true)} />
                <span className="text-xs font-medium">אחרי שקיעה</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Relationship */}
      <div className="p-4 space-y-3" style={sectionStyle}>
        <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>קשר משפחתי</h2>
        <div>
          <label className={labelClass}>קשר אליי</label>
          <select name="relationship_label" value={relLabel} onChange={e => setRelLabel(e.target.value)} className={inputClass}>
            <option value="">-- בחר --</option>
            {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {relDegree && (
          <div className="flex items-center gap-2 text-xs rounded-xl px-3 py-2" style={{ background: "#fff8e8", border: "1px solid #c9a84c40" }}>
            <span style={{ color: "var(--muted-foreground)" }}>דרגת קרבה אוטומטית:</span>
            <span className="font-bold" style={{ color: "var(--primary)" }}>{DEGREE_LABELS[relDegree]}</span>
          </div>
        )}
        <div>
          <label className={labelClass}>דרגת קרבה (לשינוי ידני)</label>
          <select value={relDegree} onChange={e => setRelDegree(e.target.value)} className={inputClass}>
            <option value="">-- בחר --</option>
            <option value="first">ראשונה (אב/אם/אח/בן...)</option>
            <option value="second">שנייה (סבא/דוד/נכד...)</option>
            <option value="extended">מורחבת</option>
          </select>
        </div>
        <input type="hidden" name="relationship_degree" value={relDegree} />
      </div>

      {/* Birth date */}
      <div className="p-4 space-y-2" style={sectionStyle}>
        <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>תאריך לידה (רשות)</h2>
        <input name="birth_date_gregorian" type="date" className={inputClass} dir="ltr" />
      </div>

      {/* Cemetery */}
      <div className="p-4 space-y-3" style={sectionStyle}>
        <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>פרטי בית קברות</h2>
        <input name="cemetery_name" type="text" placeholder="שם בית קברות" className={inputClass} />
        <div className="grid grid-cols-2 gap-2">
          <input name="cemetery_block" type="text" placeholder="חלקה" className={inputClass} />
          <input name="cemetery_plot" type="text" placeholder="קבר" className={inputClass} />
        </div>
        <input name="cemetery_notes" type="text" placeholder="הערות מיקום" className={inputClass} />

        {/* GPS */}
        <div className="rounded-xl p-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>מיקום GPS</p>
            <button
              type="button"
              onClick={handleGetGps}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold text-white disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
            >
              {gpsLoading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {gpsLoading ? "מאתר..." : "קבע מיקום נוכחי"}
            </button>
          </div>
          {gpsError && <p className="text-xs text-red-500 mt-1">{gpsError}</p>}
          {gpsLat && gpsLng && (
            <div className="flex items-center gap-2 mt-1">
              <svg className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs" dir="ltr" style={{ color: "var(--muted-foreground)" }}>
                {parseFloat(gpsLat).toFixed(5)}, {parseFloat(gpsLng).toFixed(5)}
              </p>
            </div>
          )}
          {!gpsLat && (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              לחץ לשמירת מיקום בית הקברות אוטומטית
            </p>
          )}
        </div>
      </div>

      {/* Gravestone photo + AI extraction */}
      <div className="p-4 space-y-3" style={sectionStyle}>
        <div>
          <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>תמונת מצבה</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            צרף תמונת מצבה — המערכת תנסה לחלץ את הפרטים אוטומטית
          </p>
        </div>

        <PhotoPicker
          name="gravestone_photo"
          preview={gravestonePreview}
          label="הוסף תמונת מצבה"
          onFile={(f) => {
            setGravestoneFile(f);
            setGravestonePreview(URL.createObjectURL(f));
            setAnalyzeError(null);
            setAnalyzeSuccess(false);
          }}
        />

        {/* Extract button — shown after photo is picked */}
        {gravestoneFile && (
          <button
            type="button"
            onClick={() => handleAnalyzeGravestone(gravestoneFile)}
            disabled={analyzeLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm disabled:opacity-60 transition-all"
            style={{
              background: analyzeSuccess
                ? "linear-gradient(135deg, #4ade80, #16a34a)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "white",
              boxShadow: analyzeSuccess
                ? "0 4px 14px rgba(74,222,128,0.3)"
                : "0 4px 14px rgba(99,102,241,0.3)",
            }}
          >
            {analyzeLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                מנתח את המצבה...
              </>
            ) : analyzeSuccess ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                הפרטים מולאו בהצלחה!
              </>
            ) : (
              <>
                {/* Sparkle / AI icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z" />
                  <path d="M19 15l.94 2.81L22 19l-2.06.19L19 22l-.94-2.81L16 19l2.06-.19z" opacity={0.6} />
                  <path d="M5 3l.63 1.87L7 6l-1.37.13L5 8l-.63-1.87L3 6l1.37-.13z" opacity={0.6} />
                </svg>
                חלץ פרטים מהתמונה בעזרת AI
              </>
            )}
          </button>
        )}

        {analyzeError && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626" }}>
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {analyzeError}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>הערות</label>
        <textarea
          name="notes" rows={3}
          className={`${inputClass} resize-none`}
          placeholder="הערות נוספות..."
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pb-4">
        <button
          type="submit" disabled={loading}
          className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)", boxShadow: "0 4px 14px rgba(184,134,11,0.35)" }}
        >
          {loading ? <LoadingSpinner size="sm" label="שומר..." /> : "שמור נפטר"}
        </button>
        <button
          type="button" onClick={() => router.back()}
          className="px-5 py-3 rounded-xl font-medium transition-colors border"
          style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--secondary)" }}
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
