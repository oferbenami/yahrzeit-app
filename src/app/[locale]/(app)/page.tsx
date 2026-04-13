import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { getUpcomingYahrzeits } from "@/lib/hebrew-calendar";
import { gregorianToHebrew } from "@/lib/hebrew-calendar";
import { getUpcomingHolidays } from "@/lib/holidays";
import { StatCard } from "@/components/dashboard/StatCard";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { ShareAppButton } from "@/components/ui/ShareAppButton";
import { TodayReminderModal } from "@/components/ui/TodayReminderModal";

function CandleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2c0 0-2 2-2 4s2 2 2 2 2-2 2-2-2-4-2-4z" fill="currentColor" opacity={0.6} />
      <rect x="9" y="8" width="6" height="14" rx="1" />
    </svg>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get the group IDs this user belongs to (admin bypasses recursive RLS)
  const { data: userMemberships } = await admin
    .from("group_members")
    .select("group_id")
    .eq("user_id", user!.id);
  const userGroupIds = (userMemberships ?? []).map((m) => m.group_id);

  const [
    { data: userProfile },
    { data: groups },
    { data: deceased },
    { data: reminders },
    { data: gatherings },
  ] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user!.id).single(),

    // Use admin to bypass recursive group_members RLS
    userGroupIds.length > 0
      ? admin.from("family_groups").select("id, name").in("id", userGroupIds)
      : Promise.resolve({ data: [] }),

    // Use admin to bypass deceased → group_members recursion
    userGroupIds.length > 0
      ? admin
          .from("deceased")
          .select("id, full_name, death_date_hebrew_day, death_date_hebrew_month, death_date_hebrew, photo_url, relationship_label, relationship_degree")
          .in("group_id", userGroupIds)
      : Promise.resolve({ data: [] }),

    supabase
      .from("reminder_schedule")
      .select("id, active")
      .eq("user_id", user!.id),

    supabase
      .from("gathering_events")
      .select("id")
      .gte("yahrzeit_date", new Date().toISOString().split("T")[0]),
  ]);

  const firstGroupId = groups?.[0]?.id;
  // If user has exactly 1 group, link directly to it; otherwise go to the list
  const groupsHref =
    groups?.length === 1
      ? `/${locale}/groups/${firstGroupId}`
      : `/${locale}/groups`;
  const upcomingYahrzeits = getUpcomingYahrzeits(deceased || [], 60);
  const todayYahrzeits = upcomingYahrzeits.filter((y) => y.daysUntil === 0);
  const thisWeek = upcomingYahrzeits.filter((y) => y.daysUntil > 0 && y.daysUntil <= 7);
  const upcoming = upcomingYahrzeits.filter((y) => y.daysUntil > 7);

  const upcoming30 = getUpcomingYahrzeits(deceased || [], 30);

  // Modal: today (daysUntil=0) and tonight (daysUntil=1, starts this evening)
  const modalYahrzeits = upcomingYahrzeits
    .filter((y) => y.daysUntil === 0 || y.daysUntil === 1)
    .map((y) => ({
      deceasedId: y.deceasedId,
      fullName: y.fullName,
      hebrewDate: y.yahrzeit.hebrewDate.hebrewString,
      daysUntil: y.daysUntil,
    }));

  const now = Date.now();
  const modalHolidays = getUpcomingHolidays()
    .map((h) => ({
      ...h,
      daysUntil: Math.ceil((h.gregorianTimestamp - now) / (1000 * 60 * 60 * 24)),
    }))
    .filter((h) => h.daysUntil === 0 || h.daysUntil === 1)
    .map((h) => ({
      name: h.name,
      description: h.description,
      types: h.types as string[],
      daysUntil: h.daysUntil,
    }));

  const activeReminders = reminders?.filter((r) => r.active).length || 0;
  const upcomingGatherings = gatherings?.length || 0;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const hebrewToday = gregorianToHebrew(today);
  const firstName = userProfile?.full_name?.split(" ")[0] || "";

  const cardStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "1rem",
    boxShadow: "0 2px 12px rgba(184,134,11,0.08)",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <TodayReminderModal
        yahrzeits={modalYahrzeits}
        holidays={modalHolidays}
        locale={locale}
        todayStr={todayStr}
      />
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              שלום{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {today.toLocaleDateString("he-IL", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--primary)" }}>
              {hebrewToday.hebrewString}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {firstGroupId && (
              <Link
                href={`/${locale}/deceased/new?group=${firstGroupId}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all"
                style={{ background: "linear-gradient(135deg, #c9a84c 0%, #8b6010 100%)", boxShadow: "0 3px 10px rgba(184,134,11,0.3)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                הוסף נפטר
              </Link>
            )}
            <ShareAppButton />
            <LogoutButton locale={locale} />
          </div>
        </div>
        <div className="h-px mt-4" style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in-up" role="region" aria-label="סטטיסטיקות">
        <StatCard
          title="קבוצות משפחה"
          value={groups?.length || 0}
          href={groupsHref}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 116 0z" />
            </svg>
          }
          color="primary"
        />
        <StatCard
          title="נפטרים רשומים"
          value={deceased?.length || 0}
          href={`/${locale}/deceased`}
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
          href={`/${locale}/calendar`}
          subtitle={upcoming30.filter((y) => y.daysUntil <= 7).length > 0
            ? `${upcoming30.filter((y) => y.daysUntil <= 7).length} השבוע`
            : undefined}
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
          href={`/${locale}/profile`}
          subtitle={upcomingGatherings > 0 ? `${upcomingGatherings} כינוסים` : undefined}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          color="green"
        />
      </div>

      {/* Today's yahrzeits */}
      {todayYahrzeits.length > 0 && (
        <div
          className="p-5 mb-4 animate-fade-in-up"
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, #fff8e8 0%, #fef3d0 100%)",
            border: "1px solid #c9a84c60",
            boxShadow: "0 4px 20px rgba(184,134,11,0.15)",
          }}
        >
          <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: "#b8860b" }}>
            <CandleIcon />
            אזכרה היום
          </h2>
          <div className="space-y-3">
            {todayYahrzeits.map((y) => (
              <Link
                key={y.deceasedId}
                href={`/${locale}/deceased/${y.deceasedId}`}
                className="flex items-center gap-3 rounded-xl p-3 transition-all"
                style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #e0caa0" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
                >
                  {y.fullName[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm">{y.fullName} ז״ל</p>
                  <p className="text-xs" style={{ color: "#8b6a4f" }}>{y.yahrzeit.hebrewDate.hebrewString}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* This week */}
      {thisWeek.length > 0 && (
        <div className="p-5 mb-4 animate-fade-in-up" style={cardStyle}>
          <h2 className="font-bold mb-3 text-sm flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <svg className="w-4 h-4" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            השבוע הקרוב
          </h2>
          <div className="space-y-1">
            {thisWeek.map((y) => (
              <Link
                key={y.deceasedId}
                href={`/${locale}/deceased/${y.deceasedId}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
                style={{ background: "var(--muted)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #c9a84c80, #8b601080)" }}
                  >
                    {y.fullName[0]}
                  </div>
                  <span className="font-medium text-sm">{y.fullName} ז״ל</span>
                </div>
                <div className="text-end">
                  <p className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                    בעוד {y.daysUntil} {y.daysUntil === 1 ? "יום" : "ימים"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {y.yahrzeit.gregorianDate.toLocaleDateString("he-IL", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="p-5 mb-4 animate-fade-in-up" style={cardStyle}>
          <h2 className="font-bold mb-3 text-sm" style={{ color: "var(--foreground)" }}>קרוב לבוא</h2>
          <div className="space-y-1">
            {upcoming.slice(0, 5).map((y) => (
              <Link
                key={y.deceasedId}
                href={`/${locale}/deceased/${y.deceasedId}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg transition-all hover:opacity-80"
                style={{ background: "var(--muted)" }}
              >
                <span className="text-sm font-medium">{y.fullName} ז״ל</span>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {y.yahrzeit.gregorianDate.toLocaleDateString("he-IL", { month: "long", day: "numeric" })}
                </p>
              </Link>
            ))}
          </div>
          <Link
            href={`/${locale}/calendar`}
            className="mt-3 flex items-center gap-1 text-xs font-semibold hover:underline"
            style={{ color: "var(--primary)" }}
          >
            הצג הכל בלוח שנה
            <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Empty state */}
      {upcomingYahrzeits.length === 0 && (
        <div className="text-center py-14 animate-fade-in-up">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #f5e9d4, #e0caa0)" }}
          >
            <svg className="w-10 h-10" style={{ color: "#c9a84c" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-lg font-bold mb-1" style={{ color: "var(--foreground)" }}>אין אזכרה קרובה</p>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>הוסף נפטרים כדי לעקוב אחרי אזכרות</p>
          {!firstGroupId && (
            <Link
              href={`/${locale}/groups`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)", boxShadow: "0 4px 14px rgba(184,134,11,0.35)" }}
            >
              צור קבוצה משפחתית
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
