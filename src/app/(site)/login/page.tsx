import { LoginForm } from "@/components/auth/login-form";
import { getT } from "@/lib/i18n/server";

export default async function LoginPage() {
  const t = await getT();
  return <LoginForm t={t.auth} />;
}
