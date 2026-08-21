import { StashSkeleton } from "@/components/stash/stash-collection-container";

export default function WallLoading() {
  return (
    <div>
      <div className="mb-5 flex items-center justify-end gap-2">
        <div className="h-9 w-36 animate-pulse rounded-full bg-foreground/5" />
        <div className="size-9 animate-pulse rounded-full bg-foreground/5" />
        <div className="h-9 w-20 animate-pulse rounded-full bg-foreground/5" />
      </div>
      <StashSkeleton />
    </div>
  );
}
