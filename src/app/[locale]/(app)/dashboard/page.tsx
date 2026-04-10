import { createClient } from "@/lib/supabase/server";
import { getUpcomingYahrzeits } from "@/lib/hebrew-calendar";
import { StatCard } from "@/components/dashboard/StatCard";
import Link from "next/link";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Fetch all data in parallel ─────────────────────────────────────────
  const [
    { data: groups },
    { data: allDeceased },
    { data: reminders },
    { data: gatherings },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("family_groups")
      .select("id, name, group_members!inner(user_id, role)")
      .eq("group_members.user_id", user!.id),

    supabase
      .from("deceased")
      .select(`
        id, full_name, death_date_hebrew_day, death_date_hebrew_month,
        death_date_hebrew, relationship_degree,
        family_groups!deceased_group_id_fkey!inner(group_members!inner(user_id))
      `)
      .eq("family_groups.group_members.user_id", user!.id),

    supabase
      .from("reminder_schedule")
      .select("id, active, channels")
      .eq("user_id", user!.id),

    supabase
      .from("gathering_events")
      .select("id, yahrzeit_date")
      .gte("yahrzeit_date", new Date().toISOString().split("T")[0]),

    supabase
      .from("users")
      .select("full_name, created_at")
      .eq("id", user!.id)
      .single(),
  ]);

  // ── Compute stats ──────────────────────────────────────────────────────
  const totalGroups = groups?.length || 0;
  const totalDeceased = allDeceased?.length || 0;
  const activeReminders = reminders?.filter((r) => r.active).length || 0;
  const upcomingGatherings = gatherings?.length || 0;

  const upcoming30 = getUpcomingYahrzeits(allDeceased || [], 30);
  const thisWeek = upcoming30.filter((y) => y.daysUntil <= 7);
  const today = upcoming30.filter((y) => y.daysUntil === 0);

  // Channels breakdown
  const channelCounts = { email: 0, push: 0, sms: 0, whatsapp: 0 };
  for (const r of (reminders || [])) {
    if (!r.active) continue;
    for (const ch of (r.channels || [])) {
      if (ch in channelCounts) channelCounts[ch as keyof typeof channelCounts]++;
    }
  }

  // Degree breakdown
  const degreeCounts = { first: 0, second: 0, extended: 0, unknown: 0 };
  for (const d of (allDeceased || [])) {
    const deg = d.relationship_degree as keyof typeof degreeCounts || "unknown";
    if (deg in degreeCounts) degreeCounts[deg]++;
    else degreeCounts.unknown++;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">לוח בקרה</h1>
        <p className="text-muted-foreground text-sm mt-1">
          שלום {profile?.full_name?.split(" ")[0] || ""}! הנה סיכום הפעילות שלך.
        </p>
      </div>

      {/* Today banner */}
      {today.length > 0 && (
        <div className="bg-primary text-primary-foreground rounded-2xl p-5 mb-6" role="alert" aria-live="polite">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold text-lg">אזכרה היום</span>
          </div>
          <ul className="space-y-1">
            {today.map((y) => (
              <li key={y.deceasedId}>
                <Link
                  href={`/${locale}/deceased/${y.deceasedId}`}
                  className="inline-link font-semibold hover:underline"
                >
                  {y.fullName}
                </Link>
                <span className="opacity-80 text-sm mr-2">— {y.yahrzeit.hebrewDate.hebrewString}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" role="region" aria-label="סטטיסטיקות">
        <StatCard
          title="קבוצות משפחה"
          value={totalGroups}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="primary"
        />
        <StatCard
          title="נפטרים רשומים"
          value={totalDeceased}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          color="purple"
        />
        <StatCard
          title="אזכרה ב-30 יום"
          value={upcoming30.length}
          subtitle={thisWeek.length > 0 ? `${thisWeek.length} השבוע` : undefined}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="orange"
        />
        <StatCard
          title="תזכורות פעילות"
          value={activeReminders}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          color="green"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming this week */}
        <section className="bg-card border border-border rounded-xl p-5" aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className="font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            אזכרה קרובה (30 יום)
          </h2>
          {upcoming30.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">אין אזכרה קרובה</p>
          ) : (
            <ul className="space-y-2">
              {upcoming30.slice(0, 6).map((y) => (
                <li key={y.deceasedId}>
                  <Link
                    href={`/${locale}/deceased/${y.deceasedId}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-secondary group-hover:bg-primary/10 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0" aria-hidden="true">
                        {y.fullName[0]}
                      </div>
                      <span className="text-sm font-medium">{y.fullName}</span>
                    </div>
                    <span className={`text-xs font-medium ${y.daysUntil <= 7 ? "text-primary" : "text-muted-foreground"}`}>
                      {y.daysUntil === 0 ? "היום" : y.daysUntil === 1 ? "מחר" : `עוד ${y.daysUntil} ימים`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {upcoming30.length > 6 && (
            <Link href={`/${locale}/calendar`} className="inline-link mt-2 block text-sm text-primary hover:underline text-center">
              הצג הכל ({upcoming30.length})
            </Link>
          )}
        </section>

        {/* Notification channels breakdown */}
        <section className="bg-card border border-border rounded-xl p-5" aria-labelledby="channels-title">
          <h2 id="channels-title" className="font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            ערוצי התראה
          </h2>
          {activeReminders === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">אין תזכורות פעילות</p>
          ) : (
            <div className="space-y-3">
              {(Object.entries(channelCounts) as Array<[string, number]>)
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([channel, count]) => {
                  const labels: Record<string, string> = {
                    email: "אימייל",
                    push: "Push",
                    sms: "SMS",
                    whatsapp: "WhatsApp",
                  };
                  const pct = Math.round((count / activeReminders) * 100);
                  return (
                    <div key={channel}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{labels[channel] || channel}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div
                        className="h-2 bg-secondary rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${labels[channel]}: ${pct}%`}
                      >
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Upcoming gatherings count */}
          {upcomingGatherings > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{upcomingGatherings} כינוסים מתוכננים</span>
            </div>
          )}
        </section>

        {/* Relationship breakdown */}
        {totalDeceased > 0 && (
          <section className="bg-card border border-border rounded-xl p-5 md:col-span-2" aria-labelledby="relationship-title">
            <h2 id="relationship-title" className="font-semibold mb-4">
              פילוח קרבה
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: "first", label: "קרבה ראשונה", color: "bg-primary" },
                { key: "second", label: "קרבה שנייה", color: "bg-purple-500" },
                { key: "extended", label: "משפחה מורחבת", color: "bg-orange-500" },
                { key: "unknown", label: "לא מוגדר", color: "bg-muted-foreground" },
              ].map(({ key, label, color }) => {
                const count = degreeCounts[key as keyof typeof degreeCounts];
                if (count === 0) return null;
                const pct = Math.round((count / totalDeceased) * 100);
                return (
                  <div key={key} className="text-center">
                    <div
                      className={`w-16 h-16 rounded-full ${color} flex items-center justify-center text-white font-bold text-xl mx-auto mb-2`}
                      aria-hidden="true"
                    >
                      {count}
                    </div>
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
