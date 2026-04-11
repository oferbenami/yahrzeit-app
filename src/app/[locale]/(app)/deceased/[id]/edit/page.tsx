import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditDeceasedForm } from "@/components/deceased/EditDeceasedForm";

export default async function EditDeceasedPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const { data: deceased } = await supabase
    .from("deceased")
    .select("*")
    .eq("id", id)
    .single();

  if (!deceased) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
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

      <EditDeceasedForm deceased={deceased} locale={locale} id={id} />
    </div>
  );
}
