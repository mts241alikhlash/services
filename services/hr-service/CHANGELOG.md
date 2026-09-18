# hr-service

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
