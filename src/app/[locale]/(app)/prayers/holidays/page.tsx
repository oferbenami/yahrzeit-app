import Link from "next/link";
import { HDate, months } from "@hebcal/core";
import { HolidaysClient, type HolidayItem, type HolidayType } from "@/components/prayers/HolidaysClient";

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  boxShadow: "0 2px 10px rgba(184,134,11,0.07)",
};

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

function getUpcomingHolidays(): HolidayItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayHDate = new HDate(today);
  const currentHYear = todayHDate.getFullYear();

  const fixedDefinitions: HolidayDef[] = [
    // Yizkor + Fast
    { name: "יום הכיפורים",     month: months.TISHREI, day: 10, types: ["yizkor", "fast"], desc: "יזכור בתפילת מוסף | צום כיפור" },
    // Yizkor
    { name: "שמיני עצרת",      month: months.TISHREI, day: 22, types: ["yizkor"],          desc: "יזכור — אחרון של סוכות בארץ ישראל" },
    { name: "אחרון של פסח",    month: months.NISAN,   day: 21, types: ["yizkor"],          desc: "יזכור — שביעי של פסח בארץ ישראל" },
    { name: "שבועות",           month: months.SIVAN,   day: 6,  types: ["yizkor"],          desc: "יזכור בתפילת מוסף" },
    // Fasts
    { name: "תשעה באב",        month: months.AV,      day: 9,  types: ["fast"],            desc: "צום ואבלות על חורבן בית המקדש" },
    { name: "צום גדליה",       month: months.TISHREI, day: 3,  types: ["fast"],            desc: "צום (נדחה לד׳ תשרי כשג׳ חל בשבת)" },
    { name: "יז׳ בתמוז",       month: months.TAMUZ,   day: 17, types: ["fast"],            desc: "תחילת שלושת השבועות" },
    { name: "עשרה בטבת",       month: months.TEVET,   day: 10, types: ["fast"],            desc: "צום על תחילת מצור ירושלים" },
    // Holidays
    { name: "ראש השנה",        month: months.TISHREI, day: 1,  types: ["holiday"],         desc: "ראש השנה — מנהג ביקור קברים לאחריו" },
    { name: "סוכות",            month: months.TISHREI, day: 15, types: ["holiday"],         desc: "חג הסוכות — שמחת החג" },
    { name: "ליל הסדר",        month: months.NISAN,   day: 15, types: ["holiday"],         desc: "ליל הסדר — פסח" },
    { name: "חנוכה",            month: months.KISLEV,  day: 25, types: ["holiday"],         desc: "ראשון של חנוכה — שמונת ימי חנוכה" },
    { name: "ל״ג בעומר",       month: months.IYYAR,   day: 18, types: ["holiday"],         desc: "מנהג ביקור קברים ומיוחד לאבלות" },
    { name: "פורים",            month: months.ADAR_I,  day: 14, types: ["holiday"],         desc: "חג הפורים" },
    // National memorial days
    { name: "יום השואה",       month: months.NISAN,   day: 27, types: ["holiday"],         desc: "יום הזיכרון לשואה ולגבורה" },
    { name: "יום הזיכרון",     month: months.IYYAR,   day: 4,  types: ["holiday"],         desc: "יום הזיכרון לחללי מערכות ישראל ולנפגעי פעולות האיבה" },
    { name: "יום העצמאות",     month: months.IYYAR,   day: 5,  types: ["holiday"],         desc: "יום העצמאות — ה׳ באייר" },
    { name: "יום ירושלים",     month: months.IYYAR,   day: 28, types: ["holiday"],         desc: "יום ירושלים — כ״ח באייר" },
  ];

  const holidays: HolidayItem[] = [];
  const seen = new Set<string>();

  for (const year of [currentHYear, currentHYear + 1]) {
    // Fixed holidays
    for (const def of fixedDefinitions) {
      // In non-leap year, ADAR_II (month 13) doesn't exist — skip gracefully
      if (def.month === months.ADAR_II && !HDate.isLeapYear(year)) continue;
      // In leap year, ADAR_I for Purim → use ADAR_II (Purim is in Adar II in leap years)
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

    // Rosh Chodesh — all months except Tishrei (= Rosh Hashanah)
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

export default async function HolidaysPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const holidays = getUpcomingHolidays();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Link
          href={`/${locale}/prayers`}
          className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>חגים ומועדים</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            יזכור, צומות, חגים וראשי חודשים
          </p>
        </div>
      </div>

      <div
        className="h-px mb-5"
        style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }}
      />

      <HolidaysClient items={holidays} />

      {/* Yizkor note */}
      <div
        className="mt-6 p-4 rounded-2xl"
        style={{ ...cardStyle, borderColor: "#c9a84c30" }}
      >
        <p className="font-bold text-sm mb-2" style={{ color: "var(--foreground)" }}>על תפילת יזכור</p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          יזכור נאמר בתפילת מוסף של יום כיפור, שמיני עצרת, אחרון של פסח ושבועות.
          הנוהג הרווח הוא שמי שהוריו בחיים יוצא מבית הכנסת בזמן אמירת יזכור.
          הדלקת נר נשמה נהוגה בלילה שלפני כל אחד מהמועדים.
        </p>
      </div>
    </div>
  );
}
