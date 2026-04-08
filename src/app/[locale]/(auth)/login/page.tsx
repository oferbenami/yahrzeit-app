"use client";

import { useState, useId } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { loginWithEmail, loginWithGoogle, sendOtp, verifyOtp } from "@/lib/auth/actions";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type LoginMode = "password" | "otp" | "otp-verify";

function YahrzeitCandle() {
  return (
    <div className="flex flex-col items-center select-none" aria-hidden="true">
      {/* Flame */}
      <div className="relative w-10 h-16 flex items-end justify-center mb-0">
        {/* Outer flame */}
        <div
          className="absolute bottom-0 w-7 h-14 rounded-t-full rounded-b-sm origin-bottom"
          style={{
            background: "linear-gradient(to top, #f97316, #fbbf24, #fef3c7)",
            animation: "flicker 1.8s ease-in-out infinite alternate",
            filter: "blur(0.5px)",
          }}
        />
        {/* Inner flame */}
        <div
          className="absolute bottom-1 w-3.5 h-8 rounded-t-full rounded-b-sm origin-bottom"
          style={{
            background: "linear-gradient(to top, #fbbf24, #fef9c3, #ffffff)",
            animation: "flicker 1.3s ease-in-out infinite alternate-reverse",
            filter: "blur(0.3px)",
          }}
        />
        {/* Glow */}
        <div
          className="absolute bottom-0 w-14 h-14 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)",
            animation: "glow 1.8s ease-in-out infinite alternate",
          }}
        />
      </div>
      {/* Wick */}
      <div className="w-0.5 h-2 bg-gray-700 rounded-full" />
      {/* Candle body */}
      <div
        className="w-10 h-24 rounded-b-lg relative overflow-hidden"
        style={{
          background: "linear-gradient(to right, #f1f5f9, #ffffff, #e2e8f0)",
          boxShadow: "inset -3px 0 6px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        {/* Wax drip */}
        <div
          className="absolute top-0 right-2 w-2 h-6 rounded-b-full"
          style={{ background: "rgba(241,245,249,0.9)" }}
        />
      </div>
      {/* Candle base plate */}
      <div
        className="w-14 h-2 rounded-full mt-0.5"
        style={{ background: "linear-gradient(to right, #cbd5e1, #e2e8f0, #cbd5e1)" }}
      />

      <style>{`
        @keyframes flicker {
          0%   { transform: rotate(-3deg) scaleX(0.95) scaleY(1); }
          25%  { transform: rotate(2deg) scaleX(1.05) scaleY(0.97); }
          50%  { transform: rotate(-2deg) scaleX(0.98) scaleY(1.03); }
          75%  { transform: rotate(3deg) scaleX(1.02) scaleY(0.96); }
          100% { transform: rotate(-1deg) scaleX(1) scaleY(1.02); }
        }
        @keyframes glow {
          0%   { opacity: 0.6; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes flicker { 0%, 100% { transform: none; } }
          @keyframes glow    { 0%, 100% { opacity: 0.8; } }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations();
  const [mode, setMode] = useState<LoginMode>("password");
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
    if (result?.error) {
      setError(result.error);
    } else {
      setMode("otp-verify");
    }
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
    "w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #1e1a2e 100%)",
      }}
    >
      {/* Ambient glow behind candle */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 40% 30% at 50% 18%, rgba(251,191,36,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Candle above card */}
        <div className="flex justify-center mb-[-1.5rem] relative z-20">
          <YahrzeitCandle />
        </div>

        <div
          className="bg-card rounded-2xl shadow-2xl border border-border pt-10 pb-8 px-8"
          style={{ boxShadow: "0 0 60px rgba(251,191,36,0.08), 0 25px 50px rgba(0,0,0,0.4)" }}
        >
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground tracking-wide">יזכור</h1>
            <p className="text-muted-foreground text-sm mt-1">לזכרם לעד</p>
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="mt-4">
            {/* Password Login */}
            {mode === "password" && (
              <form onSubmit={handlePasswordLogin} noValidate aria-label="כניסה עם אימייל וסיסמה">
                <div className="space-y-4">
                  <div>
                    <label htmlFor={emailId} className="block text-sm font-medium text-foreground mb-1.5">
                      {t("auth.email")}
                    </label>
                    <input
                      id={emailId}
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className={inputClass}
                      dir="ltr"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label htmlFor={passwordId} className="block text-sm font-medium text-foreground mb-1.5">
                      {t("auth.password")}
                    </label>
                    <input
                      id={passwordId}
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      className={inputClass}
                      dir="ltr"
                      aria-required="true"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    aria-busy={loading}
                  >
                    {loading ? <LoadingSpinner size="sm" label="מתחבר..." /> : t("auth.login")}
                  </button>
                </div>
              </form>
            )}

            {/* OTP Send */}
            {mode === "otp" && (
              <form onSubmit={handleSendOtp} noValidate aria-label="כניסה עם קוד חד פעמי">
                <div className="space-y-4">
                  <div>
                    <label htmlFor={emailId} className="block text-sm font-medium text-foreground mb-1.5">
                      {t("auth.email")}
                    </label>
                    <input
                      id={emailId}
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className={inputClass}
                      dir="ltr"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <LoadingSpinner size="sm" label="שולח קוד..." /> : t("auth.sendOtp")}
                  </button>
                </div>
              </form>
            )}

            {/* OTP Verify */}
            {mode === "otp-verify" && (
              <form onSubmit={handleVerifyOtp} noValidate aria-label="אימות קוד חד פעמי">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    קוד נשלח אל <strong dir="ltr">{otpEmail}</strong>
                  </p>
                  <div>
                    <label htmlFor={tokenId} className="block text-sm font-medium text-foreground mb-1.5">
                      {t("auth.enterOtp")}
                    </label>
                    <input
                      id={tokenId}
                      name="token"
                      type="text"
                      required
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
                      dir="ltr"
                      aria-label="קוד חד פעמי בן 6 ספרות"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <LoadingSpinner size="sm" label="מאמת..." /> : t("auth.login")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("otp")}
                    className="inline-link w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    שלח קוד חדש
                  </button>
                </div>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-5" role="separator" aria-hidden="true">
              <hr className="flex-1 border-border" />
              <span className="text-xs text-muted-foreground">או</span>
              <hr className="flex-1 border-border" />
            </div>

            {/* Google Login */}
            <button
              onClick={() => loginWithGoogle()}
              className="w-full py-2.5 border border-border rounded-xl font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-3"
              aria-label="כניסה עם חשבון Google"
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
            <div className="flex justify-between mt-5 text-sm">
              {mode === "password" ? (
                <button
                  type="button"
                  onClick={() => setMode("otp")}
                  className="inline-link text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("auth.loginWithOtp")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode("password")}
                  className="inline-link text-muted-foreground hover:text-foreground transition-colors"
                >
                  כניסה עם סיסמה
                </button>
              )}
              <Link href="register" className="inline-link text-muted-foreground hover:text-foreground transition-colors">
                {t("auth.noAccount")}{" "}
                <span className="text-primary font-semibold">{t("auth.register")}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
