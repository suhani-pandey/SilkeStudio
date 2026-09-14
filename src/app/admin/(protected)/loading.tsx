import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown the instant an admin link is tapped, so a navigation never leaves the previous screen
 * sitting there looking frozen while the next one loads.
 */
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <Skeleton className="h-9 w-52" />
      <Skeleton className="mt-3 h-5 w-72" />

      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
