import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InviteCodeCard } from "@/components/groups/InviteCodeCard";

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
      group_members (
        id, role, joined_at,
        users: user_id (id, full_name, email)
      )
    `)
    .eq("id", id)
    .single();

  if (!group) notFound();

  // Check if user is member
  const myMembership = group.group_members?.find(
    (m: { users?: { id: string } }) => m.users?.id === user!.id
  );
  if (!myMembership) notFound();

  const isAdmin = myMembership.role === "admin";

  const { data: deceasedList } = await supabase
    .from("deceased")
    .select("id, full_name, death_date_hebrew, relationship_label, photo_url")
    .eq("group_id", id)
    .order("full_name");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/${locale}/groups`} className="text-muted-foreground hover:text-foreground">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">{group.name}</h1>
      </div>

      {/* Invite code */}
      {isAdmin && (
        <InviteCodeCard groupId={id} inviteCode={group.invite_code} />
      )}

      {/* Deceased list */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">נפטרים</h2>
          <Link
            href={`/${locale}/deceased/new?group=${id}`}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            הוסף נפטר
          </Link>
        </div>

        {deceasedList?.length === 0 ? (
          <p className="text-muted-foreground text-center py-6 bg-card rounded-xl border border-border">
            לא נוספו נפטרים עדיין
          </p>
        ) : (
          <div className="space-y-2">
            {deceasedList?.map((d) => (
              <Link
                key={d.id}
                href={`/${locale}/deceased/${d.id}`}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground overflow-hidden">
                  {d.photo_url ? (
                    <img src={d.photo_url} alt={d.full_name} className="w-full h-full object-cover" />
                  ) : (
                    d.full_name[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{d.full_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {d.relationship_label && `${d.relationship_label} • `}
                    {d.death_date_hebrew}
                  </p>
                </div>
                <svg className="w-4 h-4 text-muted-foreground rotate-180 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Members */}
      <div>
        <h2 className="font-semibold text-lg mb-3">חברים ({group.group_members?.length})</h2>
        <div className="space-y-2">
          {group.group_members?.map((member: {
            id: string;
            role: string;
            users?: { id: string; full_name?: string; email: string };
          }) => (
            <div
              key={member.id}
              className="flex items-center justify-between bg-card border border-border rounded-xl p-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {member.users?.full_name?.[0] || member.users?.email[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{member.users?.full_name || member.users?.email}</p>
                  <p className="text-xs text-muted-foreground">{member.users?.email}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                member.role === "admin"
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}>
                {member.role === "admin" ? "מנהל" : "חבר"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
