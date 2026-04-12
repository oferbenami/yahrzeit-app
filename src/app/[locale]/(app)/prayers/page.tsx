import { createClient } from "@/lib/supabase/server";
import { PrayersClient } from "@/components/prayers/PrayersClient";

export default async function PrayersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("prayer_nusach")
    .eq("id", user!.id)
    .single();

  const defaultNusach =
    (profile?.prayer_nusach as "sephardi" | "mizrahi" | "ashkenaz") ?? "sephardi";

  return <PrayersClient defaultNusach={defaultNusach} locale={locale} />;
}
