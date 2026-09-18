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

Fix crash when `NODE_ENV` isn't exactly `production` at runtime: the logger only skipped the `pino-pretty` transport when `NODE_ENV === 'production'`, so any other value (unset included) tried to require `pino-pretty`, a devDependency not present in the production image, and crashed. Changed to explicitly opt into pretty-printing only when `NODE_ENV === 'development'`, so any misconfigured or unset value now fails safe (structured JSON logging) instead of crashing. Verified locally with `NODE_ENV` unset against a built `pnpm deploy` output — boots past logger init now.
