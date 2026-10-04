# Application Checkpoint

Date: 2026-09-13
Scope: T015 only. Stage 1 move-only extraction. No behavior, route, DTO validation, permission, response, persistence, storage, status, or integration behavior changes.

## Moved Files

- `src/admission/domain/admission-status.transitions.ts` -> `src/admission/application/domain/admission-status.transitions.ts`
- `src/admission/domain/admission.serializers.ts` -> `src/admission/application/domain/admission.serializers.ts`
- `src/admission/domain/enroll-as-student.rules.ts` -> `src/admission/application/domain/enroll-as-student.rules.ts`
- `src/admission/domain/enroll-as-student.rules.spec.ts` -> `src/admission/application/domain/enroll-as-student.rules.spec.ts`
- `src/admission/domain/entities/admission-application.entity.ts` -> `src/admission/application/domain/entities/admission-application.entity.ts`
- `src/admission/domain/entities/admission-application-parent.entity.ts` -> `src/admission/application/domain/entities/admission-application-parent.entity.ts`
- `src/admission/domain/interfaces/admission-application-repository.interface.ts` -> `src/admission/application/domain/interfaces/admission-application-repository.interface.ts`
- `src/admission/dto/request/admission-query.dto.ts` -> `src/admission/application/dto/request/admission-query.dto.ts`
- `src/admission/dto/request/accept-application.dto.ts` -> `src/admission/application/dto/request/accept-application.dto.ts`
- `src/admission/dto/request/enroll-applicant.dto.ts` -> `src/admission/application/dto/request/enroll-applicant.dto.ts`
- `src/admission/dto/request/reject-application.dto.ts` -> `src/admission/application/dto/request/reject-application.dto.ts`
- `src/admission/dto/request/request-revision.dto.ts` -> `src/admission/application/dto/request/request-revision.dto.ts`
- `src/admission/infrastructure/persistence/prisma-admission.refs.ts` -> `src/admission/application/infrastructure/persistence/prisma-admission.refs.ts`
- `src/admission/infrastructure/persistence/prisma-admission-application.repository.ts` -> `src/admission/application/infrastructure/persistence/prisma-admission-application.repository.ts`
- `src/admission/infrastructure/persistence/prisma-admission-application.includes.ts` -> `src/admission/application/infrastructure/persistence/prisma-admission-application.includes.ts`
- `src/admission/integration/student-enrolment.port.ts` -> `src/admission/application/integration/student-enrolment.port.ts`
- `src/admission/integration/integration.module.ts` -> `src/admission/application/integration/integration.module.ts`
- `src/admission/integration/http-student-enrolment.adapter.ts` -> `src/admission/application/integration/http-student-enrolment.adapter.ts`
- `src/admission/use-cases/get-admission-stats.use-case.ts` -> `src/admission/application/use-cases/get-admission-stats.use-case.ts`
- `src/admission/use-cases/get-applications.use-case.ts` -> `src/admission/application/use-cases/get-applications.use-case.ts`
- `src/admission/use-cases/get-application-by-id.use-case.ts` -> `src/admission/application/use-cases/get-application-by-id.use-case.ts`
- `src/admission/use-cases/accept-application.use-case.ts` -> `src/admission/application/use-cases/accept-application.use-case.ts`
- `src/admission/use-cases/reject-application.use-case.ts` -> `src/admission/application/use-cases/reject-application.use-case.ts`
- `src/admission/use-cases/request-revision.use-case.ts` -> `src/admission/application/use-cases/request-revision.use-case.ts`
- `src/admission/use-cases/verify-application.use-case.ts` -> `src/admission/application/use-cases/verify-application.use-case.ts`
- `src/admission/use-cases/enroll-applicant.use-case.ts` -> `src/admission/application/use-cases/enroll-applicant.use-case.ts`
- `src/admission/use-cases/admission-workflow.use-cases.spec.ts` -> `src/admission/application/use-cases/admission-workflow.use-cases.spec.ts`
- `src/admission/use-cases/get-applications.use-case.spec.ts` -> `src/admission/application/use-cases/get-applications.use-case.spec.ts`

`src/admission/admission.module.ts` remains the composition root. Its application repository, adapter, integration module, and workflow use-case imports now target `application/`. `src/admission/presentation/admission-admin.controller.ts` now imports application DTOs and use cases from `application/`.

## Source-Only Relative Stale-Path Scan

The scan resolves relative `from` and static/dynamic `import` specifiers against all 28 old application source paths. It scans only `src/**/*.ts` and excludes checkpoint prose and generated output.

Command:

```text
node -e "const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');const old=['src/admission/domain/admission-status.transitions.ts','src/admission/domain/admission.serializers.ts','src/admission/domain/enroll-as-student.rules.ts','src/admission/domain/enroll-as-student.rules.spec.ts','src/admission/domain/entities/admission-application.entity.ts','src/admission/domain/entities/admission-application-parent.entity.ts','src/admission/domain/interfaces/admission-application-repository.interface.ts','src/admission/dto/request/admission-query.dto.ts','src/admission/dto/request/accept-application.dto.ts','src/admission/dto/request/enroll-applicant.dto.ts','src/admission/dto/request/reject-application.dto.ts','src/admission/dto/request/request-revision.dto.ts','src/admission/infrastructure/persistence/prisma-admission.refs.ts','src/admission/infrastructure/persistence/prisma-admission-application.repository.ts','src/admission/infrastructure/persistence/prisma-admission-application.includes.ts','src/admission/integration/student-enrolment.port.ts','src/admission/integration/integration.module.ts','src/admission/integration/http-student-enrolment.adapter.ts','src/admission/use-cases/get-admission-stats.use-case.ts','src/admission/use-cases/get-applications.use-case.ts','src/admission/use-cases/get-application-by-id.use-case.ts','src/admission/use-cases/accept-application.use-case.ts','src/admission/use-cases/reject-application.use-case.ts','src/admission/use-cases/request-revision.use-case.ts','src/admission/use-cases/verify-application.use-case.ts','src/admission/use-cases/enroll-applicant.use-case.ts','src/admission/use-cases/admission-workflow.use-cases.spec.ts','src/admission/use-cases/get-applications.use-case.spec.ts'].map(p=>path.resolve(p));const files=cp.execFileSync('rg',['--files','src','-g','*.ts'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);const re=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)[\"'](\.[^\"']+)[\"']/g;const hits=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(re)){const target=path.resolve(path.dirname(file),m[1]).replace(/\.js$/i,'.ts');if(old.includes(target))hits.push(path.relative(process.cwd(),file)+': '+m[1]);}}if(hits.length){console.error(hits.join('\n'));process.exit(1)}console.log('No source-only relative imports resolve to old flat application paths.');"
```

Result:

```text
No source-only relative imports resolve to old flat application paths.
```

Old flat application source files absent: 28/28.

## Status Behavior

- `ACCEPTED -> ENROLLED` remains in `src/admission/application/domain/admission-status.transitions.ts`.
- `EnrollApplicantUseCase` still asserts transition to `ENROLLED`, calls student integration before `markEnrolled`, then sends notification.
- `ENROLLING` was not added.

## Generated Distinction

Command:

```text
rg -l "domain/(admission-status\.transitions|admission\.serializers|enroll-as-student\.rules|entities/admission-application|interfaces/admission-application-repository)|dto/request/(admission-query|accept-application|enroll-applicant|reject-application|request-revision)|infrastructure/persistence/prisma-admission-(application|refs)|integration/(integration|student-enrolment|http-student)|use-cases/(get-admission-stats|get-applications|get-application-by-id|verify-application|accept-application|reject-application|request-revision|enroll-applicant)|admission-application\.use-cases\.spec" dist
```

Result: matches remain in pre-move generated output under `dist/src/admission/`, including old application declarations and old controller/module references. `dist/` is generated output, was not edited for T015, and is excluded from source ownership and stale-import verification. A later build regenerates it.

## Commands And Results

### Focused Application Workflow, Stats, And Rules Tests

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest src/admission/application/use-cases/admission-workflow.use-cases.spec.ts src/admission/application/use-cases/get-applications.use-case.spec.ts src/admission/application/domain/enroll-as-student.rules.spec.ts --runInBand
```

```text
(node:9912) ExperimentalWarning: VM Modules is an experimental feature and might change at any time

Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.706 s, estimated 3 s
Ran all test suites matching src/admission/application/use-cases/admission-workflow.use-cases.spec.ts|src/admission/application/use-cases/get-applications.use-case.spec.ts|src/admission/application/domain/enroll-as-student.rules.spec.ts.
```

Result: PASS. Existing Node VM Modules experimental warning only.

### Route And Boot Tests

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest route-conflicts.spec.ts route-collisions.spec.ts app.module.boots.spec.ts --runInBand
```

```text
(node:2348) ExperimentalWarning: VM Modules is an experimental feature and might change at any time

Test Suites: 3 passed, 3 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        6.172 s
Ran all test suites matching route-conflicts.spec.ts|route-collisions.spec.ts|app.module.boots.spec.ts.
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

- `IAdmissionApplicationRepository` remains broad and continues serving application, document, and payment workflows. Stage 1 preserves this cross-context edge; repository redesign is excluded.
- `IAdmissionApplicantRepository` still consumes application entity and repository types for existing applicant, document, payment, notification, wave, and announcement flows. Stage 1 preserves these explicit edges; cleanup is deferred.
- Application serializers remain used by applicant, payment, and wave contexts to preserve response and numeric serialization behavior.
- Student enrolment integration remains under the application context and still binds `IStudentEnrolmentPort` in `IntegrationModule`.
- Routes, permissions, DTO decorators, response envelopes, repository calls, storage calls, student integration payloads, notification ordering, and status transitions remain unchanged.
- `dist/` has stale pre-move generated output until a build regenerates it. No generated output was changed in T015.
- No Git commit created. Workspace has no repository metadata, as recorded in `preflight.md`.
