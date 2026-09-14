"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    startTransition(async () => {
      const result = await updatePassword(password);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success("Password updated.");
      router.push("/login");
    });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <p className="eyebrow text-center">Account</p>
      <h1 className="font-heading mt-3 text-center text-4xl font-medium">Choose a new password</h1>
      <div className="rule-copper mx-auto mt-5" />

      <Card className="border-border/60 mt-8">
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="password" className="mb-1.5 block">
                New password
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
            <div>
              <Label htmlFor="confirm" className="mb-1.5 block">
                Confirm password
              </Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="h-12 w-full" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
