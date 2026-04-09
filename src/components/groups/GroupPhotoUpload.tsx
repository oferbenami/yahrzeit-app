"use client";

import { useState } from "react";
import { uploadGroupPhoto } from "@/lib/groups/actions";
import { PhotoPicker } from "@/components/ui/PhotoPicker";

interface Props {
  groupId: string;
  groupName: string;
  currentPhotoUrl?: string | null;
}

export function GroupPhotoUpload({ groupId, groupName, currentPhotoUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPreview(URL.createObjectURL(file));
    setError(null);
    setLoading(true);
    const fd = new FormData();
    fd.append("photo", file);
    const result = await uploadGroupPhoto(groupId, fd);
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-4">
      {/* Group avatar */}
      <div className="relative shrink-0">
        <div
          className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold text-white"
          style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
        >
          {preview ? (
            <img src={preview} alt={groupName} className="w-full h-full object-cover" />
          ) : groupName[0]}
        </div>
        {loading && (
          <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <PhotoPicker
          name="group_photo"
          onFile={handleFile}
          label="הוסף תמונה לקבוצה"
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
}
