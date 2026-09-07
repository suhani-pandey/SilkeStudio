import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { BottomNav } from "@/components/site/bottom-nav";
import { InstallPrompt } from "@/components/site/install-prompt";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [{ data }, t] = await Promise.all([supabase.auth.getUser(), getT()]);

  return (
    <>
      <SiteHeader />
      {/* Bottom padding clears the phone tab bar; removed once the header nav takes over. */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <SiteFooter />
      <BottomNav isLoggedIn={!!data.user} t={t.nav} />
      <InstallPrompt />
    </>
  );
}
