import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNextYahrzeit } from "@/lib/hebrew-calendar";
import { GatheringForm } from "@/components/gathering/GatheringForm";
import { GatheringCard } from "@/components/gathering/GatheringCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function GatheringPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: deceased } = await supabase
    .from("deceased")
    .select("id, full_name, death_date_hebrew_day, death_date_hebrew_month, death_date_hebrew, group_id")
    .eq("id", id)
    .single();

  if (!deceased) notFound();

  // Check membership + role
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", deceased.group_id)
    .eq("user_id", user!.id)
    .single();

  if (!membership) notFound();

  const isAdmin = membership.role === "admin";

  // Get upcoming yahrzeits for this deceased
  const nextYahrzeit = getNextYahrzeit(
    deceased.death_date_hebrew_day,
    deceased.death_date_hebrew_month
  );

  // Get existing gatherings (next 2 years)
  const twoYearsLater = new Date();
  twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);

  const { data: gatherings } = await supabase
    .from("gathering_events")
    .select("*")
    .eq("deceased_id", id)
    .gte("yahrzeit_date", new Date().toISOString().split("T")[0])
    .lte("yahrzeit_date", twoYearsLater.toISOString().split("T")[0])
    .order("yahrzeit_date");

  // Check if there's already a gathering for the next yahrzeit
  const nextYahrzeitStr = nextYahrzeit.gregorianDate.toISOString().split("T")[0];
  const existingForNext = gatherings?.find((g) => g.yahrzeit_date === nextYahrzeitStr);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href={`/${locale}/deceased/${id}`}
          className="text-muted-foreground hover:text-foreground"
          aria-label="חזור לדף הנפטר"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">
          כינוס משפחתי — {deceased.full_name}
        </h1>
      </div>

      {/* Add gathering form */}
      {!existingForNext && (
        <section className="bg-card border border-border rounded-xl p-5 mb-6" aria-labelledby="add-gathering-title">
          <h2 id="add-gathering-title" className="font-semibold mb-4">
            תכנן כינוס לאזכרה הקרובה
          </h2>
          <GatheringForm
            deceasedId={id}
            yahrzeitDate={nextYahrzeitStr}
            yahrzeitDateHebrew={nextYahrzeit.hebrewDate.hebrewString}
          />
        </section>
      )}

      {/* Gatherings list */}
      <section aria-labelledby="gatherings-title">
        <h2 id="gatherings-title" className="font-semibold text-lg mb-3">
          כינוסים מתוכננים
        </h2>

        {gatherings?.length === 0 ? (
          <EmptyState
            title="אין כינוסים מתוכננים"
            description="תכנן כינוס משפחתי לאזכרה הקרובה"
            icon={
              <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        ) : (
          <div className="space-y-3">
            {gatherings!.map((gathering) => (
              <GatheringCard
                key={gathering.id}
                gathering={gathering}
                yahrzeitDateHebrew={nextYahrzeit.hebrewDate.hebrewString}
                deceasedId={id}
                deceasedName={deceased.full_name}
                canEdit={isAdmin || gathering.created_by === user!.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
