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

Fix published images crash-looping with "Cannot find module '/app/dist/src/main.js'". Two compounding root causes, both in every service's Dockerfile/package.json: `pnpm deploy` excludes anything matching `.gitignore` (including `dist/`) unless a `files` field says otherwise, and the generated Prisma Client from the build stage never carried into the deployed output's isolated `node_modules`. Fixed by declaring `"files": ["dist", "prisma", "prisma.config.ts"]` and regenerating the Prisma Client once more inside the deployed output in the runner stage. Verified locally end to end (build → deploy → regenerate → boot) for identity-service and inventory-service before pushing.
