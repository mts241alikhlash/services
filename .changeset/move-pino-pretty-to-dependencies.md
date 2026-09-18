---
"identity-service": patch
"academic-service": patch
"inventory-service": patch
"presence-service": patch
"portal-service": patch
"admission-service": patch
"hr-service": patch
"student-service": patch
"assessment-service": patch
---

Move `pino-pretty` from `devDependencies` to `dependencies` in all 9 services. The earlier fix (only load the `pino-pretty` transport when `NODE_ENV === 'development'` exactly, instead of whenever it isn't `'production'`) stopped an unset/misconfigured `NODE_ENV` from crashing the container, but deliberately setting `NODE_ENV=development` on a deployed image — a legitimate want, e.g. for verbose staging logs — still crashed, because `pino-pretty` genuinely wasn't in the production image (`pnpm deploy --prod` only ships `dependencies`). Same shape of bug as the `tsx`-for-seeds fix earlier today: a devDependency that a supported runtime path actually needs. Verified locally: `pino-pretty` now lands in a `pnpm deploy --prod` output, and `NODE_ENV=development node dist/src/main.js` boots past logger init to the (expected, unrelated) missing-secrets validation instead of crashing.
