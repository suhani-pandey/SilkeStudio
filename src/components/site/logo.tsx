import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed-aspect vector logo, no responsive srcset needed
    <img
      src="/images/logo-transparent.svg"
      alt="GlowNest Salon"
      width={167}
      height={88}
      className={cn("h-10 w-auto", className)}
    />
  );
}
