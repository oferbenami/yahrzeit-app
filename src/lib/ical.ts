export interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: Date;
  dtend?: Date;
  allDay?: boolean;
  location?: string;
  url?: string;
}

function formatICalDate(date: Date, allDay = false): string {
  if (allDay) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  // iCal spec: lines max 75 octets, fold with CRLF + SPACE
  const maxLen = 75;
  if (line.length <= maxLen) return line;

  let result = "";
  let pos = 0;
  while (pos < line.length) {
    if (pos === 0) {
      result += line.slice(0, maxLen);
      pos = maxLen;
    } else {
      result += "\r\n " + line.slice(pos, pos + maxLen - 1);
      pos += maxLen - 1;
    }
  }
  return result;
}

export function buildICalEvent(event: ICalEvent): string {
  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `SUMMARY:${escapeICalText(event.summary)}`,
    `DTSTAMP:${formatICalDate(new Date())}`,
  ];

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatICalDate(event.dtstart, true)}`);
    const end = event.dtend || new Date(event.dtstart.getTime() + 86400000);
    lines.push(`DTEND;VALUE=DATE:${formatICalDate(end, true)}`);
  } else {
    lines.push(`DTSTART:${formatICalDate(event.dtstart)}`);
    const end = event.dtend || new Date(event.dtstart.getTime() + 3600000);
    lines.push(`DTEND:${formatICalDate(end)}`);
  }

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  // Add alarm: 1 day before
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:תזכורת: ${escapeICalText(event.summary)}`,
    "END:VALARM"
  );

  lines.push("END:VEVENT");
  return lines.map(foldLine).join("\r\n");
}

export function buildICalFile(
  events: ICalEvent[],
  calName = "אזכרה"
): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Yahrzeit App//HE",
    `X-WR-CALNAME:${escapeICalText(calName)}`,
    "X-WR-TIMEZONE:Asia/Jerusalem",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ].join("\r\n");

  const eventsStr = events.map(buildICalEvent).join("\r\n");

  return `${header}\r\n${eventsStr}\r\nEND:VCALENDAR`;
}

/**
 * Build iCal events for a deceased's yahrzeit dates
 */
export function buildYahrzeitICalEvents(
  deceased: {
    id: string;
    full_name: string;
    death_date_hebrew: string;
    relationship_label?: string | null;
    cemetery_name?: string | null;
  },
  yahrzeitDates: Array<{
    gregorianDate: string;
    hebrewDate: string;
  }>,
  appUrl = "https://yahrzeit.app"
): ICalEvent[] {
  return yahrzeitDates.map(({ gregorianDate, hebrewDate }, i) => {
    const date = new Date(gregorianDate);
    const relPart = deceased.relationship_label
      ? ` (${deceased.relationship_label})`
      : "";
    return {
      uid: `yahrzeit-${deceased.id}-${date.getFullYear()}@yahrzeit.app`,
      summary: `אזכרה - ${deceased.full_name}${relPart}`,
      description: `${hebrewDate}\nלזכר נשמת ${deceased.full_name}`,
      dtstart: date,
      allDay: true,
      location: deceased.cemetery_name || undefined,
      url: `${appUrl}/he/deceased/${deceased.id}`,
    };
  });
}
