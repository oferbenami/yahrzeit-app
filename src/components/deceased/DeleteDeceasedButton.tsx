"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteDeceased } from "@/lib/deceased/actions";

export function DeleteDeceasedButton({
  deceasedId,
  groupId,
  locale,
}: {
  deceasedId: string;
  groupId: string;
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteDeceased(deceasedId);
    if (result?.error) {
      setDeleting(false);
      alert(result.error);
      return;
    }
    window.location.href = `/${locale}/groups/${groupId}`;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={deleting}
        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
        aria-label="מחק נפטר"
      >
        {deleting ? "מוחק..." : "מחק נפטר"}
      </button>

      <ConfirmDialog
        open={open}
        title="מחיקת נפטר"
        description="פעולה זו תמחק את כל הנתונים כולל תמונות ותזכורות. פעולה זו אינה הפיכה."
        confirmLabel="מחק לצמיתות"
        cancelLabel="ביטול"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
