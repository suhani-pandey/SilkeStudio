import { cn } from "@/lib/utils";

/** A soft placeholder block, shown while a screen's data is still on its way. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("bg-muted/70 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}
