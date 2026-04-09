import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  boxShadow: "0 2px 10px rgba(184,134,11,0.07)",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user!.id)
    .single();

  const initials = (profile?.full_name?.[0] || user?.email?.[0] || "?").toUpperCase();
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>פרופיל</h1>
        <div className="h-px mt-3" style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }} />
      </div>

      {/* User card */}
      <div className="p-5 mb-4" style={cardStyle}>
        <div className="flex items-center gap-4">
          <div
            className="w-18 h-18 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold truncate" style={{ color: "var(--foreground)" }}>
              {profile?.full_name || "—"}
            </p>
            <p className="text-sm truncate" dir="ltr" style={{ color: "var(--muted-foreground)" }}>{user?.email}</p>
            {profile?.phone && (
              <p className="text-sm" dir="ltr" style={{ color: "var(--muted-foreground)" }}>{profile.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notifications / calendar export */}
      <div className="p-5 mb-4" style={cardStyle}>
        <h2 className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>התראות ולוח שנה</h2>
        <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
          הגדר תזכורות ספציפיות לכל נפטר בדף הנפטר הרלוונטי.
        </p>
        <a
          href="/api/calendar/export"
          download
          className="inline-link flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-fit border"
          style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--secondary)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          ייצא כל אזכרה (.ics)
        </a>
      </div>

      {/* Account details */}
      <div className="p-5 mb-4" style={cardStyle}>
        <h2 className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>פרטי חשבון</h2>
        <div className="space-y-0">
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>אימייל</span>
            <span className="text-sm font-medium" dir="ltr">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>חבר מאז</span>
            <span className="text-sm font-medium">{memberSince}</span>
          </div>
        </div>
      </div>

      {/* Logout — prominent, at bottom */}
      <div className="p-5" style={{ ...cardStyle, border: "1px solid #fca5a580" }}>
        <h2 className="font-bold text-sm mb-1" style={{ color: "var(--foreground)" }}>יציאה מהאפליקציה</h2>
        <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
          ניתן להתחבר שנית בכל עת עם אותו חשבון
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              boxShadow: "0 4px 14px rgba(239,68,68,0.25)",
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            התנתק מהאפליקציה
          </button>
        </form>
      </div>
    </div>
  );
}
