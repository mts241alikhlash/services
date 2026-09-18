# Quickstart: Admission Module Layering

Run after each context slice:

```bash
pnpm run typecheck
pnpm run lint
pnpm run lint:strict
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=admission
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest app.module.boots.spec.ts
```

Run after all seven slices:

```bash
pnpm run validate
```

Search checks must show no context-local application import of DTO/Prisma and no
presentation import of repository internals.
