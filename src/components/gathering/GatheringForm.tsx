"use client";

import { useState, useId } from "react";
import { createGathering, updateGathering } from "@/lib/gathering/actions";
import { useToast } from "@/components/ui/Toast";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface GatheringEvent {
  id: string;
  location_name: string | null;
  location_address: string | null;
  meeting_time: string | null;
  notes: string | null;
}

interface GatheringFormProps {
  deceasedId: string;
  yahrzeitDate: string;
  yahrzeitDateHebrew: string;
  existing?: GatheringEvent | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function GatheringForm({
  deceasedId,
  yahrzeitDate,
  yahrzeitDateHebrew,
  existing,
  onSuccess,
  onCancel,
}: GatheringFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const nameId = useId();
  const addressId = useId();
  const timeId = useId();
  const notesId = useId();

  const inputClass =
    "w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow text-sm";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    fd.append("deceased_id", deceasedId);
    fd.append("yahrzeit_date", yahrzeitDate);

    const result = existing
      ? await updateGathering(existing.id, fd)
      : await createGathering(fd);

    if (result?.error) {
      setError(result.error);
    } else {
      toast(existing ? "הכינוס עודכן" : "הכינוס נוסף בהצלחה", "success");
      onSuccess?.();
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      aria-label={existing ? "עריכת כינוס" : "הוספת כינוס"}
      noValidate
    >
      {error && <ErrorMessage message={error} />}

      <p className="text-sm text-muted-foreground">
        אזכרה: <strong>{yahrzeitDateHebrew}</strong>
      </p>

      <div>
        <label htmlFor={nameId} className="block text-sm font-medium mb-1.5">
          שם מיקום
        </label>
        <input
          id={nameId}
          name="location_name"
          type="text"
          defaultValue={existing?.location_name || ""}
          placeholder="בית הכנסת, אולם..."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={addressId} className="block text-sm font-medium mb-1.5">
          כתובת
        </label>
        <input
          id={addressId}
          name="location_address"
          type="text"
          defaultValue={existing?.location_address || ""}
          placeholder="רחוב, עיר"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={timeId} className="block text-sm font-medium mb-1.5">
          שעת מפגש
        </label>
        <input
          id={timeId}
          name="meeting_time"
          type="time"
          defaultValue={existing?.meeting_time?.slice(0, 5) || ""}
          className={inputClass}
          dir="ltr"
        />
      </div>

      <div>
        <label htmlFor={notesId} className="block text-sm font-medium mb-1.5">
          הערות
        </label>
        <textarea
          id={notesId}
          name="notes"
          rows={2}
          defaultValue={existing?.notes || ""}
          placeholder="פרטים נוספים..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          aria-busy={loading}
        >
          {loading ? <LoadingSpinner size="sm" label="שומר..." /> : (existing ? "עדכן" : "הוסף כינוס")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 border border-border rounded-xl font-medium hover:bg-secondary transition-colors"
          >
            ביטול
          </button>
        )}
      </div>
    </form>
  );
}
