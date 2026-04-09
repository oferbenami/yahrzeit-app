"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { logout } from "@/lib/auth/actions";
import { ThemeToggle } from "@/components/ui/ThemeProvider";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function StarOfDavidIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L9.5 7H4l4 3.5L6.5 16 12 12.5 17.5 16 16 10.5 20 7h-5.5L12 2z
               M12 5.2l1.4 3.1H17l-2.4 2.1.9 3.3L12 11.8l-3.5 1.9.9-3.3L7 8.3h3.6L12 5.2z" />
    </svg>
  );
}

export function AppNav({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const base = `/${locale}`;

  const navItems: NavItem[] = [
    {
      href: base,
      label: t("home"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: `${base}/calendar`,
      label: t("calendar"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: `${base}/groups`,
      label: t("groups"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      href: `${base}/dashboard`,
      label: t("dashboard"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: `${base}/profile`,
      label: t("profile"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex flex-col w-64 min-h-screen p-4 border-e"
        style={{
          background: "linear-gradient(180deg, #fdf7ee 0%, #f5e9d4 100%)",
          borderColor: "#e0caa0",
        }}
        aria-label="ניווט ראשי"
      >
        {/* Logo */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #c9a84c 0%, #8b6010 100%)" }}
            >
              <StarOfDavidIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none" style={{ color: "#b8860b" }}>יזכור</h1>
              <p className="text-xs leading-none mt-0.5" style={{ color: "#8b6a4f" }}>לזכרם לעד</p>
            </div>
          </div>
          <div className="h-px mt-4" style={{ background: "linear-gradient(to right, transparent, #c9a84c, transparent)" }} />
        </div>

        {/* Nav items */}
        <div className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== base && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={isActive ? {
                  background: "linear-gradient(135deg, #c9a84c22 0%, #c9a84c11 100%)",
                  color: "#b8860b",
                  borderLeft: "3px solid #c9a84c",
                  fontWeight: 700,
                } : {
                  color: "#8b6a4f",
                }}
              >
                {item.icon}
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mb-2 px-2">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-colors"
            style={{ color: "#8b6a4f" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium text-sm">{t("logout")}</span>
          </button>
        </form>
      </nav>

      {/* Mobile bottom nav — fixed, safe-area aware */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t"
        style={{
          background: "rgba(253,247,238,0.97)",
          borderColor: "#e0caa0",
          backdropFilter: "blur(12px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label="ניווט תחתון"
      >
        <div className="flex w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== base && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors min-w-0"
                style={{ color: isActive ? "#b8860b" : "#8b6a4f" }}
              >
                {item.icon}
                <span className="text-xs leading-none truncate w-full text-center">{item.label}</span>
                {isActive && (
                  <span className="w-4 h-0.5 rounded-full mt-0.5" style={{ background: "#c9a84c" }} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
