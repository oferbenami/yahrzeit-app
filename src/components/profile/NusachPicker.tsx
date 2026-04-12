"use client";

import { useState, useTransition } from "react";
import { updatePrayerNusach } from "@/lib/profile/actions";

type Nusach = "sephardi" | "mizrahi" | "ashkenaz";

const OPTIONS: { value: Nusach; label: string; sub: string }[] = [
  { value: "sephardi", label: "ספרד",   sub: "נוסח ספרד" },
  { value: "mizrahi",  label: "מזרח",   sub: "עדות המזרח" },
  { value: "ashkenaz", label: "אשכנז",  sub: "נוסח אשכנז" },
];

export function NusachPicker({ current }: { current: Nusach }) {
  const [selected, setSelected] = useState<Nusach>(current);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(value: Nusach) {
    if (value === selected) return;
    setSelected(value);
    setSaved(false);
    setError(null);

    startTransition(async () => {
      const result = await updatePrayerNusach(value);
      if (result?.error) {
        setError(result.error);
        setSelected(current); // revert on error
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div>
      <div className="p-1 rounded-xl flex gap-1" style={{ background: "var(--muted)" }}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
            style={
              selected === opt.value
                ? {
                    background: "linear-gradient(135deg, #c9a84c, #8b6010)",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(184,134,11,0.30)",
                  }
                : { color: "var(--muted-foreground)" }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-2 h-4">
        {isPending && (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>שומר...</p>
        )}
        {saved && !isPending && (
          <p className="text-xs font-medium" style={{ color: "#6b9e6b" }}>
            ✓ נוסח {OPTIONS.find(o => o.value === selected)?.sub} נשמר
          </p>
        )}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>

      <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
        הנוסח יוצג כברירת מחדל בדף התפילות
      </p>
    </div>
  );
}
