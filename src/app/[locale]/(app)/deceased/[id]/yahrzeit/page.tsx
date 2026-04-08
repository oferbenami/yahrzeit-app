import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ReminderForm } from "@/components/deceased/ReminderForm";

export default async function YahrzeitPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: deceased } = await supabase
    .from("deceased")
    .select("id, full_name, death_date_hebrew, death_date_hebrew_day, death_date_hebrew_month")
    .eq("id", id)
    .single();

  if (!deceased) notFound();

  const { data: reminder } = await supabase
    .from("reminder_schedule")
    .select("*")
    .eq("deceased_id", id)
    .eq("user_id", user!.id)
    .single();

  const { data: upcomingEvents } = await supabase
    .from("yahrzeit_events")
    .select("*")
    .eq("deceased_id", id)
    .gte("yahrzeit_date_gregorian", new Date().toISOString().split("T")[0])
    .order("yahrzeit_date_gregorian")
    .limit(3);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/${locale}/deceased/${id}`} className="text-muted-foreground hover:text-foreground">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">אזכרה - {deceased.full_name}</h1>
      </div>

      {/* Upcoming yahrzeits */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h2 className="font-semibold mb-3">אזכרה קרובה</h2>
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex justify-between items-center text-sm">
                <span className="text-foreground">{event.yahrzeit_date_hebrew}</span>
                <span className="text-muted-foreground" dir="ltr">
                  {new Date(event.yahrzeit_date_gregorian).toLocaleDateString("he-IL")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminder settings */}
      <ReminderForm
        deceasedId={id}
        userId={user!.id}
        existingReminder={reminder}
      />
    </div>
  );
}
