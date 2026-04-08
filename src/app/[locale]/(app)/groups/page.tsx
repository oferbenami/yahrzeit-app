import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createGroup, joinGroup } from "@/lib/groups/actions";

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  async function createGroupAction(formData: FormData) {
    "use server";
    await createGroup(formData);
  }

  async function joinGroupAction(formData: FormData) {
    "use server";
    await joinGroup(formData);
  }

  const { data: groups } = await supabase
    .from("family_groups")
    .select(`
      *,
      group_members!inner (role),
      deceased (count)
    `)
    .eq("group_members.user_id", user!.id);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">קבוצות משפחה</h1>
      </div>

      {/* Groups list */}
      <div className="space-y-3 mb-8">
        {groups?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            אין לך קבוצות עדיין. צור קבוצה חדשה או הצטרף לקיימת.
          </p>
        )}
        {groups?.map((group) => (
          <Link
            key={group.id}
            href={`/${locale}/groups/${group.id}`}
            className="block bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">{group.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {group.group_members?.[0]?.role === "admin" ? "מנהל" : "חבר"}
                </p>
              </div>
              <svg className="w-5 h-5 text-muted-foreground rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Create group */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <h2 className="font-semibold mb-3">צור קבוצה חדשה</h2>
        <form action={createGroupAction} className="flex gap-2">
          <input
            name="name"
            type="text"
            placeholder="שם הקבוצה"
            required
            className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            צור
          </button>
        </form>
      </div>

      {/* Join group */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-3">הצטרף לקבוצה</h2>
        <form action={joinGroupAction} className="flex gap-2">
          <input
            name="invite_code"
            type="text"
            placeholder="קוד הזמנה"
            required
            className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase"
            dir="ltr"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors whitespace-nowrap"
          >
            הצטרף
          </button>
        </form>
      </div>
    </div>
  );
}
