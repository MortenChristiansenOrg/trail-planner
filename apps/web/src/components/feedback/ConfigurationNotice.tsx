export function ConfigurationNotice() {
  return (
    <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
      Authentication and Convex are wired as integration points. Add local Clerk
      and Convex environment variables before enabling private app flows.
    </p>
  );
}
