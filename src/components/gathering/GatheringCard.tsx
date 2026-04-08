"use client";

import { useState } from "react";
import { deleteGathering } from "@/lib/gathering/actions";
import { GatheringForm } from "./GatheringForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { buildGoogleCalendarUrl } from "@/lib/notifications/google-calendar";

interface GatheringEvent {
  id: string;
  yahrzeit_date: string;
  location_name: string | null;
  location_address: string | null;
  meeting_time: string | null;
  notes: string | null;
  ical_uid: string | null;
}

interface GatheringCardProps {
  gathering: GatheringEvent;
  yahrzeitDateHebrew: string;
  deceasedId: string;
  deceasedName: string;
  canEdit: boolean;
}

export function GatheringCard({
  gathering,
  yahrzeitDateHebrew,
  deceasedId,
  deceasedName,
  canEdit,
}: GatheringCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();

  const yahrzeitDate = new Date(gathering.yahrzeit_date);

  // Build Google Calendar URL for this gathering
  const googleCalUrl = gathering.meeting_time
    ? (() => {
        const [h, m] = gathering.meeting_time.split(":").map(Number);
        const start = new Date(yahrzeitDate);
        start.setHours(h, m, 0);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        return buildGoogleCalendarUrl({
          title: `כינוס יארצייט - ${deceasedName}`,
          details: `${yahrzeitDateHebrew}\n${gathering.notes || ""}`,
          location: [gathering.location_name, gathering.location_address]
            .filter(Boolean)
            .join(", ") || undefined,
          startDate: start,
          endDate: end,
        });
      })()
    : null;

  async function handleDelete() {
    const result = await deleteGathering(gathering.id);
    if (result?.error) {
      toast(result.error, "error");
    } else {
      toast("הכינוס נמחק", "success");
    }
    setConfirmDelete(false);
  }

  if (editing) {
    return (
      <div className="bg-card border border-primary/30 rounded-xl p-4">
        <GatheringForm
          deceasedId={deceasedId}
          yahrzeitDate={gathering.yahrzeit_date}
          yahrzeitDateHebrew={yahrzeitDateHebrew}
          existing={gathering}
          onSuccess={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4" role="article" aria-label="כינוס משפחתי">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">
                {yahrzeitDate.toLocaleDateString("he-IL", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {gathering.meeting_time && (
                <p className="text-sm text-primary font-medium" dir="ltr">
                  🕐 {gathering.meeting_time.slice(0, 5)}
                </p>
              )}
              {gathering.location_name && (
                <p className="text-sm text-foreground mt-1">{gathering.location_name}</p>
              )}
              {gathering.location_address && (
                <p className="text-sm text-muted-foreground">{gathering.location_address}</p>
              )}
              {gathering.notes && (
                <p className="text-sm text-muted-foreground mt-1 italic">{gathering.notes}</p>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="ערוך כינוס"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="מחק כינוס"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Calendar links */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          {googleCalUrl && (
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="הוסף כינוס ל-Google Calendar"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Google Calendar
            </a>
          )}
          <a
            href={`/api/calendar/export?deceased=${deceasedId}`}
            download
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="ייצא יארצייט ל-.ics"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            .ics
          </a>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="מחיקת כינוס"
        description="האם למחוק את הכינוס המשפחתי?"
        confirmLabel="מחק"
        cancelLabel="ביטול"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
