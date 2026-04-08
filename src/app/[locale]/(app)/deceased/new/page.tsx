import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createDeceased } from "@/lib/deceased/actions";

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

  // Get user's groups for the selector
  const { data: groups } = await supabase
    .from("family_groups")
    .select("id, name, group_members!inner(role)")
    .eq("group_members.user_id", user!.id);

  const relationships = [
    "אב", "אם", "סב", "סבה", "בעל", "אישה",
    "אח", "אחות", "בן", "בת", "דוד", "דודה", "אחר"
  ];

  async function createDeceasedAction(formData: FormData) {
    "use server";
    await createDeceased(formData);
  }

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

      <form action={createDeceasedAction} className="space-y-6">
        <input type="hidden" name="group_id" value={groupId || groups?.[0]?.id || ""} />

        {/* Group selector (if no pre-selected group) */}
        {!groupId && groups && groups.length > 1 && (
          <div>
            <label className="block text-sm font-medium mb-1">קבוצה</label>
            <select
              name="group_id"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Basic info */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">פרטים בסיסיים</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              שם מלא <span className="text-destructive">*</span>
            </label>
            <input
              name="full_name"
              type="text"
              required
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">קשר משפחתי</label>
            <select
              name="relationship_label"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">-- בחר --</option>
              {relationships.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">דרגת קרבה</label>
            <select
              name="relationship_degree"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">-- בחר --</option>
              <option value="first">ראשונה</option>
              <option value="second">שנייה</option>
              <option value="extended">מורחבת</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">תאריכים</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              תאריך פטירה (לועזי) <span className="text-destructive">*</span>
            </label>
            <input
              name="death_date_gregorian"
              type="date"
              required
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground mt-1">התאריך העברי יחושב אוטומטית</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">תאריך לידה (לועזי)</label>
            <input
              name="birth_date_gregorian"
              type="date"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              dir="ltr"
            />
          </div>
        </div>

        {/* Cemetery */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">פרטי בית קברות</h2>

          <div>
            <label className="block text-sm font-medium mb-1">שם בית קברות</label>
            <input
              name="cemetery_name"
              type="text"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">חלקה</label>
              <input
                name="cemetery_block"
                type="text"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">קבר</label>
              <input
                name="cemetery_plot"
                type="text"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">הערות מיקום</label>
            <input
              name="cemetery_notes"
              type="text"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Photos */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">תמונות</h2>

          <div>
            <label className="block text-sm font-medium mb-1">תמונת הנפטר</label>
            <input
              name="photo"
              type="file"
              accept="image/*"
              className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-secondary file:text-secondary-foreground file:font-medium hover:file:bg-secondary/80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">תמונת מצבה</label>
            <input
              name="gravestone_photo"
              type="file"
              accept="image/*"
              className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-secondary file:text-secondary-foreground file:font-medium hover:file:bg-secondary/80"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">הערות</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            שמור
          </button>
          <Link
            href={`/${locale}/groups`}
            className="px-6 py-2.5 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors"
          >
            ביטול
          </Link>
        </div>
      </form>
    </div>
  );
}
