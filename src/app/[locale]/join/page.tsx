import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

const APP_URL = "https://yzcor-reminder-community-app.vercel.app";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { locale } = await params;
  const { code } = await searchParams;

  const upperCode = code?.toUpperCase().trim();
  if (!upperCode) redirect(`/${locale}/groups`);

  const admin = createAdminClient();

  // Find the group by invite code
  const { data: group } = await admin
    .from("family_groups")
    .select("id, name, photo_url")
    .eq("invite_code", upperCode)
    .maybeSingle();

  // Invalid code
  if (!group) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🕯️</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          קוד הזמנה לא תקין
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          הקוד <strong>{upperCode}</strong> לא נמצא. ייתכן שפג תוקפו או שהוזן שגוי.
        </p>
        <Link
          href={`/${locale}/groups`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
          style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
        >
          חזרה לקבוצות
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in — show login prompt
  if (!user) {
    const joinPath = encodeURIComponent(`/${locale}/join?code=${upperCode}`);
    const loginUrl = `/${locale}/auth/login?next=${joinPath}`;
    return (
      <div className="max-w-sm mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🕯️</div>
        <h1 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
          הצטרפות לקבוצה
        </h1>
        <p className="text-base font-semibold mb-4" style={{ color: "var(--primary)" }}>
          {group.name}
        </p>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          התחבר/י לאפליקציה כדי להצטרף אוטומטית לקבוצה
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={loginUrl}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
          >
            התחבר/י והצטרף/י לקבוצה
          </Link>
          <Link
            href={`/${locale}/auth/register`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            הרשמה חדשה
          </Link>
        </div>
        <p className="text-xs mt-4" style={{ color: "var(--muted-foreground)" }}>
          קוד הזמנה: <strong>{upperCode}</strong>
        </p>
      </div>
    );
  }

  // Logged in — auto join
  const { data: existing } = await admin
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    await admin.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "member",
    });
  }

  // Redirect to the group page
  redirect(`/${locale}/groups/${group.id}`);
}
