"use client";

import { useState } from "react";
import { createGroup, joinGroup } from "@/lib/groups/actions";

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
        <input
          name="name"
          type="text"
          placeholder="שם הקבוצה"
          required
          disabled={loading}
          className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? "יוצר..." : "צור"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}
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
          name="invite_code"
          type="text"
          placeholder="קוד הזמנה"
          required
          disabled={loading}
          className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase disabled:opacity-50"
          dir="ltr"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? "מצטרף..." : "הצטרף"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}
    </form>
  );
}
