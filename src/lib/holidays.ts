import { HDate, months } from "@hebcal/core";
import type { HolidayItem, HolidayType } from "@/components/prayers/HolidaysClient";

const MONTH_NAMES: Record<number, string> = {
  [months.NISAN]:    "ניסן",
  [months.IYYAR]:    "אייר",
  [months.SIVAN]:    "סיון",
  [months.TAMUZ]:    "תמוז",
  [months.AV]:       "אב",
  [months.ELUL]:     "אלול",
  [months.TISHREI]:  "תשרי",
  [months.CHESHVAN]: "חשון",
  [months.KISLEV]:   "כסלו",
  [months.TEVET]:    "טבת",
  [months.SHVAT]:    "שבט",
  [months.ADAR_I]:   "אדר",
  [months.ADAR_II]:  "אדר ב׳",
};

interface HolidayDef {
  name: string;
  month: number;
  day: number;
  types: HolidayType[];
  desc: string;
}

const FIXED_DEFINITIONS: HolidayDef[] = [
  { name: "יום הכיפורים",     month: months.TISHREI, day: 10, types: ["yizkor", "fast"], desc: "יזכור בתפילת מוסף | צום כיפור" },
  { name: "שמיני עצרת",      month: months.TISHREI, day: 22, types: ["yizkor"],          desc: "יזכור — אחרון של סוכות בארץ ישראל" },
  { name: "אחרון של פסח",    month: months.NISAN,   day: 21, types: ["yizkor"],          desc: "יזכור — שביעי של פסח בארץ ישראל" },
  { name: "שבועות",           month: months.SIVAN,   day: 6,  types: ["yizkor"],          desc: "יזכור בתפילת מוסף" },
  { name: "תשעה באב",        month: months.AV,      day: 9,  types: ["fast"],            desc: "צום ואבלות על חורבן בית המקדש" },
  { name: "צום גדליה",       month: months.TISHREI, day: 3,  types: ["fast"],            desc: "צום (נדחה לד׳ תשרי כשג׳ חל בשבת)" },
  { name: "יז׳ בתמוז",       month: months.TAMUZ,   day: 17, types: ["fast"],            desc: "תחילת שלושת השבועות" },
  { name: "עשרה בטבת",       month: months.TEVET,   day: 10, types: ["fast"],            desc: "צום על תחילת מצור ירושלים" },
  { name: "ראש השנה",        month: months.TISHREI, day: 1,  types: ["holiday"],         desc: "ראש השנה — מנהג ביקור קברים לאחריו" },
  { name: "סוכות",            month: months.TISHREI, day: 15, types: ["holiday"],         desc: "חג הסוכות — שמחת החג" },
  { name: "ליל הסדר",        month: months.NISAN,   day: 15, types: ["holiday"],         desc: "ליל הסדר — פסח" },
  { name: "חנוכה",            month: months.KISLEV,  day: 25, types: ["holiday"],         desc: "ראשון של חנוכה — שמונת ימי חנוכה" },
  { name: "ל״ג בעומר",       month: months.IYYAR,   day: 18, types: ["holiday"],         desc: "מנהג ביקור קברים ומיוחד לאבלות" },
  { name: "פורים",            month: months.ADAR_I,  day: 14, types: ["holiday"],         desc: "חג הפורים" },
  { name: "יום השואה",       month: months.NISAN,   day: 27, types: ["holiday"],         desc: "יום הזיכרון לשואה ולגבורה" },
  { name: "יום הזיכרון",     month: months.IYYAR,   day: 4,  types: ["holiday"],         desc: "יום הזיכרון לחללי מערכות ישראל ולנפגעי פעולות האיבה" },
  { name: "יום העצמאות",     month: months.IYYAR,   day: 5,  types: ["holiday"],         desc: "יום העצמאות — ה׳ באייר" },
  { name: "יום ירושלים",     month: months.IYYAR,   day: 28, types: ["holiday"],         desc: "יום ירושלים — כ״ח באייר" },
];

export function getUpcomingHolidays(): HolidayItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayHDate = new HDate(today);
  const currentHYear = todayHDate.getFullYear();

  const holidays: HolidayItem[] = [];
  const seen = new Set<string>();

  for (const year of [currentHYear, currentHYear + 1]) {
    for (const def of FIXED_DEFINITIONS) {
      if (def.month === months.ADAR_II && !HDate.isLeapYear(year)) continue;
      const actualMonth =
        def.month === months.ADAR_I && def.name === "פורים" && HDate.isLeapYear(year)
          ? months.ADAR_II
          : def.month;
      try {
        const hd = new HDate(def.day, actualMonth, year);
        const gDate = hd.greg();
        const key = `${def.name}-${year}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const hebrewDate = `${def.day} ${MONTH_NAMES[actualMonth] ?? ""} ${year}`;
        holidays.push({
          name: def.name,
          hebrewDate,
          gregorianDate: gDate.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" }),
          gregorianTimestamp: gDate.getTime(),
          description: def.desc,
          types: def.types,
        });
      } catch { /* skip */ }
    }

    // Rosh Chodesh
    const rcMonths = [
      months.CHESHVAN, months.KISLEV, months.TEVET, months.SHVAT,
      months.ADAR_I,
      ...(HDate.isLeapYear(year) ? [months.ADAR_II] : []),
      months.NISAN, months.IYYAR, months.SIVAN, months.TAMUZ, months.AV, months.ELUL,
    ];
    for (const m of rcMonths) {
      try {
        const hd = new HDate(1, m, year);
        const gDate = hd.greg();
        const name = `ראש חודש ${MONTH_NAMES[m] ?? ""}`;
        const key = `${name}-${year}`;
        if (seen.has(key)) continue;
        seen.add(key);
        holidays.push({
          name,
          hebrewDate: `א׳ ${MONTH_NAMES[m]} ${year}`,
          gregorianDate: gDate.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" }),
          gregorianTimestamp: gDate.getTime(),
          description: "",
          types: ["rosh-chodesh"],
        });
      } catch { /* skip */ }
    }
  }

  return holidays
    .filter((h) => h.gregorianTimestamp >= today.getTime())
    .sort((a, b) => a.gregorianTimestamp - b.gregorianTimestamp);
}
