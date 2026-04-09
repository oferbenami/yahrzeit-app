import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InviteCodeCard } from "@/components/groups/InviteCodeCard";
import { GroupPhotoUpload } from "@/components/groups/GroupPhotoUpload";

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  boxShadow: "0 2px 10px rgba(184,134,11,0.07)",
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: group } = await supabase
    .from("family_groups")
    .select(`
      *,
      group_members(id, role, joined_at, users:user_id(id, full_name, email))
    `)
    .eq("id", id)
    .single();

  if (!group) notFound();

  const myMembership = group.group_members?.find(
    (m: { users?: { id: string } }) => m.users?.id === user!.id
  );
  if (!myMembership) notFound();

  const isAdmin = myMembership.role === "admin";

  // Get deceased in this group (via junction table)
  const { data: deceasedLinks } = await supabase
    .from("deceased_groups")
    .select(`
      deceased:deceased_id(id, full_name, death_date_hebrew, relationship_label, photo_url)
    `)
    .eq("group_id", id);

  type DeceasedRow = { id: string; full_name: string; death_date_hebrew: string; relationship_label?: string; photo_url?: string };
  const deceasedList: DeceasedRow[] = (deceasedLinks ?? [])
    .map((link: { deceased: DeceasedRow | DeceasedRow[] | null }) => {
      const d = link.deceased;
      if (!d) return null;
      return Array.isArray(d) ? d[0] : d;
    })
    .filter((d): d is DeceasedRow => !!d);

  // Also include deceased with group_id = id (legacy / primary group)
  const { data: legacyDeceased } = await supabase
    .from("deceased")
    .select("id, full_name, death_date_hebrew, relationship_label, photo_url")
    .eq("group_id", id)
    .order("full_name");

  // Merge, deduplicate by id
  const allDeceasedMap = new Map<string, typeof deceasedList[0]>();
  for (const d of legacyDeceased ?? []) allDeceasedMap.set(d.id, d);
  for (const d of deceasedList) if (d) allDeceasedMap.set(d.id, d);
  const mergedDeceased = Array.from(allDeceasedMap.values()).sort((a, b) => a.full_name.localeCompare(b.full_name, "he"));

  const memberCount = group.group_members?.length ?? 0;
  const deceasedCount = mergedDeceased.length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Link href={`/${locale}/groups`} className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold flex-1 truncate" style={{ color: "var(--foreground)" }}>{group.name}</h1>
      </div>

      {/* Group profile card */}
      <div className="p-5 mb-4" style={cardStyle}>
        <GroupPhotoUpload
          groupId={id}
          groupName={group.name}
          currentPhotoUrl={group.photo_url}
        />
        {/* Stats */}
        <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex-1 text-center rounded-xl py-3" style={{ background: "var(--muted)" }}>
            <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{deceasedCount}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>נפטרים</p>
          </div>
          <div className="flex-1 text-center rounded-xl py-3" style={{ background: "var(--muted)" }}>
            <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{memberCount}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>חברים</p>
          </div>
        </div>
      </div>

      {/* Invite code */}
      {isAdmin && (
        <div className="mb-4">
          <InviteCodeCard groupId={id} inviteCode={group.invite_code} groupName={group.name} />
        </div>
      )}

      {/* Deceased list */}
      <div className="mb-5" style={cardStyle}>
        <div className="flex items-center justify-between p-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
            נפטרים ({deceasedCount})
          </h2>
          <Link
            href={`/${locale}/deceased/new?group=${id}`}
            className="inline-link flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white"
            style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            הוסף נפטר
          </Link>
        </div>

        {mergedDeceased.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: "var(--muted-foreground)" }}>לא נוספו נפטרים עדיין</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {mergedDeceased.map((d) => (
              <Link
                key={d.id}
                href={`/${locale}/deceased/${d.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-all hover:opacity-80"
                style={{ background: "var(--card)" }}
              >
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-base font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
                >
                  {d.photo_url ? (
                    <img src={d.photo_url} alt={d.full_name} className="w-full h-full object-cover" />
                  ) : d.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{d.full_name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                    {d.relationship_label && `${d.relationship_label} • `}
                    {d.death_date_hebrew}
                  </p>
                </div>
                <svg className="w-4 h-4 rotate-180 shrink-0" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Members list */}
      <div style={cardStyle}>
        <div className="p-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>חברים ({memberCount})</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {group.group_members?.map((member: {
            id: string;
            role: string;
            users?: { id: string; full_name?: string; email: string };
          }) => (
            <div key={member.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: member.role === "admin" ? "linear-gradient(135deg, #c9a84c, #8b6010)" : "var(--muted)" }}
                >
                  <span style={{ color: member.role === "admin" ? "white" : "var(--muted-foreground)" }}>
                    {(member.users?.full_name?.[0] || member.users?.email[0] || "?").toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                    {member.users?.full_name || member.users?.email}
                  </p>
                  {member.users?.full_name && (
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{member.users.email}</p>
                  )}
                </div>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={member.role === "admin"
                  ? { background: "linear-gradient(135deg, #fff8e8, #fef3d0)", color: "#b8860b", border: "1px solid #c9a84c50" }
                  : { background: "var(--secondary)", color: "var(--muted-foreground)" }}
              >
                {member.role === "admin" ? "מנהל" : "חבר"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
