import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <article className="border border-border bg-card overflow-hidden">
      {/* Image Skeleton */}
      <Skeleton className="h-56 w-full" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Seller Info */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>

        {/* Tags */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>

        {/* Stats */}
        <Skeleton className="h-4 w-32" />

        {/* Button */}
        <Skeleton className="h-10 w-full" />
      </div>
    </article>
  );
}
