"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePrayerNusach(nusach: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  if (!["sephardi", "mizrahi", "ashkenaz"].includes(nusach)) {
    return { error: "נוסח לא תקין" };
  }

  const { error } = await supabase
    .from("users")
    .update({ prayer_nusach: nusach })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/[locale]/(app)/prayers", "page");
  revalidatePath("/[locale]/(app)/profile", "page");
  return { success: true };
}
