export default function PromptLoading(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="aspect-[4/5] animate-pulse rounded-card border border-border bg-surface" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl border border-border bg-surface" />
    </div>
  );
}
