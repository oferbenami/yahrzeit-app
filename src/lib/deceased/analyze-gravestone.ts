"use server";

import Anthropic from "@anthropic-ai/sdk";

export interface GravestoneData {
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  hebrewDay?: number;
  hebrewMonth?: number;
  hebrewYear?: number;
  hebrewMonthName?: string;
  deathDateGregorian?: string;    // YYYY-MM-DD
  birthDateGregorian?: string;    // YYYY-MM-DD
  cemeteryName?: string;
  notes?: string;
  rawText?: string;
  confidence: "high" | "medium" | "low";
}

const HEBREW_MONTH_MAP: Record<string, number> = {
  "תשרי": 7, "חשוון": 8, "חשון": 8, "כסלו": 9, "טבת": 10,
  "שבט": 11, "אדר": 12, "אדר א": 12, "אדר ב": 13,
  "ניסן": 1, "נסן": 1, "אייר": 2, "סיון": 3, "תמוז": 4,
  "אב": 5, "אלול": 6,
};

function parseHebrewNumber(s: string): number | undefined {
  // Map Hebrew gematria letters to numbers
  const vals: Record<string, number> = {
    "א": 1, "ב": 2, "ג": 3, "ד": 4, "ה": 5, "ו": 6, "ז": 7,
    "ח": 8, "ט": 9, "י": 10, "כ": 20, "ל": 30, "מ": 40, "נ": 50,
    "ס": 60, "ע": 70, "פ": 80, "צ": 90, "ק": 100, "ר": 200,
    "ש": 300, "ת": 400,
  };
  const clean = s.replace(/[״׳'"]/g, "").trim();
  let total = 0;
  for (const ch of clean) {
    if (!vals[ch]) return undefined;
    total += vals[ch];
  }
  return total > 0 ? total : undefined;
}

export async function analyzeGravestone(formData: FormData): Promise<{ data?: GravestoneData; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "מפתח API לא מוגדר בשרת. הוסף ANTHROPIC_API_KEY." };

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) return { error: "לא צורפה תמונה" };

  // Convert to base64
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const client = new Anthropic({ apiKey });

  const prompt = `אתה מומחה בקריאת מצבות יהודיות. נתח את תמונת המצבה הבאה וחלץ את המידע בפורמט JSON בדיוק.

החזר JSON עם השדות הבאים (השתמש ב-null אם לא נמצא):
{
  "firstName": "שם פרטי של הנפטר",
  "lastName": "שם משפחה",
  "fatherName": "שם האב (לדוגמה אם כתוב 'בן דוד' → 'דוד')",
  "hebrewDeathDay": מספר יום פטירה עברי (1-30) או null,
  "hebrewDeathMonthName": "שם חודש עברי בעברית" או null,
  "hebrewDeathYear": מספר שנה עברית (4-5 ספרות, לדוגמה 5784) או null,
  "deathDateGregorian": "YYYY-MM-DD" או null,
  "birthDateGregorian": "YYYY-MM-DD" או null,
  "hebrewBirthDay": מספר יום לידה עברי או null,
  "hebrewBirthMonthName": "שם חודש לידה עברי" או null,
  "hebrewBirthYear": מספר שנת לידה עברית או null,
  "cemeteryName": "שם בית הקברות אם מופיע" או null,
  "rawText": "כל הטקסט שחלצת מהתמונה",
  "confidence": "high" / "medium" / "low"
}

חשוב:
- שנה עברית לרוב מופיעה בגימטריה (אותיות). המר לספרות (לדוגמה תשפ"ד = 5784)
- יום עברי לרוב בגימטריה — המר לספרות
- אם יש רק תאריך עברי ואין לועזי, ציין רק את העברי
- אם השם כולל "בן/בת [שם]" — זה שם האב
- החזר JSON בלבד, ללא טקסט נוסף`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: "לא הצלחנו לנתח את תשובת ה-AI" };

    const raw = JSON.parse(jsonMatch[0]);

    // Resolve Hebrew month name to month number
    const hebrewMonthNum = raw.hebrewDeathMonthName
      ? HEBREW_MONTH_MAP[raw.hebrewDeathMonthName.trim()] ?? undefined
      : undefined;
    const hebrewBirthMonthNum = raw.hebrewBirthMonthName
      ? HEBREW_MONTH_MAP[raw.hebrewBirthMonthName.trim()] ?? undefined
      : undefined;

    const data: GravestoneData = {
      firstName: raw.firstName || undefined,
      lastName: raw.lastName || undefined,
      fatherName: raw.fatherName || undefined,
      hebrewDay: raw.hebrewDeathDay || undefined,
      hebrewMonth: hebrewMonthNum,
      hebrewMonthName: raw.hebrewDeathMonthName || undefined,
      hebrewYear: raw.hebrewDeathYear || undefined,
      deathDateGregorian: raw.deathDateGregorian || undefined,
      birthDateGregorian: raw.birthDateGregorian || undefined,
      cemeteryName: raw.cemeteryName || undefined,
      rawText: raw.rawText || undefined,
      confidence: raw.confidence || "medium",
    };

    return { data };
  } catch (err) {
    console.error("[analyzeGravestone]", err);
    return { error: "שגיאה בניתוח התמונה. נסה שנית." };
  }
}
