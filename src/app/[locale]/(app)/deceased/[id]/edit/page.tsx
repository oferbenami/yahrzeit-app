import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditDeceasedForm } from "@/components/deceased/EditDeceasedForm";

export default async function EditDeceasedPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: deceased } = await supabase
    .from("deceased")
    .select("id, full_name, first_name, last_name, father_name, mother_name, relationship_label, relationship_degree, death_date_gregorian, death_date_hebrew_day, death_date_hebrew_month, birth_date_gregorian, cemetery_name, cemetery_block, cemetery_plot, cemetery_notes, cemetery_lat, cemetery_lng, photo_url, notes, group_id")
    .eq("id", id)
    .single();

  if (!deceased) notFound();

  const { data: groups } = await supabase
    .from("family_groups")
    .select("id, name, group_members!inner(role)")
    .eq("group_members.user_id", user!.id);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Link
          href={`/${locale}/deceased/${id}`}
          className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold flex-1" style={{ color: "var(--foreground)" }}>
          עריכת פרטים
        </h1>
      </div>

      <EditDeceasedForm
        deceased={deceased}
        locale={locale}
        id={id}
        groups={groups?.map((g) => ({ id: g.id, name: g.name })) ?? []}
      />
    </div>
  );
}
