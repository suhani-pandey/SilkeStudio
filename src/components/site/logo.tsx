import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed-aspect vector logo, no responsive srcset needed
    <img
      src="/images/logo-silke.svg"
      alt="Silke Studio"
      width={300}
      height={96}
      className={cn("h-10 w-auto", className)}
    />
  );
}
