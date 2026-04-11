import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { DeceasedList } from "@/components/deceased/DeceasedList";

export default async function DeceasedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's group IDs
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, family_groups(id, name)")
    .eq("user_id", user!.id);

  const groupIds = (memberships ?? []).map((m) => m.group_id);
  const groupMap = new Map(
    (memberships ?? []).map((m) => [
      m.group_id,
      (m.family_groups as unknown as { id: string; name: string } | null),
    ])
  );

  let deceased: {
    id: string;
    full_name: string;
    photo_url: string | null;
    death_date_hebrew: string | null;
    death_date_gregorian: string | null;
    relationship_label: string | null;
    cemetery_name: string | null;
    group_id: string;
    groupName: string;
  }[] = [];

  if (groupIds.length > 0) {
    const { data } = await supabase
      .from("deceased")
      .select("id, full_name, photo_url, death_date_hebrew, death_date_gregorian, relationship_label, cemetery_name, group_id")
      .in("group_id", groupIds)
      .order("full_name");

    deceased = (data ?? []).map((d) => ({
      ...d,
      groupName: groupMap.get(d.group_id)?.name ?? "",
    }));
  }

  const firstGroupId = groupIds[0];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>נפטרים</h1>
          {deceased.length > 0 && (
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {deceased.length} נפטרים
            </p>
          )}
        </div>
        {firstGroupId && (
          <Link
            href={`/${locale}/deceased/new?group=${firstGroupId}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)", boxShadow: "0 3px 10px rgba(184,134,11,0.3)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            הוסף
          </Link>
        )}
      </div>
      <div className="h-px mb-5" style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }} />

      <DeceasedList deceased={deceased} locale={locale} />
    </div>
  );
}
