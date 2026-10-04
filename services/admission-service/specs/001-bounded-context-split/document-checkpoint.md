# Document Checkpoint

Date: 2026-09-13
Scope: T009 only. Stage 1 move-only extraction. No behavior, route, DTO validation, permission, response, persistence, storage, status, or integration changes.

## Moved Files

- `src/admission/domain/entities/admission-document.entity.ts` -> `src/admission/document/domain/entities/admission-document.entity.ts`
- `src/admission/domain/entities/admission-file.entity.ts` -> `src/admission/document/domain/entities/admission-file.entity.ts`
- `src/admission/dto/request/verify-document.dto.ts` -> `src/admission/document/dto/request/verify-document.dto.ts`
- `src/admission/use-cases/upload-admission-document.use-case.ts` -> `src/admission/document/use-cases/upload-admission-document.use-case.ts`
- `src/admission/use-cases/verify-document.use-case.ts` -> `src/admission/document/use-cases/verify-document.use-case.ts`
- Document verification coverage extracted from `src/admission/use-cases/admission-workflow.use-cases.spec.ts` -> `src/admission/document/use-cases/admission-document.use-cases.spec.ts`

`src/admission/use-cases/admission-workflow.use-cases.spec.ts` remains in place for application workflow coverage. Its document assertion moved without changing its application assertions.

`src/admission/admission.module.ts` remains the composition root. `src/admission/presentation/admission-applicant.controller.ts` and `src/admission/presentation/admission-admin.controller.ts` remain in place; their imports now target `src/admission/document/`. Existing application, applicant, and payment consumers now target the moved document/file entities or document upload helpers.

## Source-Only Relative Stale-Path Scan

This resolves relative `from` and static/dynamic `import` specifiers against the five old flat production document paths. It scans only `src/**/*.ts`, not checkpoint prose or generated output.

Command:

```text
node -e "const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');const old=['src/admission/domain/entities/admission-document.entity.ts','src/admission/domain/entities/admission-file.entity.ts','src/admission/dto/request/verify-document.dto.ts','src/admission/use-cases/upload-admission-document.use-case.ts','src/admission/use-cases/verify-document.use-case.ts'].map(p=>path.resolve(p));const output=cp.execFileSync('rg',['--files','src','-g','*.ts'],{encoding:'utf8'}).trim();const files=output?output.split(/\r?\n/).filter(Boolean):[];const re=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)[\"'](\.[^\"']+)[\"']/g;const hits=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(re)){const target=path.resolve(path.dirname(file),m[1]).replace(/\.js$/i,'.ts');if(old.includes(target))hits.push(file+': '+m[1]);}}if(hits.length){console.error(hits.join('\n'));process.exit(1)}console.log('No relative imports resolve to old flat document paths.');"
```

Result:

```text
No relative imports resolve to old flat document paths.
```

The five old flat production source paths are absent after the move. `src/admission/use-cases/admission-workflow.use-cases.spec.ts` remains by design for application workflow coverage. No source-only stale relative imports remain.

## Generated Distinction

Command:

```text
rg -l "domain/entities/admission-(document|file)\.entity\.js|dto/request/verify-document\.dto\.js|use-cases/(upload-admission-document|verify-document)\.use-case\.js" dist
```

Result: matches remain in pre-move generated output under `dist/src/admission/`, including old use-case declarations and controller/module references. `dist/` is generated output, was not edited for T009, and is excluded from source ownership and stale-import verification. A later build regenerates it.

## Commands And Results

### `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest src/admission/document/use-cases/admission-document.use-cases.spec.ts`

```text
(node:6440) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        1.78 s
Ran all test suites matching src/admission/document/use-cases/admission-document.use-cases.spec.ts.
```

Result: PASS. Existing Node VM Modules experimental warning only.

### `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest src/admission/use-cases/admission-workflow.use-cases.spec.ts`

```text
(node:4924) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        1.843 s
Ran all test suites matching src/admission/use-cases/admission-workflow.use-cases.spec.ts.
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

- `IAdmissionApplicantRepository` remains broad and continues serving document upload, payment upload, notification, applicant, wave, and announcement flows. Stage 1 preserves this repository edge; redesign is deferred.
- `IAdmissionApplicationRepository` remains broad and continues serving document verification beside application and payment workflows. Stage 1 preserves this repository edge; redesign is deferred.
- `AdmissionFileRef` now lives under `src/admission/document/` while payment still consumes it. This is the required T009 move; payment context cleanup is deferred to T011 without adding an alias.
- Storage key construction, allowed MIME types, maximum size, storage upload call, document status validation, notification text, and repository calls remain unchanged.
- `dist/` has stale pre-move generated output until a build regenerates it. No generated output was changed in T009.
- No Git commit created. Workspace has no repository metadata, as recorded in `preflight.md`.

## Review Verification Evidence

Prior review results recorded:

- Route conflict and route collision checks: 6 passed total.
- Boot checks: 1 passed.
- Document and application workflow checks: 8 passed.

These counts are review evidence only. Command names for the prior route, collision, boot, and workflow checks were not available, so no command names are inferred here.
