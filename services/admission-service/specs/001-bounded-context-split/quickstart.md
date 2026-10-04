# Quickstart: Bounded-Context Split

Run from `admission-service`:

```bash
pnpm run typecheck
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=admission
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest app.module.boots.spec.ts
pnpm run validate
```

Expected: all commands exit zero. Compare route and permission metadata through
the existing route and API response tests; no database is required for the path
move.
