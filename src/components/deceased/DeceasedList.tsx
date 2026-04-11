"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface DeceasedItem {
  id: string;
  full_name: string;
  photo_url?: string | null;
  death_date_hebrew?: string | null;
  death_date_gregorian?: string | null;
  relationship_label?: string | null;
  cemetery_name?: string | null;
  groupName?: string;
}

export function DeceasedList({
  deceased,
  locale,
}: {
  deceased: DeceasedItem[];
  locale: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deceased;
    return deceased.filter((d) =>
      d.full_name.toLowerCase().includes(q) ||
      d.relationship_label?.toLowerCase().includes(q) ||
      d.cemetery_name?.toLowerCase().includes(q) ||
      d.groupName?.toLowerCase().includes(q)
    );
  }, [deceased, query]);

  // Group by first Hebrew letter
  const grouped = useMemo(() => {
    if (query.trim()) return null; // no grouping while searching
    const map = new Map<string, DeceasedItem[]>();
    for (const d of filtered) {
      const letter = d.full_name[0] || "#";
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(d);
    }
    return map;
  }, [filtered, query]);

  const cardStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "1rem",
    boxShadow: "0 2px 10px rgba(184,134,11,0.07)",
  };

  if (deceased.length === 0) {
    return (
      <div className="text-center py-16">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #f5e9d4, #e0caa0)" }}
        >
          <svg className="w-9 h-9" style={{ color: "#c9a84c" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="font-bold mb-1" style={{ color: "var(--foreground)" }}>אין נפטרים רשומים</p>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>הוסף נפטרים דרך דף הקבוצה</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search box */}
      <div className="relative">
        <svg
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "var(--muted-foreground)", right: "0.875rem" }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי שם, קשר משפחתי, בית קברות..."
          className="w-full pr-10 pl-4 py-3 rounded-xl text-sm border"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            outline: "none",
          }}
          dir="rtl"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute top-1/2 -translate-y-1/2 left-3 text-xs px-1.5 py-0.5 rounded"
            style={{ color: "var(--muted-foreground)" }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Results count while searching */}
      {query.trim() && (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {filtered.length === 0 ? "לא נמצאו תוצאות" : `${filtered.length} תוצאות`}
        </p>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-10" style={cardStyle}>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            לא נמצאו נפטרים התואמים לחיפוש &quot;{query}&quot;
          </p>
        </div>
      ) : grouped ? (
        // Grouped by letter
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([letter, items]) => (
            <div key={letter}>
              <div
                className="text-xs font-bold px-3 py-1 rounded-lg mb-1 inline-block"
                style={{ background: "linear-gradient(135deg, #fff8e8, #fef3d0)", color: "#b8860b", border: "1px solid #c9a84c40" }}
              >
                {letter}
              </div>
              <div style={cardStyle}>
                {items.map((d, i) => (
                  <DeceasedRow key={d.id} d={d} locale={locale} last={i === items.length - 1} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat list while searching
        <div style={cardStyle}>
          {filtered.map((d, i) => (
            <DeceasedRow key={d.id} d={d} locale={locale} last={i === filtered.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function DeceasedRow({
  d,
  locale,
  last,
}: {
  d: DeceasedItem;
  locale: string;
  last: boolean;
}) {
  const initials = d.full_name[0] || "?";

  return (
    <Link
      href={`/${locale}/deceased/${d.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-all hover:opacity-80"
      style={{
        borderBottom: last ? "none" : "1px solid var(--border)",
        background: "var(--card)",
      }}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-base font-bold text-white shrink-0"
        style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
      >
        {d.photo_url ? (
          <img src={d.photo_url} alt={d.full_name} className="w-full h-full object-cover" />
        ) : initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>
          {d.full_name} ז״ל
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {d.relationship_label && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "linear-gradient(135deg, #fff8e8, #fef3d0)", color: "#b8860b" }}
            >
              {d.relationship_label}
            </span>
          )}
          {d.death_date_hebrew && (
            <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
              {d.death_date_hebrew}
            </span>
          )}
        </div>
        {d.groupName && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
            {d.groupName}
          </p>
        )}
      </div>

      {/* Arrow */}
      <svg className="w-4 h-4 rotate-180 shrink-0" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
