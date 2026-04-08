"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";

const localeLabels: Record<string, string> = {
  he: "עב",
  en: "EN",
};

const localeAriaLabels: Record<string, string> = {
  he: "החלף לעברית",
  en: "Switch to English",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: string) {
    // Replace /he/ or /en/ prefix in pathname
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  }

  const otherLocales = routing.locales.filter((l) => l !== locale);

  return (
    <div className="flex items-center gap-1" role="group" aria-label="בחר שפה">
      {otherLocales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className="px-2 py-1 text-xs font-semibold rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label={localeAriaLabels[l]}
          lang={l}
        >
          {localeLabels[l]}
        </button>
      ))}
    </div>
  );
}
