interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ message = 'Loading...', fullPage }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 rounded-full" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary-600 rounded-full animate-spin" />
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 animate-pulse">{message}</p>
    </div>
  );

  if (fullPage) {
    return <div className="min-h-[60vh] flex items-center justify-center">{content}</div>;
  }
  return content;
}

/* ── Skeleton primitives ─────────────────────────────── */

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16 mt-1" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border overflow-hidden animate-pulse">
      <div className="flex gap-4 p-4 border-b border-slate-200 dark:border-dark-border">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 dark:bg-slate-700 rounded" style={{ flex: i === 0 ? 3 : 1 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-4 border-b border-slate-50 dark:border-slate-800 last:border-b-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded" style={{ flex: c === 0 ? 3 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 'h-72' }: { height?: string }) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4" />
      <div className={`${height} bg-slate-100 dark:bg-slate-700/30 rounded-lg flex items-end justify-around px-4 pb-4 gap-2`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-slate-200 dark:bg-slate-700 rounded-t flex-1" style={{ height: `${20 + ((i * 37 + 13) % 60)}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
