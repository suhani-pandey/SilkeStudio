import Link from "next/link";
import type { Metadata } from "next";
import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { businessInfo } from "@/lib/business-info";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="bg-accent flex size-16 items-center justify-center rounded-full">
        <MapPinOff className="text-plum size-7" />
      </div>
      <p className="eyebrow mt-8">404</p>
      <h1 className="font-heading mt-3 text-3xl font-medium sm:text-4xl">
        We can&apos;t find that page
      </h1>
      <div className="rule-gold mx-auto mt-5" />
      <p className="text-muted-foreground mt-5 max-w-sm leading-relaxed">
        The link may be out of date. Everything is still one tap away from the home page — or call
        and we&apos;ll book you in ourselves.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="h-12 px-8">
          <Link href="/book">Book an appointment</Link>
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
    </div>
  );
}
