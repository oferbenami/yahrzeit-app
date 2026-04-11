"use client";

import { useState, useRef } from "react";
import { uploadDeceasedPhoto } from "@/lib/deceased/actions";
import { PhotoPicker } from "@/components/ui/PhotoPicker";

interface Props {
  deceasedId: string;
  currentPhotoUrl?: string | null;
  deceasedName: string;
}

/** Compress an image file to at most maxKB kilobytes using Canvas. */
async function compressImage(file: File, maxKB = 100): Promise<File> {
  const maxBytes = maxKB * 1024;
  if (file.size <= maxBytes) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Scale down if very large (max 1200px on the longest side)
      const MAX_DIM = 1200;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);

      const baseName = file.name.replace(/\.[^.]+$/, "") + ".jpg";

      function tryQuality(quality: number): void {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("Compression failed")); return; }
            if (blob.size <= maxBytes || quality <= 0.1) {
              resolve(new File([blob], baseName, { type: "image/jpeg" }));
            } else {
              tryQuality(Math.max(0.1, quality - 0.15));
            }
          },
          "image/jpeg",
          quality
        );
      }

      tryQuality(0.85);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

export function DeceasedPhotoUpload({ deceasedId, currentPhotoUrl, deceasedName }: Props) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<File | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setSaved(false);
    setLoading(true);

    // Compress before upload
    let compressed = file;
    try {
      compressed = await compressImage(file);
    } catch {
      // fall back to original if compression fails
    }

    fileRef.current = compressed;
    setPreview(URL.createObjectURL(compressed));

    const fd = new FormData();
    fd.append("photo", compressed);
    const result = await uploadDeceasedPhoto(deceasedId, fd);

    if (result?.error) {
      setError(result.error);
      setPreview(currentPhotoUrl ?? null); // revert preview on failure
    } else {
      setSaved(true);
    }
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
          <h2 className="text-xl font-bold truncate">{deceasedName} ז״ל</h2>
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
      {saved && !error && (
        <p className="text-xs font-medium" style={{ color: "#6b9e6b" }}>התמונה נשמרה בהצלחה ✓</p>
      )}
    </div>
  );
}
