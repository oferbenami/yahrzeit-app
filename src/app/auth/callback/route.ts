import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "email" | "signup" | "magiclink" | "recovery" | null;
  const locale = searchParams.get("locale") || "he";
  const next = searchParams.get("next");

  const supabase = await createClient();

  if (code) {
    // OAuth / PKCE flow
    await supabase.auth.exchangeCodeForSession(code);
  } else if (token_hash && type) {
    // Email OTP / magic link / signup confirmation
    await supabase.auth.verifyOtp({ token_hash, type });
  }

  const redirectPath = next ? decodeURIComponent(next) : `/${locale}`;
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
