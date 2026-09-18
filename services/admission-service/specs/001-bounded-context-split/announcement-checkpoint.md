# Announcement Checkpoint

Date: 2026-09-13
Scope: T005 only. Stage 1 move-only extraction. No behavior, route, DTO validation, permission, response, persistence, or integration changes.

## Moved Files

- `src/admission/domain/entities/admission-announcement.entity.ts` -> `src/admission/announcement/domain/entities/admission-announcement.entity.ts`
- `src/admission/domain/interfaces/admission-announcement-repository.interface.ts` -> `src/admission/announcement/domain/interfaces/admission-announcement-repository.interface.ts`
- `src/admission/infrastructure/persistence/prisma-admission-announcement.repository.ts` -> `src/admission/announcement/infrastructure/persistence/prisma-admission-announcement.repository.ts`
- `src/admission/dto/request/admission-announcement-query.dto.ts` -> `src/admission/announcement/dto/request/admission-announcement-query.dto.ts`
- `src/admission/dto/request/create-admission-announcement.dto.ts` -> `src/admission/announcement/dto/request/create-admission-announcement.dto.ts`
- `src/admission/dto/request/update-admission-announcement.dto.ts` -> `src/admission/announcement/dto/request/update-admission-announcement.dto.ts`
- `src/admission/use-cases/get-admission-announcements.use-case.ts` -> `src/admission/announcement/use-cases/get-admission-announcements.use-case.ts`
- `src/admission/use-cases/get-published-announcements.use-case.ts` -> `src/admission/announcement/use-cases/get-published-announcements.use-case.ts`
- `src/admission/use-cases/create-admission-announcement.use-case.ts` -> `src/admission/announcement/use-cases/create-admission-announcement.use-case.ts`
- `src/admission/use-cases/update-admission-announcement.use-case.ts` -> `src/admission/announcement/use-cases/update-admission-announcement.use-case.ts`
- `src/admission/use-cases/publish-admission-announcement.use-case.ts` -> `src/admission/announcement/use-cases/publish-admission-announcement.use-case.ts`
- `src/admission/use-cases/delete-admission-announcement.use-case.ts` -> `src/admission/announcement/use-cases/delete-admission-announcement.use-case.ts`
- `src/admission/use-cases/admission-announcement.use-cases.spec.ts` -> `src/admission/announcement/use-cases/admission-announcement.use-cases.spec.ts`

`src/admission/presentation/admission-announcement.controller.ts` and root `src/admission/admission.module.ts` remain in place. Their announcement imports now target `src/admission/announcement/`. `admission-applicant.controller.ts`, `admission-applicant-repository.interface.ts`, and `prisma-admission-applicant.repository.ts` received only announcement path fixes for cross-context consumers.

## Source-Only Stale-Path Scan

This resolves relative `from` and static/dynamic `import` specifiers against all 13 old flat announcement paths. It scans only `src/**/*.ts` and does not inspect checkpoint prose or generated output.

Command:

```text
node -e "const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');const old=['src/admission/domain/entities/admission-announcement.entity.ts','src/admission/domain/interfaces/admission-announcement-repository.interface.ts','src/admission/infrastructure/persistence/prisma-admission-announcement.repository.ts','src/admission/dto/request/admission-announcement-query.dto.ts','src/admission/dto/request/create-admission-announcement.dto.ts','src/admission/dto/request/update-admission-announcement.dto.ts','src/admission/use-cases/get-admission-announcements.use-case.ts','src/admission/use-cases/get-published-announcements.use-case.ts','src/admission/use-cases/create-admission-announcement.use-case.ts','src/admission/use-cases/update-admission-announcement.use-case.ts','src/admission/use-cases/publish-admission-announcement.use-case.ts','src/admission/use-cases/delete-admission-announcement.use-case.ts','src/admission/use-cases/admission-announcement.use-cases.spec.ts'].map(p=>path.resolve(p));const files=cp.execFileSync('rg',['--files','src','-g','*.ts'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);const re=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)[\"'](\.[^\"']+)[\"']/g;const hits=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(re)){const target=path.resolve(path.dirname(file),m[1]).replace(/\.js$/i,'.ts');if(old.includes(target))hits.push(file+': '+m[1]);}}if(hits.length){console.error(hits.join('\n'));process.exit(1)}console.log('No relative imports resolve to old flat announcement paths.');"
```

Result:

```text
No relative imports resolve to old flat announcement paths.
```

The old flat source paths contain no files after the move:

```text
src/admission/domain/entities/admission-announcement.entity.ts
src/admission/domain/interfaces/admission-announcement-repository.interface.ts
src/admission/infrastructure/persistence/prisma-admission-announcement.repository.ts
src/admission/dto/request/admission-announcement-query.dto.ts
src/admission/dto/request/create-admission-announcement.dto.ts
src/admission/dto/request/update-admission-announcement.dto.ts
src/admission/use-cases/get-admission-announcements.use-case.ts
src/admission/use-cases/get-published-announcements.use-case.ts
src/admission/use-cases/create-admission-announcement.use-case.ts
src/admission/use-cases/update-admission-announcement.use-case.ts
src/admission/use-cases/publish-admission-announcement.use-case.ts
src/admission/use-cases/delete-admission-announcement.use-case.ts
src/admission/use-cases/admission-announcement.use-cases.spec.ts
```

## Generated Distinction

Command:

```text
rg -l "domain/entities/admission-announcement\.entity\.js|domain/interfaces/admission-announcement-repository\.interface\.js|infrastructure/persistence/prisma-admission-announcement\.repository\.js|dto/request/(admission-announcement|create-admission-announcement|update-admission-announcement)\.dto\.js|use-cases/(get-admission-announcements|get-published-announcements|create-admission-announcement|update-admission-announcement|publish-admission-announcement|delete-admission-announcement)\.use-case\.js|admission-announcement\.use-cases\.spec\.js" dist
```

Result: matches exist in pre-move generated output under `dist/src/admission/`, including stale module/controller declaration references. `dist/` is generated output, was not edited in T005, and is excluded from source ownership and stale-import verification. A later build regenerates it.

## Commands And Results

### `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest src/admission/announcement/use-cases/admission-announcement.use-cases.spec.ts`

```text
(node:11360) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        2.638 s
Ran all test suites matching src/admission/announcement/use-cases/admission-announcement.use-cases.spec.ts.
```

Result: PASS. Existing Node VM Modules experimental warning only.

### `pnpm run typecheck`

```text
$ tsc --noEmit
```

Result: PASS. Exit code 0.

### `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest app.module.boots.spec.ts`

```text
(node:11188) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        4.203 s
Ran all test suites matching app.module.boots.spec.ts.
```

Result: PASS. Existing Node VM Modules experimental warning only.

### `pnpm run format:check`

```text
$ prettier --check "src/**/*.ts"
Checking formatting...
All matched files use Prettier code style!
```

Result: PASS. Exit code 0.

## Concerns

- `GetPublishedAnnouncementsUseCase` remains dependent on the broad applicant repository port. Stage 1 preserves this cross-context edge; no layering or repository redesign was requested.
- `PrismaAdmissionAnnouncementRepository.notifyScope()` still publishes announcement notifications to the same application scope. No publication or notification behavior changed.
- Announcement DTOs retain existing `class-validator` decorators and inheritance. No validation fields changed.
- Announcement routes and permissions remain in `AdmissionAnnouncementController` unchanged; only use-case and DTO import paths changed.
- `dist/` has stale pre-move generated output until a build regenerates it. No generated output was changed in T005.
- No Git commit created. Workspace has no repository metadata, as recorded in `preflight.md`.

## Review Verification Evidence

Prior review results recorded:

- Route conflict, route collision, and boot checks: 7 passed total.
- Announcement focused checks: 6 passed.

These counts are review evidence only. Command names for the prior route, collision, and boot checks were not available, so no command names are inferred here.
