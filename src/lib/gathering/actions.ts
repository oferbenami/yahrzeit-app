"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createGathering(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const deceasedId = formData.get("deceased_id") as string;
  const yahrzeitDate = formData.get("yahrzeit_date") as string;
  const locationName = (formData.get("location_name") as string) || null;
  const locationAddress = (formData.get("location_address") as string) || null;
  const meetingTime = (formData.get("meeting_time") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!deceasedId || !yahrzeitDate) {
    return { error: "שדות חובה חסרים" };
  }

  const icalUid = `gathering-${deceasedId}-${yahrzeitDate}-${Date.now()}@yahrzeit.app`;

  const { data, error } = await supabase
    .from("gathering_events")
    .insert({
      deceased_id: deceasedId,
      yahrzeit_date: yahrzeitDate,
      location_name: locationName,
      location_address: locationAddress,
      meeting_time: meetingTime || null,
      notes,
      created_by: user.id,
      ical_uid: icalUid,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/(app)/deceased/[id]/gathering`, "page");
  return { success: true, id: data.id };
}

export async function updateGathering(gatheringId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const { error } = await supabase
    .from("gathering_events")
    .update({
      location_name: (formData.get("location_name") as string) || null,
      location_address: (formData.get("location_address") as string) || null,
      meeting_time: (formData.get("meeting_time") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", gatheringId)
    .eq("created_by", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/(app)/deceased/[id]/gathering`, "page");
  return { success: true };
}

export async function deleteGathering(gatheringId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const { error } = await supabase
    .from("gathering_events")
    .delete()
    .eq("id", gatheringId)
    .eq("created_by", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/(app)/deceased/[id]/gathering`, "page");
  return { success: true };
}
