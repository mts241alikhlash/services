# Applicant Checkpoint

Date: 2026-09-13
Scope: T007 only. Stage 1 move-only extraction. No behavior, route, DTO validation, permission, response, persistence, or integration changes.

## Moved Files

- `src/admission/domain/entities/admission-applicant.entity.ts` -> `src/admission/applicant/domain/entities/admission-applicant.entity.ts`
- `src/admission/domain/interfaces/admission-applicant-repository.interface.ts` -> `src/admission/applicant/domain/interfaces/admission-applicant-repository.interface.ts`
- `src/admission/infrastructure/persistence/prisma-admission-applicant.repository.ts` -> `src/admission/applicant/infrastructure/persistence/prisma-admission-applicant.repository.ts`
- `src/admission/dto/request/register-applicant.dto.ts` -> `src/admission/applicant/dto/request/register-applicant.dto.ts`
- `src/admission/dto/request/update-my-application.dto.ts` -> `src/admission/applicant/dto/request/update-my-application.dto.ts`
- `src/admission/use-cases/register-applicant.use-case.ts` -> `src/admission/applicant/use-cases/register-applicant.use-case.ts`
- `src/admission/use-cases/get-my-application.use-case.ts` -> `src/admission/applicant/use-cases/get-my-application.use-case.ts`
- `src/admission/use-cases/update-my-application.use-case.ts` -> `src/admission/applicant/use-cases/update-my-application.use-case.ts`
- `src/admission/use-cases/submit-application.use-case.ts` -> `src/admission/applicant/use-cases/submit-application.use-case.ts`
- `src/admission/use-cases/admission-applicant.use-cases.spec.ts` -> `src/admission/applicant/use-cases/admission-applicant.use-cases.spec.ts`

`src/admission/presentation/admission-public.controller.ts`, `src/admission/presentation/admission-applicant.controller.ts`, and root `src/admission/admission.module.ts` remain in place. Their applicant imports now target `src/admission/applicant/`. Existing document, payment, notification, wave, and announcement consumers now target the moved applicant repository port. No controller or module composition moved.

## Source-Only Relative Stale-Path Scan

This resolves relative `from` and static/dynamic `import` specifiers against all 10 old flat applicant paths. It scans only `src/**/*.ts` and excludes checkpoint prose and generated output.

Command:

```text
node -e "const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');const old=['src/admission/domain/entities/admission-applicant.entity.ts','src/admission/domain/interfaces/admission-applicant-repository.interface.ts','src/admission/infrastructure/persistence/prisma-admission-applicant.repository.ts','src/admission/dto/request/register-applicant.dto.ts','src/admission/dto/request/update-my-application.dto.ts','src/admission/use-cases/register-applicant.use-case.ts','src/admission/use-cases/get-my-application.use-case.ts','src/admission/use-cases/update-my-application.use-case.ts','src/admission/use-cases/submit-application.use-case.ts','src/admission/use-cases/admission-applicant.use-cases.spec.ts'].map(p=>path.resolve(p));const files=cp.execFileSync('rg',['--files','src','-g','*.ts'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);const re=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)[\"'](\.[^\"']+)[\"']/g;const hits=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(re)){const target=path.resolve(path.dirname(file),m[1]).replace(/\.js$/i,'.ts');if(old.includes(target))hits.push(file+': '+m[1]);}}if(hits.length){console.error(hits.join('\n'));process.exit(1)}console.log('No relative imports resolve to old flat applicant paths.');"
```

Result:

```text
No relative imports resolve to old flat applicant paths.
```

The old flat source paths are absent:

```text
Old flat applicant source paths are absent.
```

## Generated Distinction

Command:

```text
rg -l "domain/entities/admission-applicant\.entity\.js|domain/interfaces/admission-applicant-repository\.interface\.js|infrastructure/persistence/prisma-admission-applicant\.repository\.js|dto/request/(register-applicant|update-my-application)\.dto\.js|use-cases/(register-applicant|get-my-application|update-my-application|submit-application)\.use-case\.js|admission-applicant\.use-cases\.spec\.js" dist
```

Result: matches exist in pre-move generated output under `dist/src/admission/`, including stale references from controllers, services, remaining use cases, the old repository adapter, and the old root module. `dist/` is generated output, was not edited in T007, and is excluded from source ownership and stale-import verification. A later build regenerates it.

## Commands And Results

### `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest src/admission/applicant/use-cases/admission-applicant.use-cases.spec.ts`

```text
(node:10260) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        2.103 s
Ran all test suites matching src/admission/applicant/use-cases/admission-applicant.use-cases.spec.ts.
```

Result: PASS. Existing Node VM Modules experimental warning only.

### `pnpm run typecheck`

```text
$ tsc --noEmit
```

Result: PASS. Exit code 0.

## Concerns

- `IAdmissionApplicantRepository` remains broad and is still consumed by document, payment, notification, wave, and announcement flows. Stage 1 preserves this cross-context edge; repository redesign is excluded.
- `PrismaAdmissionApplicantRepository` remains dependent on application entities, application repository types, application include/reference helpers, announcement types, wave types, account provisioning, and reference lookup. Stage 1 preserves these imports and behavior.
- Account provisioning and deprovision-on-failure remain unchanged in `PrismaAdmissionApplicantRepository`.
- Reference lookup calls remain unchanged and outside the applicant update transaction where they were already outside it.
- Applicant routes, permissions, DTO decorators, response shapes, and status behavior remain in existing controllers and use cases; only import paths changed.
- `dist/` has stale pre-move generated output until a build regenerates it. No generated output was changed in T007.
- No Git commit created. Workspace has no repository metadata, as recorded in `preflight.md`.

## Review Verification Evidence

Prior review results recorded:

- Route, permission, and response checks: 22 passed.
- Boot checks: 1 passed.
- Applicant focused checks: 9 passed.

These counts are review evidence only. Command names for the prior route, permission, response, and boot checks were not available, so no command names are inferred here.
