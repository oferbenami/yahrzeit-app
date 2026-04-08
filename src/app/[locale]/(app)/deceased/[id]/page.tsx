import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNextYahrzeit } from "@/lib/hebrew-calendar";
import { CalendarExportButtons } from "@/components/deceased/CalendarExportButtons";

export default async function DeceasedDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const { data: deceased } = await supabase
    .from("deceased")
    .select(`
      *,
      family_groups (id, name)
    `)
    .eq("id", id)
    .single();

  if (!deceased) notFound();

  const nextYahrzeit = getNextYahrzeit(
    deceased.death_date_hebrew_day,
    deceased.death_date_hebrew_month
  );

  const daysText =
    nextYahrzeit.daysUntil === 0
      ? "היום!"
      : nextYahrzeit.daysUntil === 1
      ? "מחר"
      : `עוד ${nextYahrzeit.daysUntil} ימים`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href={`/${locale}/groups/${deceased.family_groups?.id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">{deceased.full_name}</h1>
        <Link
          href={`/${locale}/deceased/${id}/edit`}
          className="mr-auto text-muted-foreground hover:text-foreground"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-xl p-6 mb-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold text-muted-foreground overflow-hidden shrink-0">
            {deceased.photo_url ? (
              <img src={deceased.photo_url} alt={deceased.full_name} className="w-full h-full object-cover" />
            ) : (
              deceased.full_name[0]
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{deceased.full_name}</h2>
            {deceased.relationship_label && (
              <p className="text-muted-foreground">{deceased.relationship_label}</p>
            )}
            {deceased.family_groups && (
              <p className="text-sm text-muted-foreground mt-1">{deceased.family_groups.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Yahrzeit card */}
      <div className={`rounded-xl p-5 mb-4 border ${
        nextYahrzeit.daysUntil <= 7
          ? "bg-primary/10 border-primary/30"
          : "bg-card border-border"
      }`}>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          יארצייט הקרוב
        </h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-foreground">
            {nextYahrzeit.hebrewDate.hebrewString}
          </p>
          <p className="text-muted-foreground">
            {nextYahrzeit.gregorianDate.toLocaleDateString("he-IL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className={`font-medium ${nextYahrzeit.daysUntil <= 7 ? "text-primary" : "text-muted-foreground"}`}>
            {daysText}
          </p>
          {nextYahrzeit.shabbatEveBefore && (
            <p className="text-sm text-muted-foreground">
              ערב שבת לפני:{" "}
              {nextYahrzeit.shabbatEveBefore.toLocaleDateString("he-IL", {
                month: "long",
                day: "numeric",
              })}
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
            className="inline-link inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            הגדר תזכורות
          </Link>
          <Link
            href={`/${locale}/deceased/${id}/gathering`}
            className="inline-link inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            תכנן כינוס
          </Link>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <h3 className="font-semibold mb-3">תאריכים</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">תאריך פטירה (לועזי)</span>
            <span dir="ltr">{deceased.death_date_gregorian}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">תאריך פטירה (עברי)</span>
            <span>{deceased.death_date_hebrew}</span>
          </div>
          {deceased.birth_date_gregorian && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">תאריך לידה</span>
              <span dir="ltr">{deceased.birth_date_gregorian}</span>
            </div>
          )}
          {deceased.birth_date_hebrew && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">תאריך לידה (עברי)</span>
              <span>{deceased.birth_date_hebrew}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cemetery */}
      {(deceased.cemetery_name || deceased.cemetery_block) && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h3 className="font-semibold mb-3">בית קברות</h3>
          <div className="space-y-2 text-sm">
            {deceased.cemetery_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">שם</span>
                <span>{deceased.cemetery_name}</span>
              </div>
            )}
            {deceased.cemetery_block && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">חלקה</span>
                <span>{deceased.cemetery_block}</span>
              </div>
            )}
            {deceased.cemetery_plot && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">קבר</span>
                <span>{deceased.cemetery_plot}</span>
              </div>
            )}
            {deceased.cemetery_notes && (
              <p className="text-muted-foreground">{deceased.cemetery_notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Gravestone photo */}
      {deceased.gravestone_photo_url && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h3 className="font-semibold mb-3">תמונת מצבה</h3>
          <img
            src={deceased.gravestone_photo_url}
            alt="מצבה"
            className="w-full max-h-64 object-contain rounded-lg"
          />
        </div>
      )}

      {/* Notes */}
      {deceased.notes && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-2">הערות</h3>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{deceased.notes}</p>
        </div>
      )}
    </div>
  );
}
