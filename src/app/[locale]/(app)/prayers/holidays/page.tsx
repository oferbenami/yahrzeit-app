import Link from "next/link";
import { HolidaysClient } from "@/components/prayers/HolidaysClient";
import { getUpcomingHolidays } from "@/lib/holidays";

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  boxShadow: "0 2px 10px rgba(184,134,11,0.07)",
};

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
