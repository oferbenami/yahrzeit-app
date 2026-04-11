"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gregorianToHebrew, hebrewToGregorian } from "@/lib/hebrew-calendar";

const PHOTO_BUCKET = "deceased-photos";

/**
 * Ensures the deceased-photos storage bucket exists.
 * Creates it (with public access) if missing — requires service_role key.
 */
async function ensureBucket(): Promise<{ error?: string }> {
  try {
    const admin = createAdminClient();
    const { data: buckets, error: listError } = await admin.storage.listBuckets();
    if (listError) {
      console.error("[ensureBucket] listBuckets error:", listError.message);
      return { error: listError.message };
    }
    if (buckets?.some((b) => b.name === PHOTO_BUCKET)) return {};

    // Bucket doesn't exist — create it
    const { error: createError } = await admin.storage.createBucket(PHOTO_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5 MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });
    if (createError) {
      console.error("[ensureBucket] createBucket error:", createError.message);
      return { error: createError.message };
    }
    console.log("[ensureBucket] bucket created successfully");
    return {};
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ensureBucket] exception:", msg);
    return { error: msg };
  }
}

export async function createDeceased(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const groupId = formData.get("group_id") as string;
  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const dateMode = formData.get("date_mode") as string || "gregorian";
  const afterSunset = formData.get("death_after_sunset") === "true";

  if (!fullName || !groupId) return { error: "שדות חובה חסרים" };

  let deathDateGregorian: string;
  let hebrewDeath: ReturnType<typeof gregorianToHebrew>;

  if (dateMode === "hebrew") {
    const heDay = parseInt(formData.get("death_hebrew_day") as string);
    const heMonth = parseInt(formData.get("death_hebrew_month") as string);
    const heYear = parseInt(formData.get("death_hebrew_year") as string);
    if (!heDay || !heMonth || !heYear) return { error: "תאריך עברי חסר" };
    const gDate = hebrewToGregorian(heDay, heMonth, heYear);
    if (!gDate) return { error: "תאריך עברי לא תקין" };
    hebrewDeath = gregorianToHebrew(gDate);
    // Override with exact Hebrew values entered
    hebrewDeath.day = heDay;
    hebrewDeath.month = heMonth;
    // If died before midnight (night portion of Hebrew day), Gregorian date is previous day
    if (formData.get("death_before_midnight_hebrew") === "true") {
      gDate.setDate(gDate.getDate() - 1);
    }
    deathDateGregorian = gDate.toISOString().split("T")[0];
  } else {
    const deathDateStr = formData.get("death_date_gregorian") as string;
    if (!deathDateStr) return { error: "תאריך פטירה חסר" };
    deathDateGregorian = deathDateStr;
    // For Hebrew date: if after sunset, advance 1 day
    const dateForHebrew = new Date(deathDateStr + "T12:00:00");
    if (afterSunset) dateForHebrew.setDate(dateForHebrew.getDate() + 1);
    hebrewDeath = gregorianToHebrew(dateForHebrew);
  }

  // Birth date
  const birthDateStr = (formData.get("birth_date_gregorian") as string) || null;
  const birthDateHebrew = birthDateStr
    ? gregorianToHebrew(new Date(birthDateStr + "T12:00:00")).hebrewString
    : null;

  // Ensure bucket exists before any upload
  const bucketResult = await ensureBucket();
  if (bucketResult.error) {
    return { error: `שגיאת אחסון: ${bucketResult.error}` };
  }

  // Handle photo upload
  let photoUrl: string | null = null;
  const photoFile = formData.get("photo") as File;
  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(fileName, photoFile, { upsert: true });
    if (uploadError) {
      console.error("[createDeceased] photo upload error:", uploadError.message);
      return { error: `שגיאת העלאת תמונה: ${uploadError.message}` };
    }
    if (uploadData) {
      photoUrl = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(uploadData.path).data.publicUrl;
    }
  }

  // Handle gravestone photo
  let gravestonePhotoUrl: string | null = null;
  const gravestoneFile = formData.get("gravestone_photo") as File;
  if (gravestoneFile && gravestoneFile.size > 0) {
    const ext = gravestoneFile.name.split(".").pop();
    const fileName = `gravestone/${user.id}/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(fileName, gravestoneFile, { upsert: true });
    if (uploadError) {
      console.error("[createDeceased] gravestone upload error:", uploadError.message);
      return { error: `שגיאת העלאת תמונת מצבה: ${uploadError.message}` };
    }
    if (uploadData) {
      gravestonePhotoUrl = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(uploadData.path).data.publicUrl;
    }
  }

  const relationshipLabel = (formData.get("relationship_label") as string) || null;
  const relationshipDegree = (formData.get("relationship_degree") as string) || null;

  const { data: deceased, error } = await supabase
    .from("deceased")
    .insert({
      group_id: groupId,
      created_by: user.id,
      full_name: fullName,
      first_name: firstName || null,
      last_name: lastName || null,
      father_name: (formData.get("father_name") as string) || null,
      mother_name: (formData.get("mother_name") as string) || null,
      photo_url: photoUrl,
      gravestone_photo_url: gravestonePhotoUrl,
      birth_date_gregorian: birthDateStr,
      birth_date_hebrew: birthDateHebrew,
      death_date_gregorian: deathDateGregorian,
      death_date_hebrew: hebrewDeath.hebrewString,
      death_date_hebrew_day: hebrewDeath.day,
      death_date_hebrew_month: hebrewDeath.month,
      death_after_sunset: afterSunset,
      cemetery_name: (formData.get("cemetery_name") as string) || null,
      cemetery_block: (formData.get("cemetery_block") as string) || null,
      cemetery_plot: (formData.get("cemetery_plot") as string) || null,
      cemetery_notes: (formData.get("cemetery_notes") as string) || null,
      cemetery_lat: formData.get("cemetery_lat") ? parseFloat(formData.get("cemetery_lat") as string) : null,
      cemetery_lng: formData.get("cemetery_lng") ? parseFloat(formData.get("cemetery_lng") as string) : null,
      relationship_label: relationshipLabel,
      relationship_degree: relationshipDegree || null,
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[createDeceased]", error);
    return { error: error.message };
  }

  // Save personal relationship for this user
  if (relationshipLabel) {
    await supabase.from("user_deceased_relationships").upsert({
      user_id: user.id,
      deceased_id: deceased.id,
      relationship_label: relationshipLabel,
      relationship_degree: relationshipDegree || null,
    }, { onConflict: "user_id,deceased_id" });
  }

  revalidatePath("/[locale]/(app)/groups/[id]", "page");
  return { id: deceased.id };
}

export async function searchDeceased(query: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !query.trim()) return { data: [] };

  const { data } = await supabase
    .from("deceased")
    .select(`
      id, full_name, death_date_hebrew, relationship_label,
      family_groups!deceased_group_id_fkey!inner(name, group_members!inner(user_id))
    `)
    .eq("family_groups.group_members.user_id", user.id)
    .ilike("full_name", `%${query.trim()}%`)
    .limit(8);

  return { data: data || [] };
}

export async function upsertUserDeceasedRelationship(
  deceasedId: string,
  relationshipLabel: string,
  relationshipDegree: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const { error } = await supabase
    .from("user_deceased_relationships")
    .upsert({
      user_id: user.id,
      deceased_id: deceasedId,
      relationship_label: relationshipLabel || null,
      relationship_degree: (relationshipDegree as "first" | "second" | "extended") || null,
    }, { onConflict: "user_id,deceased_id" });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateDeceased(deceasedId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const deathDateStr = formData.get("death_date_gregorian") as string;
  let hebrewDeathData = {};

  if (deathDateStr) {
    const hebrewDeath = gregorianToHebrew(new Date(deathDateStr + "T12:00:00"));
    hebrewDeathData = {
      death_date_gregorian: deathDateStr,
      death_date_hebrew: hebrewDeath.hebrewString,
      death_date_hebrew_day: hebrewDeath.day,
      death_date_hebrew_month: hebrewDeath.month,
    };
  }

  const birthDateStr = formData.get("birth_date_gregorian") as string;
  const birthDateHebrew = birthDateStr
    ? gregorianToHebrew(new Date(birthDateStr + "T12:00:00")).hebrewString
    : null;

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
  return { id: deceasedId };
}

export async function uploadDeceasedPhoto(deceasedId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const photoFile = formData.get("photo") as File;
  if (!photoFile || photoFile.size === 0) return { error: "לא נבחרה תמונה" };

  // Auto-create bucket if missing
  const bucketResult = await ensureBucket();
  if (bucketResult.error) {
    return { error: `שגיאת אחסון: ${bucketResult.error}` };
  }

  const ext = photoFile.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${ext}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(fileName, photoFile, { upsert: true });
  if (uploadError || !uploadData) {
    console.error("[uploadDeceasedPhoto] storage error:", JSON.stringify(uploadError));
    return { error: `שגיאת אחסון: ${uploadError?.message}` };
  }

  const photoUrl = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(uploadData.path).data.publicUrl;

  const { error } = await supabase
    .from("deceased")
    .update({ photo_url: photoUrl })
    .eq("id", deceasedId);

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/(app)/deceased/${deceasedId}`, "page");
  return { photoUrl };
}

export async function deleteDeceased(deceasedId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const { error } = await supabase.from("deceased").delete().eq("id", deceasedId);
  if (error) return { error: error.message };

  revalidatePath("/[locale]/(app)/groups/[id]", "page");
  return { success: true };
}
