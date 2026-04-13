"use client";

const APP_URL = "https://yzcor-reminder-community-app.vercel.app";
const SHARE_TEXT = "יזכור — אפליקציה לניהול אזכרות וזיכרון משפחתי 🕯️\nניהול אזכרות, תפילות, קברי משפחה ועוד — הכל במקום אחד.\n";

export function ShareAppButton() {
  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "יזכור — אזכרות וזיכרון משפחתי",
          text: SHARE_TEXT,
          url: APP_URL,
        });
      } catch {
        // user dismissed — ignore
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${SHARE_TEXT}${APP_URL}`);
        alert("הקישור הועתק!");
      } catch {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + APP_URL)}`,
          "_blank"
        );
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="שתף אפליקציה"
      className="p-2 rounded-xl transition-colors"
      style={{ color: "var(--muted-foreground)", background: "var(--muted)" }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    </button>
  );
}
