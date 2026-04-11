import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getNextYahrzeit } from "@/lib/hebrew-calendar";

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0.875rem",
};

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: deceased } = await supabase
    .from("deceased")
    .select(`
      id, full_name, death_date_hebrew_day, death_date_hebrew_month,
      death_date_hebrew, relationship_label, photo_url,
      family_groups!deceased_group_id_fkey!inner(name, group_members!inner(user_id))
    `)
    .eq("family_groups.group_members.user_id", user!.id);

  const allYahrzeits = (deceased || []).map((d) => {
    const next = getNextYahrzeit(d.death_date_hebrew_day, d.death_date_hebrew_month);
    const gd = next.gregorianDate;
    const dd = String(gd.getDate()).padStart(2, "0");
    const mm = String(gd.getMonth() + 1).padStart(2, "0");
    const yyyy = gd.getFullYear();
    return {
      id: d.id,
      fullName: d.full_name,
      photoUrl: d.photo_url as string | null,
      relationship: d.relationship_label,
      groupName: (d.family_groups as unknown as { name: string })?.name,
      daysUntil: next.daysUntil,
      gregorianDate: gd,
      gregorianFormatted: `${dd}/${mm}/${yyyy}`,
      hebrewDate: next.hebrewDate.hebrewString,
      shabbatEve: next.shabbatEveBefore,
    };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  // Group by Hebrew month label
  const byMonth: Record<string, typeof allYahrzeits> = {};
  for (const y of allYahrzeits) {
    const key = y.gregorianDate.toLocaleDateString("he-IL", { year: "numeric", month: "long" });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(y);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>לוח שנה — אזכרות</h1>
        <div className="h-px mt-3" style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }} />
      </div>

      {allYahrzeits.length === 0 ? (
        <div className="text-center py-14">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--muted)" }}
          >
            <svg className="w-8 h-8" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: "var(--foreground)" }}>אין נפטרים רשומים</p>
          <Link href={`/${locale}/groups`} className="inline-link mt-2 text-sm font-semibold hover:underline" style={{ color: "var(--primary)" }}>
            הוסף נפטרים
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byMonth).map(([month, yahrzeits]) => (
            <div key={month}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold tracking-wide" style={{ color: "var(--primary)" }}>
                  {month}
                </h2>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, #c9a84c40)" }} />
              </div>

              <div className="space-y-2">
                {yahrzeits.map((y) => {
                  const isToday = y.daysUntil === 0;
                  const isSoon = y.daysUntil <= 7;
                  return (
                    <Link
                      key={y.id}
                      href={`/${locale}/deceased/${y.id}`}
                      className="flex items-center gap-3 p-3 transition-all hover:opacity-90"
                      style={isToday ? {
                        background: "linear-gradient(135deg, #fff8e8, #fef3d0)",
                        border: "1px solid #c9a84c60",
                        borderRadius: "0.875rem",
                        boxShadow: "0 3px 12px rgba(184,134,11,0.15)",
                      } : {
                        ...cardStyle,
                        ...(isSoon ? { borderColor: "#c9a84c40" } : {}),
                      }}
                    >
                      {/* Date bubble */}
                      <div
                        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={isToday
                          ? { background: "linear-gradient(135deg, #c9a84c, #8b6010)" }
                          : { background: "var(--muted)" }}
                      >
                        <span className="text-xs font-semibold leading-none mb-0.5"
                          style={{ color: isToday ? "white" : "var(--muted-foreground)" }}>
                          {y.gregorianDate.toLocaleDateString("he-IL", { month: "short" })}
                        </span>
                        <span className="text-lg font-bold leading-none"
                          style={{ color: isToday ? "white" : "var(--foreground)" }}>
                          {y.gregorianDate.getDate()}
                        </span>
                      </div>

                      {/* Photo */}
                      <div
                        className="w-12 h-12 rounded-full shrink-0 overflow-hidden flex items-center justify-center font-bold text-base text-white"
                        style={y.photoUrl
                          ? { border: "2px solid #c9a84c", boxShadow: "0 0 0 2px #c9a84c30" }
                          : { background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
                      >
                        {y.photoUrl ? (
                          <img src={y.photoUrl} alt={y.fullName} className="w-full h-full object-cover" />
                        ) : (
                          y.fullName[0]
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>{y.fullName}</p>
                        <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                          {y.hebrewDate}
                          {y.relationship && ` • ${y.relationship}`}
                        </p>
                        {y.shabbatEve && (
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            ערב שבת:{" "}
                            {(() => {
                              const d = y.shabbatEve!;
                              return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
                            })()}
                          </p>
                        )}
                      </div>

                      {/* Days counter */}
                      <div className="text-end shrink-0">
                        {isToday ? (
                          <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "#c9a84c", color: "white" }}>היום</span>
                        ) : y.daysUntil === 1 ? (
                          <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>מחר</span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            עוד {y.daysUntil} ימים
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
