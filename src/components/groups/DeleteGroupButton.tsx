"use client";

import { useState } from "react";
import { deleteGroup } from "@/lib/groups/actions";

export function DeleteGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteGroup(groupId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, server action redirects — no need to do anything here
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
        style={{
          background: "var(--muted)",
          color: "#ef4444",
          border: "1px solid #fca5a540",
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        מחק קבוצה
      </button>
    );
  }

  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: "linear-gradient(135deg, #fff5f5, #fee2e2)", border: "1px solid #fca5a580" }}
    >
      <p className="font-bold text-sm mb-1" style={{ color: "#dc2626" }}>מחיקת קבוצה</p>
      <p className="text-xs mb-4" style={{ color: "#ef4444" }}>
        פעולה זו תמחק לצמיתות את הקבוצה &ldquo;{groupName}&rdquo; וכל הנפטרים והחברים הקשורים אליה. לא ניתן לבטל פעולה זו.
      </p>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
          style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
        >
          ביטול
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
          style={{
            background: loading ? "#fca5a5" : "linear-gradient(135deg, #ef4444, #dc2626)",
            boxShadow: "0 3px 10px rgba(239,68,68,0.25)",
          }}
        >
          {loading ? "מוחק..." : "כן, מחק"}
        </button>
      </div>
    </div>
  );
}
