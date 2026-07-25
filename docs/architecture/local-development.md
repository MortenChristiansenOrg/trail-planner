# Local Development

## First Run

Install dependencies from the repository root:

```bash
pnpm install
```

Start the local Convex deployment and web app:

```bash
pnpm dev
```

Convex writes its local deployment values to the root `.env.local`. After
functions are ready, `pnpm dev` runs the idempotent generated-catalog
synchronization and starts Vite with the local deployment URL. This explicit
development override prevents a deployment URL in `apps/web/.env.local` from
accidentally sending local catalog reads to a cloud backend.

After publishing catalog records while the development server is running, rerun
the compiler and synchronization explicitly:

```bash
pnpm catalog:compile
pnpm catalog:sync
```

## Clerk Issuer

`convex/auth.config.ts` requires a Clerk JWT issuer domain before Convex can
prepare functions. For local placeholder development, set a temporary issuer on
the local Convex deployment:

```bash
pnpm exec convex env set CLERK_JWT_ISSUER_DOMAIN https://placeholder.clerk.accounts.dev
```

Replace that value with the real Clerk issuer before testing authenticated
flows.
