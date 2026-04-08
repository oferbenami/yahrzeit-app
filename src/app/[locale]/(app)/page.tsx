import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getUpcomingYahrzeits } from "@/lib/hebrew-calendar";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userProfile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  // Get all deceased from user's groups
  const { data: deceased } = await supabase
    .from("deceased")
    .select(`
      id, full_name, death_date_hebrew_day, death_date_hebrew_month,
      photo_url, relationship_label,
      family_groups!inner (
        group_members!inner (user_id)
      )
    `)
    .eq("family_groups.group_members.user_id", user!.id);

  const upcomingYahrzeits = getUpcomingYahrzeits(deceased || [], 60);

  const todayYahrzeits = upcomingYahrzeits.filter((y) => y.daysUntil === 0);
  const thisWeek = upcomingYahrzeits.filter((y) => y.daysUntil > 0 && y.daysUntil <= 7);
  const upcoming = upcomingYahrzeits.filter((y) => y.daysUntil > 7);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          שלום, {userProfile?.full_name?.split(" ")[0] || ""}
        </h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("he-IL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Today's yahrzeits */}
      {todayYahrzeits.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 mb-4">
          <h2 className="font-semibold text-primary mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            אזכרה היום
          </h2>
          <div className="space-y-3">
            {todayYahrzeits.map((y) => (
              <Link
                key={y.deceasedId}
                href={`/${locale}/deceased/${y.deceasedId}`}
                className="flex items-center gap-3 bg-white/50 dark:bg-white/5 rounded-lg p-3 hover:bg-white/70 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {y.fullName[0]}
                </div>
                <div>
                  <p className="font-semibold">{y.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {y.yahrzeit.hebrewDate.hebrewString}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* This week */}
      {thisWeek.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h2 className="font-semibold mb-3">השבוע הקרוב</h2>
          <div className="space-y-2">
            {thisWeek.map((y) => (
              <Link
                key={y.deceasedId}
                href={`/${locale}/deceased/${y.deceasedId}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {y.fullName[0]}
                  </div>
                  <span className="font-medium text-sm">{y.fullName}</span>
                </div>
                <div className="text-end">
                  <p className="text-sm text-primary font-medium">
                    בעוד {y.daysUntil} {y.daysUntil === 1 ? "יום" : "ימים"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {y.yahrzeit.gregorianDate.toLocaleDateString("he-IL", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming (8-60 days) */}
      {upcoming.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h2 className="font-semibold mb-3">קרוב לבוא</h2>
          <div className="space-y-2">
            {upcoming.slice(0, 5).map((y) => (
              <Link
                key={y.deceasedId}
                href={`/${locale}/deceased/${y.deceasedId}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {y.fullName[0]}
                  </div>
                  <span className="text-sm">{y.fullName}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {y.yahrzeit.gregorianDate.toLocaleDateString("he-IL", {
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
          <Link
            href={`/${locale}/calendar`}
            className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline"
          >
            הצג הכל בלוח שנה
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Empty state */}
      {upcomingYahrzeits.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-lg font-medium mb-2">אין אזכרה קרובה</p>
          <p className="text-sm mb-4">הוסף נפטרים כדי לעקוב אחרי אזכרה</p>
          <Link
            href={`/${locale}/groups`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            צור קבוצה משפחתית
          </Link>
        </div>
      )}
    </div>
  );
}
