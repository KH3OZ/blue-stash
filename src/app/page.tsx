export default function Home() {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-lg font-medium text-foreground">Your stash is empty.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Entries you add will show up here.
      </p>
    </div>
  );
}
