import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
const TWILIO_WA_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");
const VAPID_PUBLIC = Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY");
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://yahrzeit.app";

// ── Email ──────────────────────────────────────────────────────────────────
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Yahrzeit <noreply@yahrzeit.app>",
      to,
      subject,
      html,
    }),
  });
  return resp.ok;
}

// ── SMS ────────────────────────────────────────────────────────────────────
async function sendSms(to: string, body: string): Promise<boolean> {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) return false;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
  const params = new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  return resp.ok;
}

// ── WhatsApp ───────────────────────────────────────────────────────────────
async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_WA_FROM) return false;
  const waTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const waFrom = TWILIO_WA_FROM.startsWith("whatsapp:") ? TWILIO_WA_FROM : `whatsapp:${TWILIO_WA_FROM}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
  const params = new URLSearchParams({ To: waTo, From: waFrom, Body: body });
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  return resp.ok;
}

// ── Web Push ───────────────────────────────────────────────────────────────
async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: object
): Promise<boolean> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;
  // Use web-push compatible endpoint directly via fetch with VAPID headers
  // For Deno Edge Functions, use the webpush npm package via esm.sh
  try {
    const webpush = await import("https://esm.sh/web-push@3.6.7");
    webpush.setVapidDetails("mailto:admin@yahrzeit.app", VAPID_PUBLIC, VAPID_PRIVATE);
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (e) {
    console.error("Push failed:", e);
    return false;
  }
}

// ── Notification message builder ───────────────────────────────────────────
function buildNotificationText(
  deceasedName: string,
  yahrzeitDateHebrew: string,
  daysUntil: number,
  customMessage?: string | null
): { subject: string; body: string; html: string } {
  const subject =
    daysUntil === 0
      ? `יארצייט היום - ${deceasedName}`
      : daysUntil === 1
      ? `תזכורת: יארצייט ${deceasedName} מחר`
      : `תזכורת: יארצייט ${deceasedName} בעוד ${daysUntil} ימים`;

  const body =
    customMessage || `${yahrzeitDateHebrew} - לזכר נשמת ${deceasedName}`;

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px;">
      <h2 style="color: #1a56db; margin-bottom: 8px;">${subject}</h2>
      <p style="color: #374151; font-size: 16px;">${body}</p>
      <p style="margin-top: 20px;">
        <a href="${APP_URL}/he" style="background: #1a56db; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          פתח יארצייט
        </a>
      </p>
    </div>
  `;

  return { subject, body, html };
}

// ── Main handler ───────────────────────────────────────────────────────────
Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  const { data: events, error } = await supabase
    .from("yahrzeit_events")
    .select(`
      id,
      deceased_id,
      yahrzeit_date_gregorian,
      yahrzeit_date_hebrew,
      notifications_sent,
      deceased:deceased_id (
        full_name,
        group_id
      )
    `)
    .gte("yahrzeit_date_gregorian", today)
    .lte("yahrzeit_date_gregorian", futureDateStr);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results = { sent: 0, skipped: 0, errors: 0 };

  for (const event of (events || [])) {
    const yahrzeitDate = new Date(event.yahrzeit_date_gregorian);
    const todayDate = new Date(today);
    const daysUntil = Math.round(
      (yahrzeitDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const deceased = event.deceased as { full_name: string; group_id: string };
    if (!deceased) continue;

    // Get all group members
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id, users:user_id (id, email, phone, notification_prefs, full_name)")
      .eq("group_id", deceased.group_id);

    for (const member of (members || [])) {
      const user = member.users as {
        id: string;
        email: string;
        phone?: string;
        full_name?: string;
        notification_prefs?: {
          push_subscriptions?: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>;
        };
      };
      if (!user) continue;

      // Get reminder schedule
      const { data: reminder } = await supabase
        .from("reminder_schedule")
        .select("days_before, channels, custom_message, active")
        .eq("deceased_id", event.deceased_id)
        .eq("user_id", user.id)
        .single();

      if (!reminder || !reminder.active) continue;
      if (!reminder.days_before.includes(daysUntil)) continue;

      const reminderKey = `${daysUntil}d_${user.id}`;
      const notificationsSent = (event.notifications_sent as Record<string, boolean>) || {};

      if (notificationsSent[reminderKey]) {
        results.skipped++;
        continue;
      }

      const { subject, body, html } = buildNotificationText(
        deceased.full_name,
        event.yahrzeit_date_hebrew,
        daysUntil,
        reminder.custom_message
      );

      const channels: string[] = reminder.channels || [];
      let anySent = false;

      // Email
      if (channels.includes("email")) {
        const ok = await sendEmail(user.email, subject, html);
        if (ok) anySent = true;
        else results.errors++;
      }

      // SMS
      if (channels.includes("sms") && user.phone) {
        const ok = await sendSms(user.phone, `${subject}: ${body}`);
        if (ok) anySent = true;
        else results.errors++;
      }

      // WhatsApp
      if (channels.includes("whatsapp") && user.phone) {
        const ok = await sendWhatsApp(user.phone, `${subject}: ${body}`);
        if (ok) anySent = true;
        else results.errors++;
      }

      // Push
      if (channels.includes("push") && user.notification_prefs?.push_subscriptions) {
        for (const sub of user.notification_prefs.push_subscriptions) {
          const ok = await sendPush(sub, {
            title: subject,
            body,
            url: `${APP_URL}/he/deceased/${event.deceased_id}`,
            tag: `yahrzeit-${event.deceased_id}-${daysUntil}`,
            requireInteraction: daysUntil === 0,
          });
          if (ok) anySent = true;
        }
      }

      // Mark as sent
      if (anySent) {
        await supabase
          .from("yahrzeit_events")
          .update({
            notifications_sent: { ...notificationsSent, [reminderKey]: true },
          })
          .eq("id", event.id);
        results.sent++;
      }
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
