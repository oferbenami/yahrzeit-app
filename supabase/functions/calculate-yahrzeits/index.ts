import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Deceased {
  id: string;
  death_date_hebrew_day: number;
  death_date_hebrew_month: number;
}

interface HebcalResponse {
  date: string;
  hdate: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const HEBREW_MONTHS: Record<number, string> = {
  1: "Nisan", 2: "Iyyar", 3: "Sivan", 4: "Tamuz", 5: "Av", 6: "Elul",
  7: "Tishri", 8: "Cheshvan", 9: "Kislev", 10: "Tevet", 11: "Shevat",
  12: "Adar I", 13: "Adar II",
};

async function getYahrzeitFromHebcal(
  day: number,
  month: number,
  year: number
): Promise<{ gregorian: string; hebrew: string } | null> {
  const monthName = HEBREW_MONTHS[month];
  const url = `https://www.hebcal.com/converter?cfg=json&hd=${day}&hm=${monthName}&hy=${year}&h2g=1`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data: HebcalResponse = await resp.json();
    return { gregorian: data.date, hebrew: data.hdate };
  } catch {
    return null;
  }
}

function getShabbatEveBefore(gregorianDateStr: string): string | null {
  const date = new Date(gregorianDateStr);
  const dayOfWeek = date.getDay(); // 0=Sun, 5=Fri, 6=Sat

  if (dayOfWeek === 5) {
    // Yahrzeit is on Friday (Shabbat eve itself)
    return gregorianDateStr;
  }

  // Calculate last Friday
  const daysToFriday = dayOfWeek === 0 ? 2 : (dayOfWeek + 1) % 7 + 1;
  const friday = new Date(date);
  friday.setDate(friday.getDate() - daysToFriday);
  return friday.toISOString().split("T")[0];
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get current Hebrew year (approximate)
  const currentYear = new Date().getFullYear();
  const hebrewYear = currentYear + 3760; // rough approximation
  const nextHebrewYear = hebrewYear + 1;

  // Get all deceased
  const { data: deceasedList, error } = await supabase
    .from("deceased")
    .select("id, death_date_hebrew_day, death_date_hebrew_month");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results = { created: 0, skipped: 0, errors: 0 };

  for (const deceased of (deceasedList as Deceased[])) {
    for (const year of [hebrewYear, nextHebrewYear]) {
      // Check if already exists
      const { data: existing } = await supabase
        .from("yahrzeit_events")
        .select("id")
        .eq("deceased_id", deceased.id)
        .eq("hebrew_year", year)
        .single();

      if (existing) {
        results.skipped++;
        continue;
      }

      const yahrzeitData = await getYahrzeitFromHebcal(
        deceased.death_date_hebrew_day,
        deceased.death_date_hebrew_month,
        year
      );

      if (!yahrzeitData) {
        results.errors++;
        continue;
      }

      const shabbatEve = getShabbatEveBefore(yahrzeitData.gregorian);

      const { error: insertError } = await supabase
        .from("yahrzeit_events")
        .insert({
          deceased_id: deceased.id,
          hebrew_year: year,
          yahrzeit_date_gregorian: yahrzeitData.gregorian,
          yahrzeit_date_hebrew: yahrzeitData.hebrew,
          shabbat_eve_before: shabbatEve,
          notifications_sent: {},
        });

      if (insertError) {
        results.errors++;
      } else {
        results.created++;
      }
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
