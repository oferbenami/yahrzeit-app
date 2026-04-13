"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "שם קבוצה נדרש" };

  // Generate unique invite code
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

  const { data: group, error: groupError } = await supabase
    .from("family_groups")
    .insert({ name: name.trim(), created_by: user.id, invite_code: inviteCode })
    .select()
    .single();

  if (groupError) {
    console.error("[createGroup] insert error:", groupError);
    return { error: groupError.message };
  }

  // Add creator as admin
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "admin",
  });

  if (memberError) {
    console.error("[createGroup] member insert error:", memberError);
    return { error: memberError.message };
  }

  revalidatePath("/[locale]/(app)/groups", "page");
  redirect(`/he/groups/${group.id}`);
}

export async function joinGroup(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const inviteCode = (formData.get("invite_code") as string)?.toUpperCase().trim();
  if (!inviteCode) return { error: "קוד הזמנה נדרש" };

  const { data: group, error: findError } = await supabase
    .from("family_groups")
    .select("id, name")
    .eq("invite_code", inviteCode)
    .single();

  if (findError || !group) return { error: "קוד הזמנה לא תקין" };

  // Check if already a member
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .single();

  if (existing) return { error: "כבר חבר בקבוצה זו" };

  const { error: joinError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "member",
  });

  if (joinError) return { error: joinError.message };

  revalidatePath("/[locale]/(app)/groups", "page");
  redirect(`/he/groups/${group.id}`);
}

export async function updateGroup(groupId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("family_groups")
    .update({ name: name.trim() })
    .eq("id", groupId);

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/(app)/groups/${groupId}`, "page");
  return { success: true };
}

export async function removeMember(groupId: string, memberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("id", memberId)
    .eq("group_id", groupId);

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/(app)/groups/${groupId}`, "page");
  return { success: true };
}

export async function uploadGroupPhoto(groupId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const photoFile = formData.get("photo") as File;
  if (!photoFile || photoFile.size === 0) return { error: "לא נבחרה תמונה" };

  const ext = photoFile.name.split(".").pop();
  const fileName = `groups/${groupId}/${Date.now()}.${ext}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("deceased-photos")
    .upload(fileName, photoFile, { upsert: true });
  if (uploadError || !uploadData) return { error: uploadError?.message ?? "שגיאת העלאה" };

  const photoUrl = supabase.storage.from("deceased-photos").getPublicUrl(uploadData.path).data.publicUrl;

  const { error } = await supabase
    .from("family_groups")
    .update({ photo_url: photoUrl })
    .eq("id", groupId);

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/(app)/groups/${groupId}`, "page");
  return { photoUrl };
}

export async function addDeceasedToGroup(deceasedId: string, groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const { error } = await supabase
    .from("deceased_groups")
    .insert({ deceased_id: deceasedId, group_id: groupId });

  if (error) {
    if (error.code === "23505") return { error: "הנפטר כבר משויך לקבוצה זו" };
    return { error: error.message };
  }

  revalidatePath(`/[locale]/(app)/groups/${groupId}`, "page");
  return { success: true };
}

export async function removeDeceasedFromGroup(deceasedId: string, groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("deceased_groups")
    .delete()
    .eq("deceased_id", deceasedId)
    .eq("group_id", groupId);

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/(app)/groups/${groupId}`, "page");
  return { success: true };
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  // Verify admin via admin client (bypasses recursive RLS)
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    return { error: "אין הרשאה למחוק קבוצה" };
  }

  const { error } = await admin
    .from("family_groups")
    .delete()
    .eq("id", groupId);

  if (error) return { error: error.message };

  revalidatePath("/he/groups");
  redirect("/he/groups");
}

export async function regenerateInviteCode(groupId: string) {
  const supabase = await createClient();
  const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();

  const { error } = await supabase
    .from("family_groups")
    .update({ invite_code: newCode })
    .eq("id", groupId);

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/(app)/groups/${groupId}`, "page");
  return { success: true, code: newCode };
}
