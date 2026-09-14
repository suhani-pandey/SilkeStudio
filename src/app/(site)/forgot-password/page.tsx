"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(email);
      if (result?.error) setError(result.error);
      else setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-center">
        <div className="bg-accent mx-auto flex size-14 items-center justify-center rounded-full">
          <MailCheck className="text-clay size-6" />
        </div>
        <h1 className="font-heading mt-6 text-3xl font-medium">Check your email</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          If an account exists for {email}, we&apos;ve sent a link to set a new password.
        </p>
        <Button asChild variant="outline" className="mt-8 h-12 px-8">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <p className="eyebrow text-center">Account</p>
      <h1 className="font-heading mt-3 text-center text-4xl font-medium">Reset password</h1>
      <div className="rule-copper mx-auto mt-5" />
      <p className="text-muted-foreground mt-5 text-center text-sm">
        We&apos;ll email you a link to choose a new one.
      </p>

      <Card className="border-border/60 mt-8">
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email" className="mb-1.5 block">
                Email
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
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="h-12 w-full" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        <Link href="/login" className="hover:text-foreground">
          ← Back to log in
        </Link>
      </p>
    </div>
  );
}
