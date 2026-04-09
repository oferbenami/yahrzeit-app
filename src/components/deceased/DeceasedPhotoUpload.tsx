"use client";

import { useState, useRef } from "react";
import { uploadDeceasedPhoto } from "@/lib/deceased/actions";
import { PhotoPicker } from "@/components/ui/PhotoPicker";

interface Props {
  deceasedId: string;
  currentPhotoUrl?: string | null;
  deceasedName: string;
}

export function DeceasedPhotoUpload({ deceasedId, currentPhotoUrl, deceasedName }: Props) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);

  async function handleFile(file: File) {
    fileRef.current = file;
    setPreview(URL.createObjectURL(file));
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.append("photo", file);
    const result = await uploadDeceasedPhoto(deceasedId, fd);

    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
          >
            {preview ? (
              <img src={preview} alt={deceasedName} className="w-full h-full object-cover" />
            ) : (
              deceasedName[0]
            )}
          </div>
          {loading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Name + upload trigger */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{deceasedName}</h2>
          <PhotoPicker
            name="photo_upload"
            onFile={handleFile}
            label="הוסף תמונת נפטר"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}
      {!loading && preview && preview !== currentPhotoUrl && (
        <p className="text-xs" style={{ color: "#6b9e6b" }}>התמונה נשמרה בהצלחה</p>
      )}
    </div>
  );
}
