"use client";

import { useState } from "react";

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  boxShadow: "0 2px 10px rgba(184,134,11,0.07)",
};

const KADDISH = `יִתְגַּדַּל וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא.
(קהל: אָמֵן)

בְּעָלְמָא דִּי בְרָא כִרְעוּתֵהּ,
וְיַמְלִיךְ מַלְכוּתֵהּ,
בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן
וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל,
בַּעֲגָלָא וּבִזְמַן קָרִיב.
וְאִמְרוּ אָמֵן.

(קהל: אָמֵן. יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ
לְעָלַם וּלְעָלְמֵי עָלְמַיָּא)

יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא.

יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר
וְיִתְרוֹמַם וְיִתְנַשֵּׂא
וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל
שְׁמֵהּ דְּקֻדְשָׁא בְּרִיךְ הוּא.
(קהל: אָמֵן)

לְעֵלָּא מִן כָּל בִּרְכָתָא וְשִׁירָתָא,
תֻּשְׁבְּחָתָא וְנֶחֱמָתָא,
דַּאֲמִירָן בְּעָלְמָא.
וְאִמְרוּ אָמֵן.
(קהל: אָמֵן)

יְהֵא שְׁלָמָא רַבָּא מִן שְׁמַיָּא,
וְחַיִּים עָלֵינוּ וְעַל כָּל יִשְׂרָאֵל.
וְאִמְרוּ אָמֵן.
(קהל: אָמֵן)

עֹשֶׂה שָׁלוֹם בִּמְרוֹמָיו,
הוּא יַעֲשֶׂה שָׁלוֹם עָלֵינוּ
וְעַל כָּל יִשְׂרָאֵל.
וְאִמְרוּ אָמֵן.
(קהל: אָמֵן)`;

const HASHKAVA_ISH = `יִשְׁכַּב בְּשָׁלוֹם וְיָנוּחַ עַל מִשְׁכָּבוֹ בְּכָבוֹד
[שֵׁם הַנִּפְטָר] בֶּן [שֵׁם הָאָב]
שֶׁנִּפְטַר לְבֵית עוֹלָמוֹ.

יְכֻפַּר חֶטְאוֹ וְעֲוֹנוֹ וּפִשְׁעוֹ
בִּידֵי שָׁמַיִם.

יִרְאֶה בְּנֶחָמַת עַמּוֹ יִשְׂרָאֵל
וּבִבְנִיַּן יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ,
וְיִזְכֶּה לִתְחִיַּת הַמֵּתִים.

נִשְׁמָתוֹ תְּהֵא צְרוּרָה בִּצְרוֹר הַחַיִּים
עִם נִשְׁמוֹת אַבְרָהָם יִצְחָק וְיַעֲקֹב,
שָׂרָה רִבְקָה רָחֵל וְלֵאָה,
וְעִם שְׁאָר הַצַּדִּיקִים שֶׁבְּגַן עֵדֶן.

וְנֹאמַר אָמֵן.`;

const HASHKAVA_ISHA = `תִּשְׁכַּב בְּשָׁלוֹם וְתָנוּחַ עַל מִשְׁכָּבָהּ בְּכָבוֹד
[שֵׁם הַנִּפְטֶרֶת] בַּת [שֵׁם הָאָב]
שֶׁנִּפְטְרָה לְבֵית עוֹלָמָהּ.

יְכֻפַּר חֶטְאָהּ וַעֲוֹנָהּ וּפִשְׁעָהּ
בִּידֵי שָׁמַיִם.

תִּרְאֶה בְּנֶחָמַת עַמָּהּ יִשְׂרָאֵל
וּבִבְנִיַּן יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ,
וְתִזְכֶּה לִתְחִיַּת הַמֵּתִים.

נִשְׁמָתָהּ תְּהֵא צְרוּרָה בִּצְרוֹר הַחַיִּים
עִם נִשְׁמוֹת אַבְרָהָם יִצְחָק וְיַעֲקֹב,
שָׂרָה רִבְקָה רָחֵל וְלֵאָה,
וְעִם שְׁאָר הַצַּדִּיקוֹת שֶׁבְּגַן עֵדֶן.

וְנֹאמַר אָמֵן.`;

interface PrayerSection {
  id: string;
  title: string;
  subtitle: string;
  text: string;
}

const PRAYERS: PrayerSection[] = [
  {
    id: "kaddish",
    title: "קדיש יתום",
    subtitle: "נוסח ספרד / עדות המזרח",
    text: KADDISH,
  },
  {
    id: "hashkava-ish",
    title: "אשכבה לגבר",
    subtitle: 'החלף [שם הנפטר] ו[שם האב] בשמות הנכונים',
    text: HASHKAVA_ISH,
  },
  {
    id: "hashkava-isha",
    title: "אשכבה לאשה",
    subtitle: 'החלף [שם הנפטרת] ו[שם האב] בשמות הנכונים',
    text: HASHKAVA_ISHA,
  },
];

export default function PrayersPage() {
  const [openId, setOpenId] = useState<string | null>("kaddish");
  const [copied, setCopied] = useState<string | null>(null);

  async function handleCopy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>תפילות</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>קדיש, אשכבה ותפילות לזכר הנפטר</p>
        <div className="h-px mt-3" style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }} />
      </div>

      {/* Prayer cards */}
      <div className="space-y-3 mb-5">
        {PRAYERS.map((prayer) => {
          const isOpen = openId === prayer.id;
          return (
            <div key={prayer.id} style={cardStyle}>
              {/* Header */}
              <button
                className="w-full flex items-center justify-between p-4 text-right"
                onClick={() => setOpenId(isOpen ? null : prayer.id)}
              >
                <div className="flex-1 text-right">
                  <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{prayer.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{prayer.subtitle}</p>
                </div>
                <svg
                  className={`w-4 h-4 shrink-0 ms-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  style={{ color: "var(--primary)" }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {/* Prayer text */}
                  <div className="p-4">
                    <pre
                      className="text-base leading-loose whitespace-pre-wrap font-sans text-right"
                      style={{ color: "var(--foreground)", direction: "rtl" }}
                    >
                      {prayer.text}
                    </pre>
                  </div>
                  {/* Copy button */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleCopy(prayer.id, prayer.text)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={copied === prayer.id
                        ? { background: "linear-gradient(135deg, #86efac, #4ade80)", color: "#14532d" }
                        : { background: "linear-gradient(135deg, #c9a84c22, #c9a84c11)", color: "var(--primary)", border: "1px solid #c9a84c40" }
                      }
                    >
                      {copied === prayer.id ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          הועתק!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          העתק תפילה
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* External link card */}
      <div
        className="p-4 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #fff8e8, #fef3d0)",
          border: "1px solid #c9a84c50",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm mb-1" style={{ color: "#b8860b" }}>נוסחי תפילה נוספים</p>
            <p className="text-xs mb-3" style={{ color: "#8b6a4f" }}>
              אתר חברה קדישא מציע נוסחי תפילות לפי שם ולפי מנהג
            </p>
            <a
              href="https://www.kadisha.org/prayers-by-name/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-link inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              פתח אתר חברה קדישא
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
