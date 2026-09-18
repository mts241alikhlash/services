# hr-service

## 0.1.6

### Patch Changes

- ae5596e: Move `pino-pretty` from `devDependencies` to `dependencies` in all 9 services. The earlier fix (only load the `pino-pretty` transport when `NODE_ENV === 'development'` exactly, instead of whenever it isn't `'production'`) stopped an unset/misconfigured `NODE_ENV` from crashing the container, but deliberately setting `NODE_ENV=development` on a deployed image — a legitimate want, e.g. for verbose staging logs — still crashed, because `pino-pretty` genuinely wasn't in the production image (`pnpm deploy --prod` only ships `dependencies`). Same shape of bug as the `tsx`-for-seeds fix earlier today: a devDependency that a supported runtime path actually needs. Verified locally: `pino-pretty` now lands in a `pnpm deploy --prod` output, and `NODE_ENV=development node dist/src/main.js` boots past logger init to the (expected, unrelated) missing-secrets validation instead of crashing.

## 0.1.5

### Patch Changes

- a5b0d27: Fix crash when `NODE_ENV` isn't exactly `production` at runtime: the logger only skipped the `pino-pretty` transport when `NODE_ENV === 'production'`, so any other value (unset included) tried to require `pino-pretty`, a devDependency not present in the production image, and crashed. Changed to explicitly opt into pretty-printing only when `NODE_ENV === 'development'`, so any misconfigured or unset value now fails safe (structured JSON logging) instead of crashing. Verified locally with `NODE_ENV` unset against a built `pnpm deploy` output — boots past logger init now.

## 0.1.4

### Patch Changes

- 74406ec: Fix published images crash-looping with "Cannot find module '/app/dist/src/main.js'". Two compounding root causes, both in every service's Dockerfile/package.json: `pnpm deploy` excludes anything matching `.gitignore` (including `dist/`) unless a `files` field says otherwise, and the generated Prisma Client from the build stage never carried into the deployed output's isolated `node_modules`. Fixed by declaring `"files": ["dist", "prisma", "prisma.config.ts"]` and regenerating the Prisma Client once more inside the deployed output in the runner stage. Verified locally end to end (build → deploy → regenerate → boot) for identity-service and inventory-service before pushing.

## 0.1.3

### Patch Changes

- 6962417: Republish service images. The previous images were deleted while recovering from an orphaned-package registry issue and never got rebuilt (an empty diff never re-triggers `publish-images`); this changeset forces a real one.

## 0.1.2

### Patch Changes

- 8f346ca: Fix pnpm deploy failing on ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE (needs
  --legacy since pnpm v10, since none of these services inject a sibling
  workspace package).

## 0.1.1

### Patch Changes

- 13ee237: Run service containers as the non-root node user, fix a Docker build-stage
  prisma generate failure (missing DATABASE_URL), and rename the shared logger
  label from siakad-api to mts241alikhlash-api.
