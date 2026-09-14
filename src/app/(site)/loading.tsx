import { Skeleton } from "@/components/ui/skeleton";

export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-11 w-3/4 max-w-lg" />
      <Skeleton className="mt-3 h-11 w-1/2 max-w-sm" />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}
