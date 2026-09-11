"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { businessInfo } from "@/lib/business-info";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the hosting platform's logs; the digest is what ties it to a specific request.
    console.error("Unhandled error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="bg-accent flex size-16 items-center justify-center rounded-full">
        <AlertCircle className="text-plum size-7" />
      </div>
      <h1 className="font-heading mt-6 text-3xl font-medium sm:text-4xl">Something went wrong</h1>
      <div className="rule-gold mx-auto mt-5" />
      <p className="text-muted-foreground mt-5 max-w-sm leading-relaxed">
        Sorry — that didn&apos;t load. Try again, and if it keeps happening give us a call and
        we&apos;ll sort your booking out over the phone.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="h-12 px-8" onClick={reset}>
          Try again
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 px-8">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
      <a
        href={businessInfo.phoneHref}
        className="text-muted-foreground hover:text-plum mt-8 inline-flex min-h-11 items-center text-sm"
      >
        {businessInfo.phone}
      </a>
      {error.digest && (
        <p className="text-muted-foreground mt-6 text-xs">Reference: {error.digest}</p>
      )}
    </div>
  );
}
