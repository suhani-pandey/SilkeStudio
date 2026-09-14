import { SiteHeader } from "@/components/site/site-header";
import { HomeHeroChrome } from "@/components/site/home-hero-chrome";
import { SiteFooter } from "@/components/site/site-footer";
import { BottomNav } from "@/components/site/bottom-nav";
import { InstallPrompt } from "@/components/site/install-prompt";
import { getSessionUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, t] = await Promise.all([getSessionUser(), getT()]);

  return (
    <>
      <HomeHeroChrome />
      <SiteHeader />
      {/* Bottom padding clears the phone tab bar; removed once the header nav takes over. */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <SiteFooter />
      <BottomNav isLoggedIn={!!user} t={t.nav} />
      <InstallPrompt />
    </>
  );
}
