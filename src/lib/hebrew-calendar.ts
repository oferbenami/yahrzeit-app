import { HDate, months } from "@hebcal/core";

/**
 * Convert a number (1–30) to Hebrew gematria letters
 * e.g. 1→א  2→ב  15→טו  20→כ  29→כט  30→ל
 */
export function numberToHebrewLetters(n: number): string {
  if (n < 1 || n > 30) return String(n);
  // Special cases to avoid writing God's name
  if (n === 15) return "ט״ו";
  if (n === 16) return "ט״ז";
  const tens = ["", "י", "כ", "ל"];
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const t = Math.floor(n / 10);
  const o = n % 10;
  const letters = (tens[t] ?? "") + (ones[o] ?? "");
  // Add gershayim for 2+ letters, geresh for 1 letter
  if (letters.length === 1) return letters + "׳";
  return letters.slice(0, -1) + '״' + letters.slice(-1);
}

/**
 * Convert a Hebrew year (e.g. 5785) to Hebrew letters (e.g. תשפ״ה)
 * Drops the thousands digit as is customary in Jewish calendars
 */
export function yearToHebrewLetters(hebrewYear: number): string {
  const y = hebrewYear % 1000;
  const hundredsMap: [number, string][] = [
    [900, "תתק"], [800, "תת"], [700, "תש"], [600, "תר"], [500, "תק"],
    [400, "ת"],   [300, "ש"],  [200, "ר"],  [100, "ק"],
  ];
  const tensMap: [number, string][] = [
    [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"], [50, "נ"],
    [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"],
  ];
  const onesMap: [number, string][] = [
    [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"], [5, "ה"],
    [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"],
  ];

  let result = "";
  let rem = y;
  for (const [val, s] of hundredsMap) {
    if (rem >= val) { result += s; rem -= val; }
  }
  if (rem === 16) { result += "טז"; rem = 0; }
  else if (rem === 15) { result += "טו"; rem = 0; }
  else {
    for (const [val, s] of tensMap)  { if (rem >= val) { result += s; rem -= val; } }
    for (const [val, s] of onesMap)  { if (rem >= val) { result += s; rem -= val; } }
  }

  if (result.length === 1) return result + "׳";
  return result.slice(0, -1) + "״" + result.slice(-1);
}

/**
 * Format a YYYY-MM-DD string as DD/MM/YYYY
 */
export function formatGregorianDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export const HEBREW_MONTHS = [
  { value: 7,  label: "תשרי" },
  { value: 8,  label: "חשוון" },
  { value: 9,  label: "כסלו" },
  { value: 10, label: "טבת" },
  { value: 11, label: "שבט" },
  { value: 12, label: "אדר א׳" },
  { value: 13, label: "אדר ב׳" },
  { value: 1,  label: "ניסן" },
  { value: 2,  label: "אייר" },
  { value: 3,  label: "סיון" },
  { value: 4,  label: "תמוז" },
  { value: 5,  label: "אב" },
  { value: 6,  label: "אלול" },
];

export interface HebrewDateInfo {
  day: number;
  month: number;
  year: number;
  monthName: string;
  hebrewString: string;
}

export interface YahrzeitInfo {
  gregorianDate: Date;
  hebrewDate: HebrewDateInfo;
  shabbatEveBefore: Date | null;
}

/**
 * Convert Hebrew date to Gregorian.
 * Returns a Date at local noon to avoid UTC-offset date shifts when calling toISOString().
 */
export function hebrewToGregorian(day: number, month: number, year: number): Date | null {
  try {
    const daysInMonth = HDate.daysInMonth(month, year);
    if (day < 1 || day > daysInMonth) return null;
    const d = new HDate(day, month, year).greg();
    // HDate.greg() returns midnight local time; set to noon so toISOString() (UTC) stays on the same calendar day
    d.setHours(12, 0, 0, 0);
    return d;
  } catch {
    return null;
  }
}

/**
 * Get days in a Hebrew month
 */
export function getHebrewDaysInMonth(month: number, year: number): number {
  try { return HDate.daysInMonth(month, year); } catch { return 30; }
}

/**
 * Convert Gregorian date to Hebrew date
 */
export function gregorianToHebrew(date: Date): HebrewDateInfo {
  const hDate = new HDate(date);
  return {
    day: hDate.getDate(),
    month: hDate.getMonth(),
    year: hDate.getFullYear(),
    monthName: hDate.getMonthName(),
    hebrewString: hDate.render("he"),
  };
}

/**
 * Get Hebrew month name (English)
 */
export function getHebrewMonthName(month: number, year: number): string {
  const hDate = new HDate(1, month, year);
  return hDate.getMonthName();
}

/**
 * Calculate yahrzeit date for a given Hebrew year
 * Handles Adar I / Adar II correctly
 */
export function calculateYahrzeit(
  hebrewDay: number,
  hebrewMonth: number,
  targetYear: number
): YahrzeitInfo {
  let yahrzeitHDate: HDate;

  const isLeapYear = HDate.isLeapYear(targetYear);

  // Adar handling: if death was in Adar (non-leap year month 6)
  // In a leap year, the yahrzeit is observed in Adar II (month 7)
  let adjustedMonth = hebrewMonth;
  if (hebrewMonth === months.ADAR_I && !isLeapYear) {
    adjustedMonth = months.ADAR_I;
  } else if (hebrewMonth === months.ADAR_I && isLeapYear) {
    adjustedMonth = months.ADAR_II;
  }

  // Handle end-of-month edge cases (e.g., Cheshvan 30 in a short year)
  const daysInMonth = HDate.daysInMonth(adjustedMonth, targetYear);
  const adjustedDay = Math.min(hebrewDay, daysInMonth);

  yahrzeitHDate = new HDate(adjustedDay, adjustedMonth, targetYear);
  const gregorianDate = yahrzeitHDate.greg();

  // Find Shabbat eve (Friday) before yahrzeit
  let shabbatEveBefore: Date | null = null;
  const dayOfWeek = gregorianDate.getDay(); // 0=Sun, 6=Sat, 5=Fri
  if (dayOfWeek === 6) {
    // Yahrzeit is on Shabbat, Shabbat eve is the day before
    shabbatEveBefore = new Date(gregorianDate);
    shabbatEveBefore.setDate(shabbatEveBefore.getDate() - 1);
  } else if (dayOfWeek > 0) {
    // Go back to last Friday
    const daysToFriday = (dayOfWeek + 1) % 7 + 1;
    shabbatEveBefore = new Date(gregorianDate);
    shabbatEveBefore.setDate(shabbatEveBefore.getDate() - daysToFriday);
  } else {
    // Sunday — Shabbat eve was last Friday
    shabbatEveBefore = new Date(gregorianDate);
    shabbatEveBefore.setDate(shabbatEveBefore.getDate() - 2);
  }

  return {
    gregorianDate,
    hebrewDate: {
      day: yahrzeitHDate.getDate(),
      month: yahrzeitHDate.getMonth(),
      year: yahrzeitHDate.getFullYear(),
      monthName: yahrzeitHDate.getMonthName(),
      hebrewString: yahrzeitHDate.render("he"),
    },
    shabbatEveBefore,
  };
}

/**
 * Calculate next yahrzeit from today
 */
export function getNextYahrzeit(
  hebrewDay: number,
  hebrewMonth: number
): YahrzeitInfo & { daysUntil: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayHebrew = new HDate(today);
  let targetYear = todayHebrew.getFullYear();

  const yahrzeit = calculateYahrzeit(hebrewDay, hebrewMonth, targetYear);

  // If yahrzeit already passed this year, calculate for next year
  if (yahrzeit.gregorianDate < today) {
    targetYear += 1;
    const nextYahrzeit = calculateYahrzeit(hebrewDay, hebrewMonth, targetYear);
    const daysUntil = Math.ceil(
      (nextYahrzeit.gregorianDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return { ...nextYahrzeit, daysUntil };
  }

  const daysUntil = Math.ceil(
    (yahrzeit.gregorianDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return { ...yahrzeit, daysUntil };
}

/**
 * Get current Hebrew year
 */
export function getCurrentHebrewYear(): number {
  return new HDate(new Date()).getFullYear();
}

/**
 * Format Hebrew date string
 */
export function formatHebrewDate(
  day: number,
  monthName: string,
  year: number
): string {
  return `${day} ${monthName} ${year}`;
}

/**
 * Get all yahrzeit dates for upcoming N days
 */
export function getUpcomingYahrzeits(
  deceased: Array<{
    id: string;
    full_name: string;
    death_date_hebrew_day: number;
    death_date_hebrew_month: number;
  }>,
  daysAhead: number = 30
): Array<{
  deceasedId: string;
  fullName: string;
  yahrzeit: YahrzeitInfo;
  daysUntil: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + daysAhead);

  return deceased
    .map((d) => {
      const next = getNextYahrzeit(
        d.death_date_hebrew_day,
        d.death_date_hebrew_month
      );
      return {
        deceasedId: d.id,
        fullName: d.full_name,
        yahrzeit: next,
        daysUntil: next.daysUntil,
      };
    })
    .filter((item) => item.yahrzeit.gregorianDate <= cutoff)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
