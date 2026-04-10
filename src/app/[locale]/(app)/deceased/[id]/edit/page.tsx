import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateDeceased } from "@/lib/deceased/actions";
import { DeleteDeceasedButton } from "@/components/deceased/DeleteDeceasedButton";

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

  const relationships = [
    "אב", "אם", "סב", "סבה", "בעל", "אישה",
    "אח", "אחות", "בן", "בת", "דוד", "דודה", "אחר"
  ];

  async function updateAction(formData: FormData) {
    "use server";
    await updateDeceased(id, formData);
  }


  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/${locale}/deceased/${id}`} className="text-muted-foreground hover:text-foreground">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">עריכת פרטים</h1>
      </div>

      <form action={updateAction} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">פרטים בסיסיים</h2>
          <div>
            <label className="block text-sm font-medium mb-1">שם מלא *</label>
            <input
              name="full_name"
              type="text"
              required
              defaultValue={deceased.full_name}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">קשר משפחתי</label>
            <select
              name="relationship_label"
              defaultValue={deceased.relationship_label || ""}
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
              defaultValue={deceased.relationship_degree || ""}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">-- בחר --</option>
              <option value="first">ראשונה</option>
              <option value="second">שנייה</option>
              <option value="extended">מורחבת</option>
            </select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">תאריכים</h2>
          <div>
            <label className="block text-sm font-medium mb-1">תאריך פטירה (לועזי) *</label>
            <input
              name="death_date_gregorian"
              type="date"
              required
              defaultValue={deceased.death_date_gregorian}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">תאריך לידה (לועזי)</label>
            <input
              name="birth_date_gregorian"
              type="date"
              defaultValue={deceased.birth_date_gregorian || ""}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              dir="ltr"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">בית קברות</h2>
          <div>
            <label className="block text-sm font-medium mb-1">שם בית קברות</label>
            <input
              name="cemetery_name"
              type="text"
              defaultValue={deceased.cemetery_name || ""}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">חלקה</label>
              <input
                name="cemetery_block"
                type="text"
                defaultValue={deceased.cemetery_block || ""}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">קבר</label>
              <input
                name="cemetery_plot"
                type="text"
                defaultValue={deceased.cemetery_plot || ""}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">הערות מיקום</label>
            <input
              name="cemetery_notes"
              type="text"
              defaultValue={deceased.cemetery_notes || ""}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">הערות</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={deceased.notes || ""}
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
            href={`/${locale}/deceased/${id}`}
            className="px-6 py-2.5 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors"
          >
            ביטול
          </Link>
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-8 bg-destructive/5 border border-destructive/20 rounded-xl p-5" role="region" aria-label="אזור מחיקה">
        <h3 className="font-semibold text-destructive mb-2">מחיקה</h3>
        <p className="text-sm text-muted-foreground mb-3">פעולה זו אינה הפיכה</p>
        <DeleteDeceasedButton deceasedId={id} groupId={deceased.group_id} locale={locale} />
      </div>
    </div>
  );
}
