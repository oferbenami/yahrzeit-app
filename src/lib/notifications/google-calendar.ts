/**
 * Google Calendar integration
 * Uses the "Add to Google Calendar" URL approach (no OAuth required for basic use)
 * For full two-way sync, OAuth + Google Calendar API v3 is needed.
 */

export interface GoogleCalendarEventParams {
  title: string;
  details?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
}

/**
 * Build a "Add to Google Calendar" URL (no auth needed)
 */
export function buildGoogleCalendarUrl(params: GoogleCalendarEventParams): string {
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";

  const start = formatGCalDate(params.startDate, params.allDay);
  const end = formatGCalDate(
    params.endDate || new Date(params.startDate.getTime() + 86400000),
    params.allDay
  );

  const queryParams = new URLSearchParams({
    text: params.title,
    dates: `${start}/${end}`,
    ...(params.details ? { details: params.details } : {}),
    ...(params.location ? { location: params.location } : {}),
  });

  return `${base}&${queryParams.toString()}`;
}

function formatGCalDate(date: Date, allDay = false): string {
  if (allDay) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Build Google Calendar URL for a yahrzeit
 */
export function buildYahrzeitGCalUrl(
  deceasedName: string,
  yahrzeitDate: Date,
  hebrewDate: string,
  cemeteryName?: string | null,
  relationship?: string | null
): string {
  const relPart = relationship ? ` (${relationship})` : "";
  return buildGoogleCalendarUrl({
    title: `יארצייט - ${deceasedName}${relPart}`,
    details: `לזכר נשמת ${deceasedName}\n${hebrewDate}`,
    location: cemeteryName || undefined,
    startDate: yahrzeitDate,
    allDay: true,
  });
}
