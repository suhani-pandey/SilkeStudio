import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import { LiveRefresh } from "@/components/admin/live-refresh";
import { getNotificationsForOwner } from "@/lib/actions/notifications";
import { getOwnerProfile } from "@/lib/supabase/server";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  // The authoritative role check. Middleware only confirms somebody is signed in, so that a
  // navigation never has to wait on a database round-trip before rendering anything.
  const [profile, notifications] = await Promise.all([
    getOwnerProfile(),
    getNotificationsForOwner(),
  ]);

  if (profile?.role !== "owner") redirect("/admin/login");

  return (
    <div className="flex min-h-screen">
      <LiveRefresh />

      <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 border-r lg:block">
        <div className="flex h-16 items-center px-6">
          <Link href="/admin" aria-label="Silke Studio admin home">
            <Logo />
          </Link>
        </div>
        <div className="px-4">
          <AdminNavLinks />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader initialNotifications={notifications} />
        <main className="flex-1 p-4 pb-24 sm:p-6 lg:pb-6">{children}</main>
        <AdminBottomNav />
      </div>
    </div>
  );
}
