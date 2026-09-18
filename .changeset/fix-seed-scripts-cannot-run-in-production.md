---
"identity-service": patch
"academic-service": patch
---

Fix seed scripts (`seed:iam`, `seed:admin-minimal`, `seed:profile-references`, `seed:regions`, `seed:reference-data`, `seed:timetable`) being unrunnable against the published production image: they imported `pgSslOptions` from `../src/core/database/pg-ssl.js`, a path `pnpm deploy --prod` never ships. For `academic-service`, whose seeds needed only that one small utility, moved `pg-ssl.ts` into `prisma/` (shared by the app and the seeds, both already ship). `identity-service`'s seeds also reach much deeper into `src/` (the 268-entry permission catalogue, region domain logic) — not worth duplicating, so `src` was added to its `files` field instead. Both services also had `tsx` in devDependencies, so even a fixed import path couldn't execute in the production image; moved to `dependencies`.

Root cause found on a real production deploy: `role_permissions` was empty for every role (`seed:iam` never ran successfully), so every signed-in user had zero permissions and the frontend spun forever with nowhere to redirect.

Verified locally end to end against a `pnpm deploy --prod` output for both services: `seed-iam.ts` and `seed-reference-data.ts` now run past all module resolution and reach the real database call.
