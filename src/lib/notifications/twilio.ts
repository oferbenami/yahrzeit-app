export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromPhone: string;
  whatsappFrom: string;
}

function getTwilioConfig(): TwilioConfig {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    fromPhone: process.env.TWILIO_PHONE_NUMBER!,
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM!,
  };
}

interface TwilioMessage {
  to: string;
  body: string;
  from: string;
}

async function sendTwilioMessage(msg: TwilioMessage, config: TwilioConfig): Promise<boolean> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

  const body = new URLSearchParams({
    To: msg.to,
    From: msg.from,
    Body: msg.body,
  });

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  return resp.ok;
}

export async function sendSms(to: string, message: string): Promise<boolean> {
  const config = getTwilioConfig();
  if (!config.accountSid || !config.fromPhone) return false;

  // Normalize phone number
  const normalized = to.startsWith("+") ? to : `+972${to.replace(/^0/, "")}`;

  return sendTwilioMessage(
    { to: normalized, from: config.fromPhone, body: message },
    config
  );
}

export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const config = getTwilioConfig();
  if (!config.accountSid || !config.whatsappFrom) return false;

  const normalized = to.startsWith("+") ? to : `+972${to.replace(/^0/, "")}`;
  const whatsappTo = normalized.startsWith("whatsapp:") ? normalized : `whatsapp:${normalized}`;

  return sendTwilioMessage(
    { to: whatsappTo, from: config.whatsappFrom, body: message },
    config
  );
}
