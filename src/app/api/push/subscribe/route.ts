import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await request.json();

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  // Store subscription in user notification_prefs
  const { data: profile } = await supabase
    .from("users")
    .select("notification_prefs")
    .eq("id", user.id)
    .single();

  const prefs = profile?.notification_prefs || {};
  const existingSubscriptions: unknown[] = prefs.push_subscriptions || [];

  // Avoid duplicates by endpoint
  const filtered = (existingSubscriptions as Array<{ endpoint: string }>).filter(
    (s) => s.endpoint !== subscription.endpoint
  );

  await supabase.from("users").update({
    notification_prefs: {
      ...prefs,
      push: true,
      push_subscriptions: [...filtered, subscription],
    },
  }).eq("id", user.id);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint } = await request.json();

  const { data: profile } = await supabase
    .from("users")
    .select("notification_prefs")
    .eq("id", user.id)
    .single();

  const prefs = profile?.notification_prefs || {};
  const subscriptions: Array<{ endpoint: string }> =
    prefs.push_subscriptions || [];

  await supabase.from("users").update({
    notification_prefs: {
      ...prefs,
      push_subscriptions: subscriptions.filter((s) => s.endpoint !== endpoint),
    },
  }).eq("id", user.id);

  return NextResponse.json({ success: true });
}
