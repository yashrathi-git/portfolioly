export default function Loading() {
  return (
    <div className="min-h-[100svh] grid place-items-center relative overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Ambient loader background */}
      <div className="pointer-events-none absolute inset-0">
        {/* soft orbs */}
        <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full blur-3xl opacity-40 dark:opacity-20 bg-[oklch(0.84_0.07_250)]" />
        <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-[oklch(0.74_0.15_310)]" />
        {/* subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(0,0,0,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.35)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.08]" />
      </div>

      {/* Spinner */}
      <div className="relative flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-[color:var(--input)] border-t-[oklch(0.74_0.15_310)] animate-spin" />
        <span className="text-sm text-[color:var(--muted-foreground)]">Loading…</span>
      </div>
    </div>
  );
}