"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gregorianToHebrew } from "@/lib/hebrew-calendar";

export async function createDeceased(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const groupId = formData.get("group_id") as string;
  const fullName = formData.get("full_name") as string;
  const deathDateStr = formData.get("death_date_gregorian") as string;

  if (!fullName?.trim() || !deathDateStr || !groupId) {
    return { error: "שדות חובה חסרים" };
  }

  // Convert death date to Hebrew
  const deathDate = new Date(deathDateStr);
  const hebrewDeath = gregorianToHebrew(deathDate);

  // Handle birth date
  const birthDateStr = formData.get("birth_date_gregorian") as string;
  let birthDateHebrew: string | null = null;
  if (birthDateStr) {
    const birthDate = new Date(birthDateStr);
    birthDateHebrew = gregorianToHebrew(birthDate).hebrewString;
  }

  // Handle photo upload
  let photoUrl: string | null = null;
  const photoFile = formData.get("photo") as File;
  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("deceased-photos")
      .upload(fileName, photoFile, { upsert: true });

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from("deceased-photos")
        .getPublicUrl(uploadData.path);
      photoUrl = urlData.publicUrl;
    }
  }

  // Handle gravestone photo
  let gravestonePhotoUrl: string | null = null;
  const gravestoneFile = formData.get("gravestone_photo") as File;
  if (gravestoneFile && gravestoneFile.size > 0) {
    const ext = gravestoneFile.name.split(".").pop();
    const fileName = `gravestone/${user.id}/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("deceased-photos")
      .upload(fileName, gravestoneFile, { upsert: true });

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from("deceased-photos")
        .getPublicUrl(uploadData.path);
      gravestonePhotoUrl = urlData.publicUrl;
    }
  }

  const { data: deceased, error } = await supabase
    .from("deceased")
    .insert({
      group_id: groupId,
      created_by: user.id,
      full_name: fullName.trim(),
      photo_url: photoUrl,
      gravestone_photo_url: gravestonePhotoUrl,
      birth_date_gregorian: birthDateStr || null,
      birth_date_hebrew: birthDateHebrew,
      death_date_gregorian: deathDateStr,
      death_date_hebrew: hebrewDeath.hebrewString,
      death_date_hebrew_day: hebrewDeath.day,
      death_date_hebrew_month: hebrewDeath.month,
      cemetery_name: (formData.get("cemetery_name") as string) || null,
      cemetery_block: (formData.get("cemetery_block") as string) || null,
      cemetery_plot: (formData.get("cemetery_plot") as string) || null,
      cemetery_notes: (formData.get("cemetery_notes") as string) || null,
      relationship_label: (formData.get("relationship_label") as string) || null,
      relationship_degree: (formData.get("relationship_degree") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/[locale]/(app)/groups/[id]", "page");
  redirect(`/he/deceased/${deceased.id}`);
}

export async function updateDeceased(deceasedId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const deathDateStr = formData.get("death_date_gregorian") as string;
  let hebrewDeathData = {};

  if (deathDateStr) {
    const hebrewDeath = gregorianToHebrew(new Date(deathDateStr));
    hebrewDeathData = {
      death_date_gregorian: deathDateStr,
      death_date_hebrew: hebrewDeath.hebrewString,
      death_date_hebrew_day: hebrewDeath.day,
      death_date_hebrew_month: hebrewDeath.month,
    };
  }

  const birthDateStr = formData.get("birth_date_gregorian") as string;
  let birthDateHebrew: string | null = null;
  if (birthDateStr) {
    birthDateHebrew = gregorianToHebrew(new Date(birthDateStr)).hebrewString;
  }

  const { error } = await supabase
    .from("deceased")
    .update({
      full_name: (formData.get("full_name") as string).trim(),
      birth_date_gregorian: birthDateStr || null,
      birth_date_hebrew: birthDateHebrew,
      ...hebrewDeathData,
      cemetery_name: (formData.get("cemetery_name") as string) || null,
      cemetery_block: (formData.get("cemetery_block") as string) || null,
      cemetery_plot: (formData.get("cemetery_plot") as string) || null,
      cemetery_notes: (formData.get("cemetery_notes") as string) || null,
      relationship_label: (formData.get("relationship_label") as string) || null,
      relationship_degree: (formData.get("relationship_degree") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", deceasedId);

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/(app)/deceased/${deceasedId}`, "page");
  redirect(`/he/deceased/${deceasedId}`);
}

export async function deleteDeceased(deceasedId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const { error } = await supabase
    .from("deceased")
    .delete()
    .eq("id", deceasedId);

  if (error) return { error: error.message };

  revalidatePath("/[locale]/(app)/groups/[id]", "page");
  redirect("/he/groups");
}
