# Notification Checkpoint

Date: 2026-09-13
Scope: T013 only. Stage 1 move-only extraction. No notification creation, read ownership, text, route, permission, DTO, response, persistence, or integration behavior changes.

## Moved Files

- `src/admission/services/admission-notification.service.ts` -> `src/admission/notification/services/admission-notification.service.ts`
- `src/admission/use-cases/get-my-notifications.use-case.ts` -> `src/admission/notification/use-cases/get-my-notifications.use-case.ts`
- `src/admission/use-cases/mark-notification-read.use-case.ts` -> `src/admission/notification/use-cases/mark-notification-read.use-case.ts`
- Notification ownership assertions extracted from `src/admission/applicant/use-cases/admission-applicant.use-cases.spec.ts` -> `src/admission/notification/use-cases/admission-notification.use-cases.spec.ts`

`src/admission/presentation/admission-applicant.controller.ts` remains in place. Its notification use-case imports now target `src/admission/notification/`. `src/admission/admission.module.ts` remains the composition root. Its notification provider imports now target `src/admission/notification/`. All notification-producing use cases and related test fixtures now target the moved notification service.

The shared `src/shared/domain/enums/admission-notification-type.enum.ts` remains in place. It is shared notification vocabulary, not a notification service/use-case file.

## Source-Only Relative Stale-Path Scan

This resolves relative `from` and static/dynamic `import` specifiers against the three old flat notification production paths. It scans only `src/**/*.ts` and excludes checkpoint prose and generated output.

Command:

```text
node -e "const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');const old=['src/admission/services/admission-notification.service.ts','src/admission/use-cases/get-my-notifications.use-case.ts','src/admission/use-cases/mark-notification-read.use-case.ts'].map(p=>path.resolve(p));const output=cp.execFileSync('rg',['--files','src','-g','*.ts'],{encoding:'utf8'}).trim();const files=output?output.split(/\r?\n/).filter(Boolean):[];const re=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)[\"'](\.[^\"']+)[\"']/g;const hits=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(re)){const target=path.resolve(path.dirname(file),m[1]).replace(/\.js$/i,'.ts');if(old.includes(target))hits.push(file+': '+m[1]);}}if(hits.length){console.error(hits.join('\n'));process.exit(1)}console.log('No relative imports resolve to old flat notification paths.');"
```

Result:

```text
No relative imports resolve to old flat notification paths.
```

The three old flat notification source paths are absent after the move. No source-only stale relative imports remain.

## Generated Distinction

Command:

```text
rg -l "services/admission-notification\.service\.js|use-cases/(get-my-notifications|mark-notification-read)\.use-case\.js" dist
```

Result: matches remain in pre-move generated output under `dist/src/admission/`, including old service/use-case references from controllers, the root module, and notification-producing use cases. `dist/` is generated output, was not edited for T013, and is excluded from source ownership and stale-import verification. A later build regenerates it.

## Commands And Results

### Focused notification and adjacent workflow suites

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest src/admission/notification/use-cases/admission-notification.use-cases.spec.ts src/admission/applicant/use-cases/admission-applicant.use-cases.spec.ts src/admission/document/use-cases/admission-document.use-cases.spec.ts src/admission/use-cases/admission-workflow.use-cases.spec.ts
```

```text
(node:7284) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(node:8472) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(node:9796) ExperimentalWarning: VM Modules is an experimental feature and might change at any time

Test Suites: 4 passed, 4 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        4.865 s
Ran all test suites matching src/admission/notification/use-cases/admission-notification.use-cases.spec.ts|src/admission/applicant/use-cases/admission-applicant.use-cases.spec.ts|src/admission/document/use-cases/admission-document.use-cases.spec.ts|src/admission/use-cases/admission-workflow.use-cases.spec.ts.
```

Result: PASS. Existing Node VM Modules experimental warnings only.

### Route and boot tests

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest route-collisions.spec.ts app.module.boots.spec.ts
```

```text
(node:1900) ExperimentalWarning: VM Modules is an experimental feature and might change at any time

Test Suites: 2 passed, 2 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        6.181 s
Ran all test suites matching route-collisions.spec.ts|app.module.boots.spec.ts.
```

Result: PASS. Existing Node VM Modules experimental warning only.

### `pnpm run typecheck`

```text
$ tsc --noEmit
```

Result: PASS. Exit code 0.

### `pnpm exec prettier --check "src/**/*.ts"`

```text
Checking formatting...
All matched files use Prettier code style!
```

Result: PASS. Exit code 0.

## Concerns

- `IAdmissionApplicantRepository` remains broad and continues serving notification creation, notification reads, applicant flows, document/payment flows, wave flows, and announcement flows. Stage 1 preserves this cross-context edge; repository redesign is excluded.
- Notification creation still calls `createNotification` through `AdmissionNotificationService` with the existing application scope, type, title, and message values.
- Notification read ownership still resolves the applicant application before listing notifications and uses `findMyNotification(userId, notificationId)` before marking one read. The all-read operation still calls `markAllNotificationsRead(userId)`.
- Notification routes remain in `AdmissionApplicantController` with existing JWT guard, route paths, UUID parsing, permissions, response envelope, and DTO behavior.
- `dist/` has stale pre-move generated output until a build regenerates it. No generated output was changed in T013.
- No Git commit created. Workspace has no repository metadata, as recorded in `preflight.md`.
