"use client";

import { useState } from "react";
import { regenerateInviteCode } from "@/lib/groups/actions";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const APP_URL = "https://yzcor-reminder-community-app.vercel.app";

export function InviteCodeCard({
  groupId,
  inviteCode,
  groupName,
}: {
  groupId: string;
  inviteCode: string;
  groupName?: string;
}) {
  const [code, setCode] = useState(inviteCode);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  function buildWhatsAppMessage() {
    const groupPart = groupName ? ` לקבוצה *"${groupName}"*` : "";
    const joinUrl = `${APP_URL}/he/join?code=${code}`;
    return `🕯️ *יזכור — אזכרות וזיכרון משפחתי*\n\nשלום!\nאני מזמין/ת אותך להצטרף${groupPart} ביישומון יזכור — ניהול אזכרות, ימי זיכרון, תפילות וקברי משפחה.\n\n📲 *לחץ/י על הקישור להצטרפות ישירה:*\n${joinUrl}\n\nלזכרם לעד`;
  }

  function handleShareApp() {
    const msg = encodeURIComponent(
      `שלום!\n\nאני ממליץ/ה לך על יישומון יזכור 🕯️\nניהול אזכרות, ימי זיכרון וקברי משפחה — הכל במקום אחד.\n\n📲 הכנס/הכנסי לאפליקציה:\n${APP_URL}\n\nלזכרם לעד`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(code);
      toast("קוד הועתק ללוח!", "success");
    } catch {
      toast("לא הצלחנו להעתיק", "error");
    }
  }

  async function handleCopyWhatsApp() {
    try {
      await navigator.clipboard.writeText(buildWhatsAppMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast("הודעת ווטסאפ הועתקה!", "success");
    } catch {
      toast("לא הצלחנו להעתיק", "error");
    }
  }

  function handleShareWhatsApp() {
    const msg = encodeURIComponent(buildWhatsAppMessage());
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  async function handleRegenerate() {
    const result = await regenerateInviteCode(groupId);
    if (result?.code) {
      setCode(result.code);
      toast("קוד הזמנה חודש בהצלחה", "success");
    } else if (result?.error) {
      toast(result.error, "error");
    }
    setShowConfirm(false);
  }

  return (
    <>
      <div
        className="rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, #fff8e8, #fef3d0)",
          border: "1px solid #c9a84c50",
          boxShadow: "0 3px 12px rgba(184,134,11,0.12)",
        }}
        aria-label="קוד הזמנה לקבוצה"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: "#b8860b" }}>קוד הזמנה לקבוצה</h3>
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs font-medium hover:underline"
            style={{ color: "#8b6a4f" }}
          >
            חדש קוד
          </button>
        </div>

        {/* Code row */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-2xl font-mono font-bold tracking-widest flex-1"
            dir="ltr"
            style={{ color: "#3a2a1e" }}
          >
            {code}
          </span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            העתק קוד
          </button>
        </div>

        {/* Divider */}
        <div className="h-px mb-3" style={{ background: "linear-gradient(to right, transparent, #c9a84c50, transparent)" }} />

        {/* WhatsApp invite section */}
        <p className="text-xs font-semibold mb-2" style={{ color: "#8b6a4f" }}>
          הזמנה לקבוצה זו
        </p>
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleCopyWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all"
            style={{ borderColor: "#c9a84c50", color: "#b8860b", background: "rgba(255,255,255,0.6)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? "הועתק!" : "העתק"}
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            שלח בווטסאפ
          </button>
        </div>

        {/* Share app — invite someone new to the app entirely */}
        <p className="text-xs font-semibold mb-2" style={{ color: "#8b6a4f" }}>
          שתף את האפליקציה
        </p>
        <button
          onClick={handleShareApp}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: "rgba(255,255,255,0.5)", border: "1px solid #c9a84c40", color: "#8b6010" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          הזמן חבר לאפליקציה 🕯️
        </button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="חדש קוד הזמנה"
        description="הקוד הנוכחי יפסיק לעבוד. קישורי הזמנה ישנים לא יהיו תקפים."
        confirmLabel="חדש קוד"
        cancelLabel="ביטול"
        onConfirm={handleRegenerate}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
