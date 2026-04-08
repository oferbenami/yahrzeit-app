import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://yahrzeit.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:admin@yahrzeit.app`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;

  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (error) {
    console.error("Push notification failed:", error);
    return false;
  }
}

export async function sendPushToUser(
  pushSubscriptions: PushSubscriptionData[],
  payload: PushPayload
): Promise<number> {
  if (!pushSubscriptions?.length) return 0;

  let successCount = 0;
  for (const sub of pushSubscriptions) {
    const ok = await sendPushNotification(sub, payload);
    if (ok) successCount++;
  }
  return successCount;
}

export function buildYahrzeitPushPayload(
  deceasedName: string,
  yahrzeitDateHebrew: string,
  daysUntil: number,
  deceasedId: string,
  appUrl: string = APP_URL
): PushPayload {
  const title =
    daysUntil === 0
      ? `יארצייט היום - ${deceasedName}`
      : daysUntil === 1
      ? `תזכורת: יארצייט ${deceasedName} מחר`
      : `תזכורת: יארצייט ${deceasedName} בעוד ${daysUntil} ימים`;

  return {
    title,
    body: `${yahrzeitDateHebrew}`,
    url: `${appUrl}/he/deceased/${deceasedId}`,
    tag: `yahrzeit-${deceasedId}`,
    requireInteraction: daysUntil === 0,
  };
}
