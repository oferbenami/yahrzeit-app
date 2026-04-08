import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">פרופיל</h1>

      {/* User card */}
      <div className="bg-card border border-border rounded-xl p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold">{profile?.full_name || "—"}</p>
            <p className="text-muted-foreground text-sm" dir="ltr">{user?.email}</p>
            {profile?.phone && (
              <p className="text-muted-foreground text-sm" dir="ltr">{profile.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <h2 className="font-semibold mb-3">התראות ולוח שנה</h2>
        <p className="text-sm text-muted-foreground mb-3">
          ניתן להגדיר תזכורות ספציפיות לכל נפטר בדף הנפטר הרלוונטי.
        </p>
        <a
          href="/api/calendar/export"
          download
          className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          ייצא כל אזכרה (.ics)
        </a>
      </div>

      {/* Account info */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">פרטי חשבון</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">חבר מאז</span>
            <span>
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("he-IL")
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <form action={logout}>
        <button
          type="submit"
          className="w-full py-2.5 border border-destructive/50 text-destructive rounded-lg font-medium hover:bg-destructive/5 transition-colors"
        >
          התנתק
        </button>
      </form>
    </div>
  );
}
