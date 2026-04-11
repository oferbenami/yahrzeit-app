"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "אשר",
  cancelLabel = "ביטול",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when dialog opens (safer default)
  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop — darker for contrast */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.72)" }}
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog — fixed white/dark card with strong border */}
      <div
        className="relative rounded-2xl p-6 w-full max-w-sm"
        style={{
          background: "#ffffff",
          border: "2px solid #e5e7eb",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.25)",
        }}
      >
        {/* Warning icon for destructive */}
        {destructive && (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#fef2f2" }}
          >
            <svg className="w-6 h-6" style={{ color: "#dc2626" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )}

        <h2 id="confirm-title" className="text-lg font-bold mb-2 text-center" style={{ color: "#111827" }}>
          {title}
        </h2>
        <p id="confirm-desc" className="text-sm mb-6 text-center" style={{ color: "#6b7280" }}>
          {description}
        </p>

        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #e5e7eb",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={destructive
              ? { background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 12px rgba(239,68,68,0.4)" }
              : { background: "linear-gradient(135deg, #c9a84c, #8b6010)", boxShadow: "0 4px 12px rgba(184,134,11,0.3)" }
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
