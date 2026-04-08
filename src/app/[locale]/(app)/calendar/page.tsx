import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getNextYahrzeit } from "@/lib/hebrew-calendar";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get all deceased from user's groups
  const { data: deceased } = await supabase
    .from("deceased")
    .select(`
      id, full_name, death_date_hebrew_day, death_date_hebrew_month,
      death_date_hebrew, relationship_label, photo_url,
      family_groups!inner (
        name,
        group_members!inner (user_id)
      )
    `)
    .eq("family_groups.group_members.user_id", user!.id);

  // Calculate all yahrzeits for the next 365 days
  const allYahrzeits = (deceased || []).map((d) => {
    const next = getNextYahrzeit(d.death_date_hebrew_day, d.death_date_hebrew_month);
    return {
      id: d.id,
      fullName: d.full_name,
      relationship: d.relationship_label,
      groupName: (d.family_groups as unknown as { name: string })?.name,
      daysUntil: next.daysUntil,
      gregorianDate: next.gregorianDate,
      hebrewDate: next.hebrewDate.hebrewString,
      shabbatEve: next.shabbatEveBefore,
    };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  // Group by month
  const byMonth: Record<string, typeof allYahrzeits> = {};
  for (const y of allYahrzeits) {
    const monthKey = y.gregorianDate.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
    });
    if (!byMonth[monthKey]) byMonth[monthKey] = [];
    byMonth[monthKey].push(y);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">לוח שנה - יארצייט</h1>

      {allYahrzeits.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>אין נפטרים רשומים</p>
          <Link
            href={`/${locale}/groups`}
            className="mt-3 inline-block text-primary hover:underline"
          >
            הוסף נפטרים
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byMonth).map(([month, yahrzeits]) => (
            <div key={month}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 pb-1 border-b border-border">
                {month}
              </h2>
              <div className="space-y-2">
                {yahrzeits.map((y) => (
                  <Link
                    key={y.id}
                    href={`/${locale}/deceased/${y.id}`}
                    className={`flex items-center gap-3 rounded-xl p-3 border transition-colors hover:border-primary ${
                      y.daysUntil === 0
                        ? "bg-primary/10 border-primary/30"
                        : y.daysUntil <= 7
                        ? "bg-card border-primary/20"
                        : "bg-card border-border"
                    }`}
                  >
                    {/* Date bubble */}
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-sm shrink-0 ${
                      y.daysUntil === 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}>
                      <span className="text-xs font-medium">
                        {y.gregorianDate.toLocaleDateString("he-IL", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {y.gregorianDate.getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{y.fullName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {y.hebrewDate}
                        {y.relationship && ` • ${y.relationship}`}
                      </p>
                      {y.shabbatEve && (
                        <p className="text-xs text-muted-foreground">
                          ערב שבת:{" "}
                          {y.shabbatEve.toLocaleDateString("he-IL", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>

                    <div className="text-end shrink-0">
                      {y.daysUntil === 0 ? (
                        <span className="text-xs font-bold text-primary">היום</span>
                      ) : y.daysUntil === 1 ? (
                        <span className="text-xs text-primary">מחר</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          עוד {y.daysUntil} ימים
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
