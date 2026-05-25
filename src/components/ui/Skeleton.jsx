import { cn } from '../../lib/utils'

export function Skeleton({ className, count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn('skeleton animate-pulse', className)}
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100/80 bg-white/80 p-5 shadow-sm">
      <Skeleton className="h-4 w-1/3 rounded-lg" />
      <Skeleton className="mt-3 h-8 w-1/4 rounded-lg" />
      <Skeleton className="mt-2 h-3 w-1/2 rounded-lg" />
    </div>
  )
}

export function SkeletonList({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-gray-100/80 bg-white/60 p-4 shadow-sm">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-lg" />
            <Skeleton className="h-3 w-1/4 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
