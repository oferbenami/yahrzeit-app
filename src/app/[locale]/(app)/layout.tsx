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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="flex min-h-screen">
      <AppNav locale={locale} />
      <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-auto outline-none">
        {children}
      </main>
      <PwaInstallBanner />
    </div>
  );
}
