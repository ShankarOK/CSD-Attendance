'use client'

import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  )
}

/** Shimmer overlay for skeleton (use inside a relative container with overflow-hidden) */
function SkeletonShimmer() {
  return (
    <span
      className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5"
      aria-hidden
    />
  )
}

export { Skeleton, SkeletonShimmer }
