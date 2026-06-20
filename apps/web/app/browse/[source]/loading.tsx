export default function BrowseLoading(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-2xl border border-border bg-surface" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 15 }).map((_, idx) => (
          <div key={idx} className="aspect-[4/5] animate-pulse rounded-card border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
