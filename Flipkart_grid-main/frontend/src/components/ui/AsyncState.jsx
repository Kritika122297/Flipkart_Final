import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

// Centered spinner shown while a tab's data is loading.
export function Loading({ label = "Loading live data…", height = 280 }) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 text-ink-faint" style={{ minHeight: height }}>
      <Loader2 className="animate-spin text-violet" size={28} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

// Error panel with a retry button — shown when an API call fails.
export function ErrorState({ error, onRetry, height = 280 }) {
  return (
    <div
      className="glass flex w-full flex-col items-center justify-center gap-3 rounded-card p-6 text-center"
      style={{ minHeight: height, borderColor: "rgba(251,77,109,0.3)" }}
    >
      <AlertTriangle className="text-rose" size={28} />
      <div>
        <p className="font-display text-ink-primary">Couldn't load data</p>
        <p className="mt-1 max-w-md text-sm text-ink-body">{error}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-inner border border-strong px-4 py-2 text-sm font-semibold text-ink-primary transition-colors hover:border-violet/50 hover:text-violet"
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
