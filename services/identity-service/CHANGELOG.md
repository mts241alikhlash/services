# identity-service

## 0.1.6

### Patch Changes

- fcff10c: Fix seed scripts (`seed:iam`, `seed:admin-minimal`, `seed:profile-references`, `seed:regions`, `seed:reference-data`, `seed:timetable`) being unrunnable against the published production image: they imported `pgSslOptions` from `../src/core/database/pg-ssl.js`, a path `pnpm deploy --prod` never ships. For `academic-service`, whose seeds needed only that one small utility, moved `pg-ssl.ts` into `prisma/` (shared by the app and the seeds, both already ship). `identity-service`'s seeds also reach much deeper into `src/` (the 268-entry permission catalogue, region domain logic) — not worth duplicating, so `src` was added to its `files` field instead. Both services also had `tsx` in devDependencies, so even a fixed import path couldn't execute in the production image; moved to `dependencies`.
  
  Root cause found on a real production deploy: `role_permissions` was empty for every role (`seed:iam` never ran successfully), so every signed-in user had zero permissions and the frontend spun forever with nowhere to redirect.
  
  Verified locally end to end against a `pnpm deploy --prod` output for both services: `seed-iam.ts` and `seed-reference-data.ts` now run past all module resolution and reach the real database call.

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
