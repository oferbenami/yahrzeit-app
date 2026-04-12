import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNextYahrzeit } from "@/lib/hebrew-calendar";
import { CalendarClient } from "@/components/calendar/CalendarClient";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get the user's group IDs (admin bypasses recursive RLS)
  const { data: userMemberships } = await admin
    .from("group_members")
    .select("group_id")
    .eq("user_id", user!.id);
  const userGroupIds = (userMemberships ?? []).map((m) => m.group_id);

  if (userGroupIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto overflow-x-hidden">
        <div className="mb-5">
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>לוח שנה — אזכרות</h1>
          <div className="h-px mt-3" style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }} />
        </div>
        <CalendarClient items={[]} groups={[]} locale={locale} />
      </div>
    );
  }

  const [{ data: deceased }, { data: groups }] = await Promise.all([
    admin
      .from("deceased")
      .select("id, full_name, death_date_hebrew_day, death_date_hebrew_month, death_date_hebrew, death_date_gregorian, relationship_label, relationship_degree, photo_url, group_id")
      .in("group_id", userGroupIds),
    admin
      .from("family_groups")
      .select("id, name")
      .in("id", userGroupIds),
  ]);

  const groupMap = new Map((groups ?? []).map((g) => [g.id, g.name as string]));

  const allYahrzeits = (deceased || [])
    .map((d) => {
      try {
        const next = getNextYahrzeit(d.death_date_hebrew_day, d.death_date_hebrew_month);
        const gd = next.gregorianDate;
        const dd = String(gd.getDate()).padStart(2, "0");
        const mm = String(gd.getMonth() + 1).padStart(2, "0");
        const yyyy = gd.getFullYear();

        const deathYear = d.death_date_gregorian
          ? parseInt((d.death_date_gregorian as string).split("-")[0])
          : null;
        const yearsElapsed = deathYear ? yyyy - deathYear : null;

        let shabbatEveFormatted: string | null = null;
        if (next.shabbatEveBefore) {
          const s = next.shabbatEveBefore;
          shabbatEveFormatted = `${String(s.getDate()).padStart(2, "0")}/${String(s.getMonth() + 1).padStart(2, "0")}/${s.getFullYear()}`;
        }

        return {
          id: d.id,
          fullName: d.full_name,
          photoUrl: d.photo_url as string | null,
          relationship: d.relationship_label as string | null,
          groupId: d.group_id as string,
          groupName: groupMap.get(d.group_id) ?? null,
          relationshipDegree: (d.relationship_degree as "first" | "second" | "extended" | null) ?? null,
          daysUntil: next.daysUntil,
          gregorianDay: gd.getDate(),
          gregorianMonthShort: gd.toLocaleDateString("he-IL", { month: "short" }),
          gregorianMonthLabel: gd.toLocaleDateString("he-IL", { year: "numeric", month: "long" }),
          gregorianFormatted: `${dd}/${mm}/${yyyy}`,
          hebrewDate: next.hebrewDate.hebrewString,
          shabbatEveFormatted,
          yearsElapsed,
          isToday: next.daysUntil === 0,
          isSoon: next.daysUntil <= 7,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a!.daysUntil - b!.daysUntil) as NonNullable<ReturnType<typeof getNextYahrzeit> extends never ? never : {
      id: string; fullName: string; photoUrl: string | null; relationship: string | null;
      groupId: string; groupName: string | null; relationshipDegree: "first" | "second" | "extended" | null;
      daysUntil: number; gregorianDay: number; gregorianMonthShort: string;
      gregorianMonthLabel: string; gregorianFormatted: string; hebrewDate: string;
      shabbatEveFormatted: string | null; yearsElapsed: number | null;
      isToday: boolean; isSoon: boolean;
    }>[];

  const groupsForFilter = (groups ?? []).map((g) => ({ id: g.id, name: g.name as string }));

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>לוח שנה — אזכרות</h1>
        <div className="h-px mt-3" style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }} />
      </div>

      <CalendarClient items={allYahrzeits as never} groups={groupsForFilter} locale={locale} />
    </div>
  );
}
