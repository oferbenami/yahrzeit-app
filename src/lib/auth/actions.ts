"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginWithEmail(formData: FormData) {
  const supabase = await createClient();
  const next = (formData.get("next") as string) || "/he";

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function registerWithEmail(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/he");
}

export async function loginWithGoogle(locale: string = "he", next?: string) {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?locale=${locale}${nextParam}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function sendOtp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function verifyOtp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const token = formData.get("token") as string;
  const next = (formData.get("next") as string) || "/he";

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/he/login");
}
