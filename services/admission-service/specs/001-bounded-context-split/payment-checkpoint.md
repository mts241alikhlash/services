# Payment Checkpoint

Date: 2026-09-13
Scope: T011 only. Stage 1 move-only extraction. No behavior, route, DTO validation, permission, response, persistence, storage, status, or integration changes.

## Moved Files

- `src/admission/domain/entities/admission-payment.entity.ts` -> `src/admission/payment/domain/entities/admission-payment.entity.ts`
- `src/admission/document/domain/entities/admission-file.entity.ts` -> `src/admission/payment/domain/entities/admission-file.entity.ts`
- `src/admission/dto/request/upload-payment-proof.dto.ts` -> `src/admission/payment/dto/request/upload-payment-proof.dto.ts`
- `src/admission/dto/request/verify-payment.dto.ts` -> `src/admission/payment/dto/request/verify-payment.dto.ts`
- `src/admission/use-cases/upload-payment-proof.use-case.ts` -> `src/admission/payment/use-cases/upload-payment-proof.use-case.ts`
- `src/admission/use-cases/verify-payment.use-case.ts` -> `src/admission/payment/use-cases/verify-payment.use-case.ts`

`AdmissionFileRef` now lives under `src/admission/payment/`, while document imports that type from payment. Payment continues using `assertValidAdmissionFile` and `saveAdmissionFile` from the document upload use case. No file alias or duplicate was added.

No dedicated payment spec existed in the baseline source. Existing payment-related assertions remain in `src/admission/use-cases/admission-workflow.use-cases.spec.ts`, which remains application workflow coverage. The root `src/admission/admission.module.ts` remains the composition root. Applicant/admin controllers remain in place with payment DTO and use-case imports targeting `payment/`.

## Source-Only Relative Stale-Path Scan

This resolves relative `from` and static/dynamic `import` specifiers against all six old flat production payment paths. It scans only `src/**/*.ts`, not checkpoint prose or generated output.

Command:

```text
node -e "const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');const old=['src/admission/domain/entities/admission-payment.entity.ts','src/admission/document/domain/entities/admission-file.entity.ts','src/admission/dto/request/upload-payment-proof.dto.ts','src/admission/dto/request/verify-payment.dto.ts','src/admission/use-cases/upload-payment-proof.use-case.ts','src/admission/use-cases/verify-payment.use-case.ts'].map(p=>path.resolve(p));const output=cp.execFileSync('rg',['--files','src','-g','*.ts'],{encoding:'utf8'}).trim();const files=output?output.split(/\r?\n/).filter(Boolean):[];const re=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)[\"'](\.[^\"']+)[\"']/g;const hits=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(re)){const target=path.resolve(path.dirname(file),m[1]).replace(/\.js$/i,'.ts');if(old.includes(target))hits.push(file+': '+m[1]);}}if(hits.length){console.error(hits.join('\n'));process.exit(1)}console.log('No relative imports resolve to old flat payment paths.');"
```

Result:

```text
No relative imports resolve to old flat payment paths.
```

The six old flat production source paths are absent after the move. No source-only stale relative imports remain.

## Generated Distinction

Command:

```text
pnpm exec rg -l "domain/entities/(admission-payment|admission-file)\.entity\.js|dto/request/(upload-payment-proof|verify-payment)\.dto\.js|use-cases/(upload-payment-proof|verify-payment)\.use-case\.js" dist
```

Result: matches remain in pre-move generated output under `dist/src/admission/`, including old payment use-case declarations and controller/module references. `dist/` is generated output, was not edited for T011, and is excluded from source ownership and stale-import verification. A later build regenerates it.

## Commands And Results

### Focused payment-related workflow tests

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest src/admission/use-cases/admission-workflow.use-cases.spec.ts
```

```text
(node:11568) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        2.706 s
Ran all test suites matching src/admission/use-cases/admission-workflow.use-cases.spec.ts.
```

Result: PASS. Payment verification gate coverage passed within existing application workflow spec. Existing Node VM Modules experimental warning only.

### Focused application and applicant workflow tests

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest src/admission/use-cases/admission-workflow.use-cases.spec.ts src/admission/applicant/use-cases/admission-applicant.use-cases.spec.ts
```

```text
(node:8640) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:2644) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        4.926 s
Ran all test suites matching src/admission/use-cases/admission-workflow.use-cases.spec.ts|src/admission/applicant/use-cases/admission-applicant.use-cases.spec.ts.
```

Result: PASS. Existing Node VM Modules experimental warning only.

### Route tests and application boot

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest src/route-conflicts.spec.ts src/route-collisions.spec.ts src/app.module.boots.spec.ts
```

```text
(node:4808) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:11960) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

Test Suites: 3 passed, 3 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        5.536 s
Ran all test suites matching src/route-conflicts.spec.ts|src/route-collisions.spec.ts|src/app.module.boots.spec.ts.
```

Result: PASS. Existing Node VM Modules experimental warning only.

### Typecheck

Command:

```text
pnpm run typecheck
```

```text
$ tsc --noEmit
```

Result: PASS. Exit code 0.

### Formatting

Command:

```text
pnpm exec prettier --check "src/**/*.ts"
```

```text
Checking formatting...
All matched files use Prettier code style!
```

Result: PASS. Exit code 0.

## Concerns

- `AdmissionFileRef` is payment-owned and document imports its type across contexts. File validation and storage helpers remain document-owned, so payment retains an explicit use-case helper import.
- `IAdmissionApplicantRepository` remains broad and continues serving payment upload beside applicant, document, notification, wave, and announcement flows. Stage 1 preserves this repository edge; redesign is deferred.
- `IAdmissionApplicationRepository` remains broad and continues serving payment verification beside application and document workflows. Stage 1 preserves this repository edge; redesign is deferred.
- Payment status enum remains at `src/shared/domain/enums/admission-payment-status.enum.ts`; status values and transitions were not changed.
- Payment routes, permissions, DTO decorators, response serialization, repository calls, notification text, storage segments, and file validation remain unchanged.
- `dist/` has stale pre-move generated output until a build regenerates it. No generated output was changed in T011.
- No Git commit created. Workspace has no repository metadata, as recorded in `preflight.md`.

## Correction Evidence

- Exact correction: `The five old flat production source paths are absent after the move.` -> `The six old flat production source paths are absent after the move.`
- Evidence: `Moved Files` lists six moved files, and the scan command resolves against six old flat production paths.
