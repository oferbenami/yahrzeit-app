"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { registerWithEmail } from "@/lib/auth/actions";

export default function RegisterPage() {
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await registerWithEmail(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-8 border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">הרשמה</h1>
          <p className="text-muted-foreground mt-1">צור חשבון חדש</p>
        </div>

        {done ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-bold text-foreground text-lg">בדוק את המייל שלך</p>
            <p className="text-sm text-muted-foreground">
              שלחנו לך קישור לאימות כתובת המייל.<br />
              לחץ על הקישור במייל כדי להשלים את ההרשמה.
            </p>
            <Link
              href="../login"
              className="inline-block mt-2 text-sm font-semibold text-primary hover:underline"
            >
              חזור לכניסה
            </Link>
          </div>
        ) : (
          <>
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("auth.fullName")}
            </label>
            <input
              name="full_name"
              type="text"
              required
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("auth.email")}
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("auth.phone")}
            </label>
            <input
              name="phone"
              type="tel"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              dir="ltr"
              placeholder="+972..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("auth.password")}
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              dir="ltr"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? t("common.loading") : t("auth.register")}
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link href="../login" className="text-primary font-medium hover:underline">
            {t("auth.login")}
          </Link>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
