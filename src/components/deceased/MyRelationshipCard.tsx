"use client";

import { useState, useEffect } from "react";
import { upsertUserDeceasedRelationship } from "@/lib/deceased/actions";

const RELATIONSHIPS = [
  "אב", "אם", "סבא", "סבתא", "סב רבא", "סבתא רבא",
  "בעל", "אישה", "אח", "אחות", "בן", "בת",
  "דוד", "דודה", "בן דוד", "בת דוד",
  "חם", "חמה", "גיס", "גיסה",
  "אחיין", "אחיינית", "נכד", "נכדה", "אחר",
];

const DEGREE_MAP: Record<string, string> = {
  "אב": "first", "אם": "first", "בן": "first", "בת": "first",
  "בעל": "first", "אישה": "first", "אח": "first", "אחות": "first",
  "חם": "first", "חמה": "first", "גיס": "first", "גיסה": "first",
  "סבא": "second", "סבתא": "second", "נכד": "second", "נכדה": "second",
  "דוד": "second", "דודה": "second", "בן דוד": "second", "בת דוד": "second",
  "אחיין": "second", "אחיינית": "second",
  "סב רבא": "extended", "סבתא רבא": "extended",
};

const DEGREE_LABELS: Record<string, string> = {
  first: "קרבה ראשונה",
  second: "קרבה שנייה",
  extended: "מורחבת",
};

const inputClass =
  "w-full px-3 py-2 border border-[color:var(--border)] rounded-xl text-sm " +
  "bg-white/70 text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] " +
  "focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] transition-shadow";

interface Props {
  deceasedId: string;
  deceasedName: string;
  initialLabel: string | null;
  initialDegree: string | null;
}

export function MyRelationshipCard({ deceasedId, deceasedName, initialLabel, initialDegree }: Props) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(initialLabel || "");
  const [degree, setDegree] = useState(initialDegree || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Auto-set degree when label changes
  useEffect(() => {
    const auto = DEGREE_MAP[label];
    if (auto) setDegree(auto);
  }, [label]);

  // Current displayed values (optimistic update)
  const [displayLabel, setDisplayLabel] = useState(initialLabel || "");
  const [displayDegree, setDisplayDegree] = useState(initialDegree || "");

  async function handleSave() {
    if (!label) return;
    setLoading(true);
    setError(null);
    const result = await upsertUserDeceasedRelationship(deceasedId, label, degree);
    if (result?.error) {
      setError(result.error);
    } else {
      setDisplayLabel(label);
      setDisplayDegree(degree);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditing(false);
    }
    setLoading(false);
  }

  return (
    <div
      className="p-4 mb-4 rounded-2xl"
      style={{
        background: "linear-gradient(135deg, #f0fdfa, #e6faf7)",
        border: "1px solid #14b8a640",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm" style={{ color: "#0f766e" }}>
          הקשר שלי ל{deceasedName}
        </h3>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold px-3 py-1 rounded-lg transition-all"
            style={{ color: "#0f766e", background: "#ccfbf180", border: "1px solid #14b8a640" }}
          >
            {displayLabel ? "עדכן" : "הגדר"}
          </button>
        )}
      </div>

      {!editing ? (
        displayLabel ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)", color: "#0f766e", border: "1px solid #14b8a640" }}
            >
              {displayLabel}
            </span>
            {displayDegree && (
              <span className="text-xs" style={{ color: "#0f766e", opacity: 0.7 }}>
                {DEGREE_LABELS[displayDegree] ?? displayDegree}
              </span>
            )}
            {saved && (
              <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>✓ נשמר</span>
            )}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "#0f766e", opacity: 0.7 }}>
            הגדר את הקשר שלך כדי לקבל סינון וסיווג מותאם אישית
          </p>
        )
      ) : (
        <div className="space-y-2">
          <select
            value={label}
            onChange={e => setLabel(e.target.value)}
            className={inputClass}
          >
            <option value="">-- בחר קשר --</option>
            {RELATIONSHIPS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {degree && (
            <p className="text-xs px-2" style={{ color: "#0f766e" }}>
              דרגת קרבה אוטומטית: <strong>{DEGREE_LABELS[degree] ?? degree}</strong>
            </p>
          )}

          <div>
            <p className="text-xs mb-1 px-1" style={{ color: "#0f766e", opacity: 0.7 }}>
              דרגה ידנית (לשינוי):
            </p>
            <select
              value={degree}
              onChange={e => setDegree(e.target.value)}
              className={inputClass}
            >
              <option value="">-- בחר --</option>
              <option value="first">קרבה ראשונה (אב/אם/אח/בן...)</option>
              <option value="second">קרבה שנייה (סבא/דוד/נכד...)</option>
              <option value="extended">מורחבת</option>
            </select>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setEditing(false); setLabel(displayLabel); setDegree(displayDegree); }}
              disabled={loading}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !label}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all"
              style={{
                background: loading || !label
                  ? "#86efac"
                  : "linear-gradient(135deg, #14b8a6, #0f766e)",
                boxShadow: "0 2px 8px rgba(20,184,166,0.25)",
              }}
            >
              {loading ? "שומר..." : "שמור"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
