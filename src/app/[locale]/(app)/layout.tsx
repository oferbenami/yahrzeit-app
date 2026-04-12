import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { PwaInstallBanner } from "@/components/layout/PwaInstallBanner";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  return (
    <div
      className="flex min-h-dvh w-full"
      style={{ background: "var(--background)" }}
    >
      <AppNav locale={locale} />
      {/* Content area — on mobile add bottom padding for the fixed nav bar */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-w-0 overflow-x-hidden p-4 md:p-8 md:pb-8 outline-none"
        style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>
      <PwaInstallBanner />
    </div>
  );
}
