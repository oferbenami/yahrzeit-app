import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NewDeceasedForm } from "@/components/deceased/NewDeceasedForm";

export default async function NewDeceasedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ group?: string }>;
}) {
  const { locale } = await params;
  const { group: groupId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: groups } = await supabase
    .from("family_groups")
    .select("id, name, group_members!inner(role)")
    .eq("group_members.user_id", user!.id);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/${locale}/groups`} className="text-muted-foreground hover:text-foreground">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">הוספת נפטר</h1>
      </div>

      <NewDeceasedForm
        groups={groups?.map((g) => ({ id: g.id, name: g.name })) ?? []}
        initialGroupId={groupId}
        locale={locale}
      />
    </div>
  );
}
