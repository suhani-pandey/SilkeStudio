import { SignupForm } from "@/components/auth/signup-form";
import { getT } from "@/lib/i18n/server";

export default async function SignupPage() {
  const t = await getT();
  return <SignupForm t={t.auth} />;
}
