"use client";

import { useState } from "react";

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
}

export function CemeteryLocationPicker({ initialLat, initialLng }: Props) {
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickLocation() {
    if (!navigator.geolocation) {
      setError("הדפדפן לא תומך במיקום גאוגרפי");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLoading(false);
      },
      (err) => {
        setError("לא ניתן לקבל מיקום: " + err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const mapsUrl = lat && lng
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : null;

  return (
    <div className="space-y-2">
      <input type="hidden" name="cemetery_lat" value={lat ?? ""} />
      <input type="hidden" name="cemetery_lng" value={lng ?? ""} />

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={pickLocation}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-60"
          style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {loading ? "מאתר מיקום..." : lat ? "עדכן מיקום" : "בחר מיקום נוכחי"}
        </button>

        {lat && lng && !loading && (
          <>
            <span className="text-xs font-semibold" style={{ color: "#6b9e6b" }}>✓ מיקום נקבע</span>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold hover:underline"
                style={{ color: "var(--primary)" }}
              >
                הצג במפה ↗
              </a>
            )}
          </>
        )}
      </div>

      {error && <p className="text-xs" style={{ color: "#dc2626" }}>{error}</p>}

      {lat && lng && (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }} dir="ltr">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
