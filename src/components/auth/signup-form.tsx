"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpCustomer } from "@/lib/actions/auth";

export function SignupForm({ t }: { t: Dictionary["auth"] }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signUpCustomer({ fullName, email, password, phone });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <p className="eyebrow text-center">{t.accountEyebrow}</p>
      <h1 className="font-heading mt-3 text-center text-4xl font-medium">{t.signupTitle}</h1>
      <div className="rule-gold mx-auto mt-5" />
      <p className="text-muted-foreground mt-5 text-center text-sm">
        {t.signupBody}
      </p>

      <Card className="border-border/60 mt-8">
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="fullName" className="mb-1.5 block">
                {t.fullName}
              </Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11" />
            </div>
            <div>
              <Label htmlFor="phone" className="mb-1.5 block">
                {t.phone}
              </Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
            </div>
            <div>
              <Label htmlFor="email" className="mb-1.5 block">
                {t.email}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div>
              <Label htmlFor="password" className="mb-1.5 block">
                {t.password}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="h-12 w-full" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : t.signUp}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {t.haveAccount}{" "}
        <Link href="/login" className="text-primary font-medium">
          {t.logIn}
        </Link>
      </p>
    </div>
  );
}
