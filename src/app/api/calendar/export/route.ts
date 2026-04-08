import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildICalFile, buildYahrzeitICalEvents } from "@/lib/ical";
import { calculateYahrzeit, getCurrentHebrewYear } from "@/lib/hebrew-calendar";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const deceasedId = searchParams.get("deceased");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yahrzeit.app";

  let deceasedList;

  if (deceasedId) {
    // Export single deceased
    const { data } = await supabase
      .from("deceased")
      .select(
        "id, full_name, death_date_hebrew, death_date_hebrew_day, death_date_hebrew_month, relationship_label, cemetery_name"
      )
      .eq("id", deceasedId)
      .single();
    deceasedList = data ? [data] : [];
  } else {
    // Export all deceased in user's groups
    const { data } = await supabase
      .from("deceased")
      .select(
        `id, full_name, death_date_hebrew, death_date_hebrew_day, death_date_hebrew_month,
         relationship_label, cemetery_name,
         family_groups!inner (group_members!inner (user_id))`
      )
      .eq("family_groups.group_members.user_id", user.id);
    deceasedList = data || [];
  }

  const currentYear = getCurrentHebrewYear();
  const allICalEvents = deceasedList.flatMap((d) => {
    // Generate for current + next 2 years
    const yahrzeitDates = [0, 1, 2].map((offset) => {
      const info = calculateYahrzeit(
        d.death_date_hebrew_day,
        d.death_date_hebrew_month,
        currentYear + offset
      );
      return {
        gregorianDate: info.gregorianDate.toISOString().split("T")[0],
        hebrewDate: info.hebrewDate.hebrewString,
      };
    });

    return buildYahrzeitICalEvents(d, yahrzeitDates, appUrl);
  });

  const icsContent = buildICalFile(allICalEvents, "אזכרה משפחתית");

  const filename = deceasedId
    ? `yahrzeit-${deceasedId.slice(0, 8)}.ics`
    : "yahrzeit-family.ics";

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
    },
  });
}
