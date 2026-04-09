"use client";

import { useState } from "react";
import { createGroup, joinGroup } from "@/lib/groups/actions";

const inputClass = "flex-1 px-3 py-2.5 border rounded-xl bg-white/70 text-sm focus:outline-none focus:ring-2 transition-shadow"
  + " " + "border-[color:var(--border)] text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:ring-[color:var(--ring)]";

const btnPrimary = "px-5 py-2.5 rounded-xl font-semibold text-sm text-white whitespace-nowrap disabled:opacity-50 transition-all"
  + " bg-gradient-to-br from-[#c9a84c] to-[#8b6010] shadow-[0_3px_10px_rgba(184,134,11,0.3)]";

const btnSecondary = "px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap disabled:opacity-50 transition-all border"
  + " border-[color:var(--border)] text-[color:var(--foreground)] bg-[color:var(--secondary)] hover:bg-[color:var(--muted)]";

export function CreateGroupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createGroup(new FormData(e.currentTarget));
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input name="name" type="text" placeholder="שם הקבוצה" required disabled={loading} className={inputClass} />
        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? "יוצר..." : "צור"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </form>
  );
}

export function JoinGroupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await joinGroup(new FormData(e.currentTarget));
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="invite_code" type="text" placeholder="קוד הזמנה" required disabled={loading}
          className={`${inputClass} uppercase`} dir="ltr"
        />
        <button type="submit" disabled={loading} className={btnSecondary}>
          {loading ? "מצטרף..." : "הצטרף"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </form>
  );
}
