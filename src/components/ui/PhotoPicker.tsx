"use client";

import { useRef, useState } from "react";

interface Props {
  onFile: (file: File) => void;
  preview?: string | null;
  label?: string;
  name: string;
}

export function PhotoPicker({ onFile, preview, label = "הוסף תמונה", name }: Props) {
  const [open, setOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { onFile(file); setOpen(false); }
    e.target.value = "";
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed transition-all hover:opacity-80"
        style={{ borderColor: "var(--border)", background: "var(--muted)" }}
      >
        {preview ? (
          <img src={preview} alt="תצוגה מקדימה" className="w-12 h-12 rounded-full object-cover border-2 border-[#c9a84c] shrink-0" />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #f5e9d4, #e0caa0)" }}
          >
            <svg className="w-6 h-6" style={{ color: "#c9a84c" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        <div className="text-right flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {preview ? "החלף תמונה" : label}
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            מצלמה או גלריה
          </p>
        </div>
        <svg className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        aria-hidden="true"
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        aria-hidden="true"
      />
      {/* Hidden named input for form submission - populated via JS */}
      <input type="hidden" name={`${name}_chosen`} />

      {/* Bottom sheet */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl p-6 pb-8 shadow-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            role="dialog"
            aria-label="בחר מקור תמונה"
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />
            <h3 className="text-center font-bold text-base mb-5" style={{ color: "var(--foreground)" }}>
              בחר מקור תמונה
            </h3>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setOpen(false); setTimeout(() => cameraRef.current?.click(), 50); }}
                className="flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl transition-all border"
                style={{ background: "linear-gradient(135deg, #fff8e8, #fef3d0)", borderColor: "#c9a84c60" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
                >
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-bold" style={{ color: "#b8860b" }}>צלם תמונה</span>
              </button>

              <button
                type="button"
                onClick={() => { setOpen(false); setTimeout(() => galleryRef.current?.click(), 50); }}
                className="flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl transition-all border"
                style={{ background: "var(--secondary)", borderColor: "var(--border)" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "var(--muted)" }}
                >
                  <svg className="w-7 h-7" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>בחר מגלריה</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full mt-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
            >
              ביטול
            </button>
          </div>
        </>
      )}
    </>
  );
}
