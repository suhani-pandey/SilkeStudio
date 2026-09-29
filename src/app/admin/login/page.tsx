import type { Metadata } from "next";
import { connection } from "next/server";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = { title: "Owner login" };

export default async function AdminLoginPage() {
  // Render per request rather than once at build time. The site's CSP only lets scripts run that
  // carry the request's nonce, and a page built ahead of time has no request to take one from —
  // so a static login page would load but never become interactive.
  await connection();
  return <AdminLoginForm />;
}
