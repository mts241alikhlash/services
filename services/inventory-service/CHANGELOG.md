# inventory-service

## 0.1.5

### Patch Changes

- 74406ec: Fix published images crash-looping with "Cannot find module '/app/dist/src/main.js'". Two compounding root causes, both in every service's Dockerfile/package.json: `pnpm deploy` excludes anything matching `.gitignore` (including `dist/`) unless a `files` field says otherwise, and the generated Prisma Client from the build stage never carried into the deployed output's isolated `node_modules`. Fixed by declaring `"files": ["dist", "prisma", "prisma.config.ts"]` and regenerating the Prisma Client once more inside the deployed output in the runner stage. Verified locally end to end (build → deploy → regenerate → boot) for identity-service and inventory-service before pushing.

## 0.1.4

### Patch Changes

- 6962417: Republish service images. The previous images were deleted while recovering from an orphaned-package registry issue and never got rebuilt (an empty diff never re-triggers `publish-images`); this changeset forces a real one.

## 0.1.3

### Patch Changes

- 8f346ca: Fix pnpm deploy failing on ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE (needs
  --legacy since pnpm v10, since none of these services inject a sibling
  workspace package).

## 0.1.2

### Patch Changes

- 13ee237: Run service containers as the non-root node user, fix a Docker build-stage
  prisma generate failure (missing DATABASE_URL), and rename the shared logger
  label from siakad-api to mts241alikhlash-api.

## 0.1.1

### Patch Changes

- f0456e8: Align the Inventory OpenAPI metadata with the service package version and validate contract version identity in CI.
