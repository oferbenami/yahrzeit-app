"use client";

import { buildYahrzeitGCalUrl } from "@/lib/notifications/google-calendar";

interface CalendarExportButtonsProps {
  deceasedId: string;
  deceasedName: string;
  yahrzeitDate: Date;
  hebrewDate: string;
  cemeteryName?: string | null;
  relationship?: string | null;
}

export function CalendarExportButtons({
  deceasedId,
  deceasedName,
  yahrzeitDate,
  hebrewDate,
  cemeteryName,
  relationship,
}: CalendarExportButtonsProps) {
  const googleUrl = buildYahrzeitGCalUrl(
    deceasedName,
    yahrzeitDate,
    hebrewDate,
    cemeteryName,
    relationship
  );

  const icsUrl = `/api/calendar/export?deceased=${deceasedId}`;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 9h18" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        הוסף ל-Google Calendar
      </a>

      <a
        href={icsUrl}
        download
        className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        ייצא .ics
      </a>
    </div>
  );
}
