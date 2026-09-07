import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";
import { getNotificationsForOwner } from "@/lib/actions/notifications";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const notifications = await getNotificationsForOwner();

  return (
    <div className="flex min-h-screen">
      <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 border-r lg:block">
        <div className="flex h-16 items-center px-6">
          <Link href="/admin" aria-label="GlowNest admin home">
            <Logo />
          </Link>
        </div>
        <div className="px-4">
          <AdminNavLinks />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader initialNotifications={notifications} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
