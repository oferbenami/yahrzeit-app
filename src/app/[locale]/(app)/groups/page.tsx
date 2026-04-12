import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { CreateGroupForm, JoinGroupForm } from "@/components/groups/CreateGroupForm";
import { getNextYahrzeit } from "@/lib/hebrew-calendar";

type DeceasedForYahrzeit = {
  id: string;
  full_name: string;
  death_date_hebrew_day: number;
  death_date_hebrew_month: number;
};

type NextYahrzeit = {
  name: string;
  daysUntil: number;
  hebrewDate: string;
};

type GroupWithDetails = {
  id: string;
  name: string;
  photo_url?: string | null;
  role: string;
  memberCount: number;
  deceasedCount: number;
  nextYahrzeit: NextYahrzeit | null;
};

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  boxShadow: "0 2px 12px rgba(184,134,11,0.07)",
};

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Step 1a: get memberships via group_members table
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", user!.id);

  // Step 1b: fallback — also include groups the user created (handles missing member rows)
  const { data: ownedGroups } = await supabase
    .from("family_groups")
    .select("id")
    .eq("created_by", user!.id);

  // Merge: membership rows take precedence, owned groups fill gaps
  const roleMap = new Map<string, string>(memberships?.map((m) => [m.group_id, m.role]) ?? []);
  for (const g of ownedGroups ?? []) {
    if (!roleMap.has(g.id)) roleMap.set(g.id, "admin");
  }
  const groupIds = Array.from(roleMap.keys());

  let enrichedGroups: GroupWithDetails[] = [];

  if (groupIds.length > 0) {
    // Step 2: use admin client (bypasses recursive RLS on group_members/deceased)
    const admin = createAdminClient();

    const [
      { data: rawGroups },
      { data: allMembers },
      { data: allDeceased },
    ] = await Promise.all([
      // Basic group info — no nested joins to avoid RLS recursion
      supabase.from("family_groups").select("id, name, photo_url").in("id", groupIds),
      // Member counts via admin (bypasses recursive group_members policy)
      admin.from("group_members").select("group_id").in("group_id", groupIds),
      // Deceased via admin (bypasses deceased → group_members recursion)
      admin
        .from("deceased")
        .select("id, group_id, full_name, death_date_hebrew_day, death_date_hebrew_month")
        .in("group_id", groupIds),
    ]);

    enrichedGroups = (rawGroups ?? []).map((g) => {
      const memberCount = (allMembers ?? []).filter((m) => m.group_id === g.id).length;
      const deceasedList = ((allDeceased ?? []).filter((d) => d.group_id === g.id)) as DeceasedForYahrzeit[];

      // Find the soonest yahrzeit across all deceased in this group
      let nextYahrzeit: NextYahrzeit | null = null;
      let minDays = Infinity;
      for (const d of deceasedList) {
        if (!d.death_date_hebrew_day || !d.death_date_hebrew_month) continue;
        try {
          const yInfo = getNextYahrzeit(d.death_date_hebrew_day, d.death_date_hebrew_month);
          if (yInfo.daysUntil < minDays) {
            minDays = yInfo.daysUntil;
            nextYahrzeit = {
              name: d.full_name,
              daysUntil: yInfo.daysUntil,
              hebrewDate: yInfo.hebrewDate.hebrewString,
            };
          }
        } catch {
          // skip deceased with invalid dates
        }
      }

      return {
        id: g.id,
        name: g.name,
        photo_url: g.photo_url,
        role: roleMap.get(g.id) ?? "member",
        memberCount,
        deceasedCount: deceasedList.length,
        // Only surface yahrzeit if within 30 days
        nextYahrzeit: nextYahrzeit && nextYahrzeit.daysUntil <= 30 ? nextYahrzeit : null,
      };
    });

    // Sort: active (upcoming ≤ 30 days, closest first) → then alphabetically
    enrichedGroups.sort((a, b) => {
      if (a.nextYahrzeit && !b.nextYahrzeit) return -1;
      if (!a.nextYahrzeit && b.nextYahrzeit) return 1;
      if (a.nextYahrzeit && b.nextYahrzeit) {
        return a.nextYahrzeit.daysUntil - b.nextYahrzeit.daysUntil;
      }
      return a.name.localeCompare(b.name, "he");
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          קבוצות משפחה
        </h1>
        <div
          className="h-px mt-3"
          style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }}
        />
      </div>

      {/* Groups list */}
      <div className="space-y-3 mb-8">
        {enrichedGroups.length === 0 && (
          <div className="text-center py-10" style={{ color: "var(--muted-foreground)" }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--muted)" }}
            >
              <svg className="w-8 h-8" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-medium">אין לך קבוצות עדיין</p>
            <p className="text-sm mt-1">צור קבוצה חדשה או הצטרף לקיימת</p>
          </div>
        )}

        {enrichedGroups.map((group) => (
          <Link
            key={group.id}
            href={`/${locale}/groups/${group.id}`}
            className="block transition-all hover:opacity-90"
            style={{
              ...cardStyle,
              border: group.nextYahrzeit
                ? "1px solid #c9a84c70"
                : "1px solid var(--border)",
            }}
          >
            {/* Main row */}
            <div className="flex items-center gap-3 p-4" style={{ paddingBottom: group.nextYahrzeit ? "0.75rem" : "1rem" }}>
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-lg font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
              >
                {group.photo_url ? (
                  <img src={group.photo_url} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  group.name[0]
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>
                    {group.name}
                  </h2>
                  {/* Active dot for groups with upcoming yahrzeit */}
                  {group.nextYahrzeit && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: "#c9a84c" }}
                    />
                  )}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={
                      group.role === "admin"
                        ? { background: "#fff3d0", color: "#8b6010" }
                        : { background: "var(--secondary)", color: "var(--muted-foreground)" }
                    }
                  >
                    {group.role === "admin" ? "מנהל" : "חבר"}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>•</span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {group.deceasedCount} נפטרים
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>•</span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {group.memberCount} חברים
                  </span>
                </div>
              </div>

              <svg
                className="w-5 h-5 rotate-180 shrink-0"
                style={{ color: "var(--primary)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Upcoming yahrzeit bar */}
            {group.nextYahrzeit && (
              <div className="px-4 pb-3">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "linear-gradient(135deg, #fff8e8, #fef3d0)" }}
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: "#b8860b" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-medium" style={{ color: "#8b6010" }}>
                    {group.nextYahrzeit.daysUntil === 0
                      ? `יום השנה של ${group.nextYahrzeit.name} ז״ל — היום`
                      : group.nextYahrzeit.daysUntil === 1
                        ? `יום השנה של ${group.nextYahrzeit.name} ז״ל — מחר`
                        : `יום השנה של ${group.nextYahrzeit.name} ז״ל — בעוד ${group.nextYahrzeit.daysUntil} ימים`}
                  </p>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Create group */}
      <div className="p-5 mb-4" style={cardStyle}>
        <h2
          className="font-bold mb-3 text-sm flex items-center gap-2"
          style={{ color: "var(--foreground)" }}
        >
          <span
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #c9a84c30, #c9a84c10)" }}
          >
            <svg className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </span>
          צור קבוצה חדשה
        </h2>
        <CreateGroupForm />
      </div>

      {/* Join group */}
      <div className="p-5" style={cardStyle}>
        <h2
          className="font-bold mb-3 text-sm flex items-center gap-2"
          style={{ color: "var(--foreground)" }}
        >
          <span
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #c9a84c30, #c9a84c10)" }}
          >
            <svg className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </span>
          הצטרף לקבוצה
        </h2>
        <JoinGroupForm />
      </div>
    </div>
  );
}
