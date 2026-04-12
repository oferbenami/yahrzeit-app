import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ReminderForm } from "@/components/deceased/ReminderForm";
import { calculateYahrzeit, getCurrentHebrewYear } from "@/lib/hebrew-calendar";

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  boxShadow: "0 2px 10px rgba(184,134,11,0.07)",
};

export default async function YahrzeitPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: deceased } = await supabase
    .from("deceased")
    .select("id, full_name, death_date_hebrew, death_date_hebrew_day, death_date_hebrew_month")
    .eq("id", id)
    .single();

  if (!deceased) notFound();

  const { data: reminder } = await supabase
    .from("reminder_schedule")
    .select("*")
    .eq("deceased_id", id)
    .eq("user_id", user!.id)
    .maybeSingle();

  // Calculate upcoming yahrzeits (current + next 2 years)
  const currentYear = getCurrentHebrewYear();
  const upcomingYahrzeits = [0, 1, 2]
    .map((offset) => {
      try {
        const info = calculateYahrzeit(
          deceased.death_date_hebrew_day,
          deceased.death_date_hebrew_month,
          currentYear + offset
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (info.gregorianDate < today) return null;
        const daysUntil = Math.ceil(
          (info.gregorianDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          hebrewDate: info.hebrewDate.hebrewString,
          gregorianDate: info.gregorianDate.toLocaleDateString("he-IL", {
            year: "numeric", month: "long", day: "numeric",
          }),
          daysUntil,
          year: currentYear + offset,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Link
          href={`/${locale}/deceased/${id}`}
          className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate" style={{ color: "var(--foreground)" }}>
            תזכורות — {deceased.full_name} ז״ל
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {deceased.death_date_hebrew}
          </p>
        </div>
      </div>

      <div
        className="h-px mb-5"
        style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }}
      />

      {/* Upcoming yahrzeits */}
      {upcomingYahrzeits.length > 0 && (
        <div className="mb-5" style={cardStyle}>
          <div className="p-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>אזכרות קרובות</p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {upcomingYahrzeits.map((ev, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {ev!.hebrewDate}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {ev!.gregorianDate}
                  </p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={
                    ev!.daysUntil <= 7
                      ? { background: "linear-gradient(135deg, #fff8e8, #fef3d0)", color: "#8b6010", border: "1px solid #c9a84c50" }
                      : { background: "var(--muted)", color: "var(--muted-foreground)" }
                  }
                >
                  {ev!.daysUntil === 0
                    ? "היום"
                    : ev!.daysUntil === 1
                      ? "מחר"
                      : `בעוד ${ev!.daysUntil} ימים`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminder form */}
      <ReminderForm
        deceasedId={id}
        userId={user!.id}
        existingReminder={reminder ?? null}
      />
    </div>
  );
}
