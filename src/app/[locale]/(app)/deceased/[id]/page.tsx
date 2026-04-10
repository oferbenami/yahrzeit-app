import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNextYahrzeit, formatGregorianDate } from "@/lib/hebrew-calendar";
import { CalendarExportButtons } from "@/components/deceased/CalendarExportButtons";
import { DeceasedPhotoUpload } from "@/components/deceased/DeceasedPhotoUpload";

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  boxShadow: "0 2px 10px rgba(184,134,11,0.07)",
};

function Row({ label, value, ltr }: { label: string; value: string | null | undefined; ltr?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <span className="text-sm font-medium text-right" dir={ltr ? "ltr" : "rtl"}>{value}</span>
    </div>
  );
}

export default async function DeceasedDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const { data: deceased } = await supabase
    .from("deceased")
    .select(`*, family_groups!deceased_group_id_fkey(id, name)`)
    .eq("id", id)
    .single();

  if (!deceased) notFound();

  const nextYahrzeit = getNextYahrzeit(
    deceased.death_date_hebrew_day,
    deceased.death_date_hebrew_month
  );

  const daysText =
    nextYahrzeit.daysUntil === 0 ? "היום!" :
    nextYahrzeit.daysUntil === 1 ? "מחר" :
    `עוד ${nextYahrzeit.daysUntil} ימים`;

  const yahrzeitDateFormatted = (() => {
    const d = nextYahrzeit.gregorianDate;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  })();

  const mapsUrl = deceased.cemetery_lat && deceased.cemetery_lng
    ? `https://www.google.com/maps?q=${deceased.cemetery_lat},${deceased.cemetery_lng}`
    : null;

  const firstName = deceased.first_name || deceased.full_name.split(" ")[0] || "";
  const lastName = deceased.last_name || deceased.full_name.split(" ").slice(1).join(" ") || "";
  const gravezUrl = `https://gravez.me/search?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Link
          href={`/${locale}/groups/${deceased.family_groups?.id}`}
          className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold flex-1 truncate" style={{ color: "var(--foreground)" }}>{deceased.full_name}</h1>
        <Link
          href={`/${locale}/deceased/${id}/edit`}
          className="p-2 rounded-xl transition-colors"
          style={{ color: "var(--muted-foreground)", background: "var(--muted)" }}
          aria-label="עריכה"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>
      </div>

      {/* Profile card with photo upload */}
      <div className="p-5 mb-4" style={cardStyle}>
        <DeceasedPhotoUpload
          deceasedId={id}
          currentPhotoUrl={deceased.photo_url}
          deceasedName={deceased.full_name}
        />
        {(deceased.relationship_label || deceased.family_groups) && (
          <div className="mt-3 pt-3 flex items-center gap-3 flex-wrap" style={{ borderTop: "1px solid var(--border)" }}>
            {deceased.relationship_label && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "linear-gradient(135deg, #fff8e8, #fef3d0)", color: "#b8860b", border: "1px solid #c9a84c50" }}>
                {deceased.relationship_label}
              </span>
            )}
            {deceased.family_groups && (
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{deceased.family_groups.name}</span>
            )}
          </div>
        )}
      </div>

      {/* Yahrzeit card */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={nextYahrzeit.daysUntil <= 7 ? {
          background: "linear-gradient(135deg, #fff8e8, #fef3d0)",
          border: "1px solid #c9a84c60",
          boxShadow: "0 4px 18px rgba(184,134,11,0.15)",
          borderRadius: "1rem",
        } : cardStyle}
      >
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <svg className="w-4 h-4" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          אזכרה הקרובה
        </h3>
        <div className="space-y-1 mb-4">
          <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {nextYahrzeit.hebrewDate.hebrewString}
          </p>
          <p className="text-sm font-medium" dir="ltr" style={{ color: "var(--muted-foreground)" }}>
            {yahrzeitDateFormatted}
          </p>
          <p className={`text-sm font-bold`} style={{ color: nextYahrzeit.daysUntil <= 7 ? "#b8860b" : "var(--muted-foreground)" }}>
            {daysText}
          </p>
          {nextYahrzeit.shabbatEveBefore && (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              ערב שבת לפני:{" "}
              {(() => {
                const d = nextYahrzeit.shabbatEveBefore!;
                return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
              })()}
            </p>
          )}
        </div>
        <CalendarExportButtons
          deceasedId={id}
          deceasedName={deceased.full_name}
          yahrzeitDate={nextYahrzeit.gregorianDate}
          hebrewDate={nextYahrzeit.hebrewDate.hebrewString}
          cemeteryName={deceased.cemetery_name}
          relationship={deceased.relationship_label}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/deceased/${id}/yahrzeit`}
            className="inline-link inline-flex items-center gap-1 text-xs font-semibold hover:underline"
            style={{ color: "var(--primary)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            הגדר תזכורות
          </Link>
          <Link
            href={`/${locale}/deceased/${id}/gathering`}
            className="inline-link inline-flex items-center gap-1 text-xs font-semibold hover:underline"
            style={{ color: "var(--primary)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            תכנן כינוס
          </Link>
        </div>
      </div>

      {/* Dates */}
      <div className="p-5 mb-4" style={cardStyle}>
        <h3 className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>תאריכים</h3>
        <Row label="תאריך פטירה" value={formatGregorianDate(deceased.death_date_gregorian)} ltr />
        <Row label="תאריך פטירה עברי" value={deceased.death_date_hebrew} />
        <Row label="תאריך לידה" value={formatGregorianDate(deceased.birth_date_gregorian)} ltr />
        <Row label="תאריך לידה עברי" value={deceased.birth_date_hebrew} />
        {deceased.father_name && <Row label="שם האב" value={deceased.father_name} />}
        {deceased.mother_name && <Row label="שם האם" value={deceased.mother_name} />}
      </div>

      {/* Cemetery */}
      <div className="p-5 mb-4" style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>בית קברות</h3>
          <div className="flex gap-2 flex-wrap justify-end">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-link flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "linear-gradient(135deg, #c9a84c20, #c9a84c10)", color: "var(--primary)", border: "1px solid #c9a84c50" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                מפה
              </a>
            )}
            <a
              href={gravezUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-link flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "linear-gradient(135deg, #e8f4f8, #d0eaf5)", color: "#2a6a8a", border: "1px solid #7ab8d060" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              חיפוש קבר
            </a>
          </div>
        </div>
        {(deceased.cemetery_name || deceased.cemetery_block || deceased.cemetery_plot || deceased.cemetery_notes) ? (
          <>
            <Row label="שם בית קברות" value={deceased.cemetery_name} />
            <Row label="חלקה" value={deceased.cemetery_block} />
            <Row label="קבר" value={deceased.cemetery_plot} />
            <Row label="הערות" value={deceased.cemetery_notes} />
          </>
        ) : (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>טרם הוזנו פרטי קבורה</p>
        )}
      </div>

      {/* Gravestone photo */}
      {deceased.gravestone_photo_url && (
        <div className="p-5 mb-4" style={cardStyle}>
          <h3 className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>תמונת מצבה</h3>
          <img
            src={deceased.gravestone_photo_url}
            alt="מצבה"
            className="w-full max-h-72 object-contain rounded-xl"
          />
        </div>
      )}

      {/* Notes */}
      {deceased.notes && (
        <div className="p-5" style={cardStyle}>
          <h3 className="font-bold text-sm mb-2" style={{ color: "var(--foreground)" }}>הערות</h3>
          <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--muted-foreground)" }}>{deceased.notes}</p>
        </div>
      )}
    </div>
  );
}
