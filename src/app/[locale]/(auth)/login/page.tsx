"use client";

import { useState, useId } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { loginWithEmail, loginWithGoogle, sendOtp, verifyOtp } from "@/lib/auth/actions";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { gregorianToHebrew } from "@/lib/hebrew-calendar";

type LoginMode = "password" | "otp" | "otp-verify";

export default function LoginPage() {
  const t = useTranslations();
  const [mode, setMode] = useState<LoginMode>("password");

  const today = new Date();
  const hebrewToday = gregorianToHebrew(today);
  const gregorianStr = today.toLocaleDateString("he-IL", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  const emailId = useId();
  const passwordId = useId();
  const tokenId = useId();

  async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await loginWithEmail(new FormData(e.currentTarget));
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    setOtpEmail(fd.get("email") as string);
    const result = await sendOtp(fd);
    if (result?.error) { setError(result.error); } else { setMode("otp-verify"); }
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.append("email", otpEmail);
    const result = await verifyOtp(fd);
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-[#e0caa0] rounded-xl bg-white/80 text-[#3a2a1e] placeholder:text-[#b89870] focus:outline-none focus:ring-2 focus:ring-[#c9a84c] transition-shadow text-sm";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #c8dff0 0%, #a8cce0 20%, #d4b896 65%, #b89060 85%, #4a3020 100%)",
      }}
    >
      {/* Sky glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(255,240,180,0.5) 0%, transparent 70%)",
        }}
      />

      {/* Silhouette overlay at bottom */}
      <div
        className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
        aria-hidden="true"
        style={{
          background: "linear-gradient(to top, #2a1a08 0%, #3a2a10 40%, transparent 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-4 flex flex-col items-center gap-0 animate-fade-in-up">

        {/* Hero image */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl mb-[-2rem]" style={{ aspectRatio: "9/10" }}>
          <Image
            src="/open.png"
            alt="יזכור - לזכרם לעד"
            fill
            className="object-cover object-top"
            priority
          />
          {/* Gradient overlay at bottom of image for smooth bleed into form */}
          <div
            className="absolute bottom-0 inset-x-0 h-24"
            style={{ background: "linear-gradient(to top, rgba(255,253,248,1) 0%, transparent 100%)" }}
          />
        </div>

        {/* Form card */}
        <div
          className="w-full rounded-3xl pt-10 pb-7 px-6 relative"
          style={{
            background: "rgba(255,253,248,0.97)",
            boxShadow: "0 20px 60px rgba(60,30,0,0.25), 0 0 0 1px rgba(200,168,80,0.25)",
          }}
        >
          {/* Gold divider */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="flex-1 h-px bg-gradient-to-l from-[#c9a84c] to-transparent" />
            <svg className="w-5 h-5 text-[#c9a84c] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.4 5.4H20l-4.4 4 1.6 5.6L12 14l-5.2 3 1.6-5.6L4 7.4h5.6L12 2z" />
            </svg>
            <span className="flex-1 h-px bg-gradient-to-r from-[#c9a84c] to-transparent" />
          </div>

          {/* Dates */}
          <div className="text-center mb-5">
            <p className="text-xs text-[#8b6a4f]">{gregorianStr}</p>
            <p className="text-base font-semibold text-[#b8860b] mt-0.5">{hebrewToday.hebrewString}</p>
          </div>

          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

          {/* Password Login */}
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} noValidate aria-label="כניסה עם אימייל וסיסמה" className="space-y-3">
              <div>
                <label htmlFor={emailId} className="block text-xs font-semibold text-[#6b4c35] mb-1">
                  {t("auth.email")}
                </label>
                <input id={emailId} name="email" type="email" required autoComplete="email" className={inputClass} dir="ltr" />
              </div>
              <div>
                <label htmlFor={passwordId} className="block text-xs font-semibold text-[#6b4c35] mb-1">
                  {t("auth.password")}
                </label>
                <input id={passwordId} name="password" type="password" required autoComplete="current-password" className={inputClass} dir="ltr" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #c9a84c 0%, #8b6010 100%)", boxShadow: "0 4px 14px rgba(184,134,11,0.4)" }}
              >
                {loading ? <LoadingSpinner size="sm" label="מתחבר..." /> : t("auth.login")}
              </button>
            </form>
          )}

          {/* OTP Send */}
          {mode === "otp" && (
            <form onSubmit={handleSendOtp} noValidate className="space-y-3">
              <div>
                <label htmlFor={emailId} className="block text-xs font-semibold text-[#6b4c35] mb-1">{t("auth.email")}</label>
                <input id={emailId} name="email" type="email" required autoComplete="email" className={inputClass} dir="ltr" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #c9a84c 0%, #8b6010 100%)", boxShadow: "0 4px 14px rgba(184,134,11,0.4)" }}
              >
                {loading ? <LoadingSpinner size="sm" label="שולח קוד..." /> : t("auth.sendOtp")}
              </button>
            </form>
          )}

          {/* OTP Verify */}
          {mode === "otp-verify" && (
            <form onSubmit={handleVerifyOtp} noValidate className="space-y-3">
              <p className="text-xs text-[#8b6a4f] text-center">קוד נשלח אל <strong dir="ltr">{otpEmail}</strong></p>
              <div>
                <label htmlFor={tokenId} className="block text-xs font-semibold text-[#6b4c35] mb-1">{t("auth.enterOtp")}</label>
                <input
                  id={tokenId} name="token" type="text" required maxLength={6} inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #c9a84c 0%, #8b6010 100%)", boxShadow: "0 4px 14px rgba(184,134,11,0.4)" }}
              >
                {loading ? <LoadingSpinner size="sm" label="מאמת..." /> : t("auth.login")}
              </button>
              <button type="button" onClick={() => setMode("otp")} className="inline-link w-full text-center text-xs text-[#8b6a4f] hover:text-[#b8860b] transition-colors">
                שלח קוד חדש
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-4" role="separator" aria-hidden="true">
            <hr className="flex-1 border-[#e0caa0]" />
            <span className="text-xs text-[#b89870]">או</span>
            <hr className="flex-1 border-[#e0caa0]" />
          </div>

          {/* Google Login */}
          <button
            onClick={() => loginWithGoogle()}
            className="w-full py-2.5 border border-[#e0caa0] rounded-xl font-medium text-[#3a2a1e] hover:bg-[#f5e9d4] transition-colors flex items-center justify-center gap-3 bg-white/70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t("auth.loginWithGoogle")}
          </button>

          {/* Mode toggles */}
          <div className="flex justify-between mt-4 text-xs">
            {mode === "password" ? (
              <button type="button" onClick={() => setMode("otp")} className="inline-link text-[#8b6a4f] hover:text-[#b8860b] transition-colors">
                {t("auth.loginWithOtp")}
              </button>
            ) : (
              <button type="button" onClick={() => setMode("password")} className="inline-link text-[#8b6a4f] hover:text-[#b8860b] transition-colors">
                כניסה עם סיסמה
              </button>
            )}
            <Link href="register" className="inline-link text-[#8b6a4f] hover:text-[#b8860b] transition-colors">
              {t("auth.noAccount")}{" "}
              <span className="text-[#b8860b] font-semibold">{t("auth.register")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
