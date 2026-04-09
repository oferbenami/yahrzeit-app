import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CreateGroupForm, JoinGroupForm } from "@/components/groups/CreateGroupForm";

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: groups } = await supabase
    .from("family_groups")
    .select(`*, group_members!inner(role), deceased(count)`)
    .eq("group_members.user_id", user!.id);

  const cardStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "1rem",
    boxShadow: "0 2px 12px rgba(184,134,11,0.07)",
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>קבוצות משפחה</h1>
        <div className="h-px mt-3" style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }} />
      </div>

      {/* Groups list */}
      <div className="space-y-3 mb-8">
        {groups?.length === 0 && (
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
        {groups?.map((group) => (
          <Link
            key={group.id}
            href={`/${locale}/groups/${group.id}`}
            className="flex items-center justify-between p-4 transition-all hover:opacity-90"
            style={{
              ...cardStyle,
              boxShadow: "0 2px 12px rgba(184,134,11,0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
              >
                {group.name[0]}
              </div>
              <div>
                <h2 className="font-semibold text-sm">{group.name}</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  {group.group_members?.[0]?.role === "admin" ? "מנהל" : "חבר"}
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 rotate-180" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Create group */}
      <div className="p-5 mb-4" style={cardStyle}>
        <h2 className="font-bold mb-3 text-sm flex items-center gap-2" style={{ color: "var(--foreground)" }}>
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
        <h2 className="font-bold mb-3 text-sm flex items-center gap-2" style={{ color: "var(--foreground)" }}>
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
