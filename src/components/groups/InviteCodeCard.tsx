"use client";

import { useState } from "react";
import { regenerateInviteCode } from "@/lib/groups/actions";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function InviteCodeCard({
  groupId,
  inviteCode,
}: {
  groupId: string;
  inviteCode: string;
}) {
  const [code, setCode] = useState(inviteCode);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      toast("קוד הועתק ללוח!", "success");
    } catch {
      toast("לא הצלחנו להעתיק", "error");
    }
  }

  async function handleRegenerate() {
    const result = await regenerateInviteCode(groupId);
    if (result?.code) {
      setCode(result.code);
      toast("קוד הזמנה חודש בהצלחה", "success");
    } else if (result?.error) {
      toast(result.error, "error");
    }
    setShowConfirm(false);
  }

  return (
    <>
      <div
        className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6"
        aria-label="קוד הזמנה לקבוצה"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-primary">קוד הזמנה</h3>
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="חדש קוד הזמנה"
          >
            חדש
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-2xl font-mono font-bold tracking-widest text-foreground flex-1"
            dir="ltr"
            aria-label={`קוד הזמנה: ${code}`}
          >
            {code}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            aria-label="העתק קוד הזמנה"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            העתק
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="חדש קוד הזמנה"
        description="הקוד הנוכחי יפסיק לעבוד. קישורי הזמנה ישנים לא יהיו תקפים."
        confirmLabel="חדש קוד"
        cancelLabel="ביטול"
        onConfirm={handleRegenerate}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
