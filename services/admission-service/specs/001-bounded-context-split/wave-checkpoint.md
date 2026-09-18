# Wave Checkpoint

Date: 2026-09-13
Scope: T003 only. Stage 1 move-only extraction. No behavior, route, DTO validation, permission, response, persistence, or integration changes.

## Moved Files

- `src/admission/domain/entities/admission-wave.entity.ts` -> `src/admission/wave/domain/entities/admission-wave.entity.ts`
- `src/admission/domain/interfaces/admission-wave-repository.interface.ts` -> `src/admission/wave/domain/interfaces/admission-wave-repository.interface.ts`
- `src/admission/infrastructure/persistence/prisma-admission-wave.repository.ts` -> `src/admission/wave/infrastructure/persistence/prisma-admission-wave.repository.ts`
- `src/admission/dto/request/admission-wave-ids.dto.ts` -> `src/admission/wave/dto/request/admission-wave-ids.dto.ts`
- `src/admission/dto/request/admission-wave-query.dto.ts` -> `src/admission/wave/dto/request/admission-wave-query.dto.ts`
- `src/admission/dto/request/create-admission-wave.dto.ts` -> `src/admission/wave/dto/request/create-admission-wave.dto.ts`
- `src/admission/dto/request/update-admission-wave.dto.ts` -> `src/admission/wave/dto/request/update-admission-wave.dto.ts`
- `src/admission/use-cases/get-active-waves.use-case.ts` -> `src/admission/wave/use-cases/get-active-waves.use-case.ts`
- `src/admission/use-cases/get-admission-waves.use-case.ts` -> `src/admission/wave/use-cases/get-admission-waves.use-case.ts`
- `src/admission/use-cases/get-admission-wave-by-id.use-case.ts` -> `src/admission/wave/use-cases/get-admission-wave-by-id.use-case.ts`
- `src/admission/use-cases/create-admission-wave.use-case.ts` -> `src/admission/wave/use-cases/create-admission-wave.use-case.ts`
- `src/admission/use-cases/update-admission-wave.use-case.ts` -> `src/admission/wave/use-cases/update-admission-wave.use-case.ts`
- `src/admission/use-cases/delete-admission-wave.use-case.ts` -> `src/admission/wave/use-cases/delete-admission-wave.use-case.ts`
- `src/admission/use-cases/admission-wave.use-cases.spec.ts` -> `src/admission/wave/use-cases/admission-wave.use-cases.spec.ts`

`src/admission/presentation/admission-wave.controller.ts` and root `src/admission/admission.module.ts` remain in place. Their wave imports now target `src/admission/wave/`.

## Stale-Path Scan

Source ownership scan. This resolves relative `from` and static/dynamic `import` specifiers, so aliases such as `../domain/entities/admission-wave.entity.js` are checked without requiring a literal `src/admission` prefix.

Command:

```text
node -e "const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');const old=['src/admission/domain/entities/admission-wave.entity.ts','src/admission/domain/interfaces/admission-wave-repository.interface.ts','src/admission/infrastructure/persistence/prisma-admission-wave.repository.ts','src/admission/dto/request/admission-wave-ids.dto.ts','src/admission/dto/request/admission-wave-query.dto.ts','src/admission/dto/request/create-admission-wave.dto.ts','src/admission/dto/request/update-admission-wave.dto.ts','src/admission/use-cases/get-active-waves.use-case.ts','src/admission/use-cases/get-admission-waves.use-case.ts','src/admission/use-cases/get-admission-wave-by-id.use-case.ts','src/admission/use-cases/create-admission-wave.use-case.ts','src/admission/use-cases/update-admission-wave.use-case.ts','src/admission/use-cases/delete-admission-wave.use-case.ts','src/admission/use-cases/admission-wave.use-cases.spec.ts'].map(p=>path.resolve(p));const files=cp.execFileSync('rg',['--files','src','-g','*.ts'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);const re=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)[\"'](\.[^\"']+)[\"']/g;const hits=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(re)){const target=path.resolve(path.dirname(file),m[1]).replace(/\.js$/i,'.ts');if(old.includes(target))hits.push(file+': '+m[1]);}}if(hits.length){console.error(hits.join('\n'));process.exit(1)}console.log('No relative imports resolve to old flat wave paths.');"
```

Result:

```text
No relative imports resolve to old flat wave paths.
```

Generated artifacts are reported separately and are not source ownership:

```text
rg -l "domain/entities/admission-wave\.entity\.js|domain/interfaces/admission-wave-repository\.interface\.js|infrastructure/persistence/prisma-admission-wave\.repository\.js|dto/request/(admission-wave|create-admission-wave|update-admission-wave)\.dto\.js|use-cases/(get-active-waves|get-admission-waves|get-admission-wave-by-id|create-admission-wave|update-admission-wave|delete-admission-wave)\.use-case\.js|admission-wave\.use-cases\.spec\.js" dist
```

Result: matches exist in pre-move generated declarations under `dist/src/admission/`. `dist/` is generated output, was not edited in T003, and is excluded from source ownership and stale-import verification.

## Commands And Results

### `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest src/admission/wave/use-cases/admission-wave.use-cases.spec.ts`

```text
(node:4264) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        1.542 s, estimated 2 s
Ran all test suites matching src/admission/wave/use-cases/admission-wave.use-cases.spec.ts.
```

Result: PASS. Existing Node VM Modules experimental warning only.

### `pnpm run typecheck`

```text
$ tsc --noEmit
```

Result: PASS. Exit code 0.

## Concerns

- `GetActiveWavesUseCase` remains dependent on the broad applicant repository port. Stage 1 preserves this cross-context edge; no layering or repository redesign was requested.
- `serializeWave` remains in `src/admission/domain/admission.serializers.ts`, which preflight assigns to `application`; moving it is deferred to the application slice.
- `AdmissionWaveAcceptedCount`, `ActiveWaveRow`, and `AdmissionWaveEntity` remain consumed by applicant/application repository and entity files through the new wave path. This preserves current contracts without aliases.
- `dist/` has stale pre-move generated declarations until a build regenerates it. No generated output was changed in T003.
- No Git commit created. Workspace has no repository metadata, as recorded in `preflight.md`.

## Review Verification Evidence

Prior review results recorded:

- Route conflict checks: 3 passed.
- Route collision checks: 3 passed.
- Boot checks: 1 passed.
- Wave focused checks: 10 passed.

These counts are review evidence only. Command names for the prior route, collision, and boot checks were not available, so no command names are inferred here.

## Reviewer Fix Report

- Finding: previous scan searched literal `src/admission` strings and included checkpoint text, so it did not prove that relative imports could not resolve to old flat wave files.
- Fix: replaced it with source-only relative-import resolution against all 14 old flat wave paths; separated `dist/` artifact reporting from source ownership.
- Scope evidence: only this checkpoint file changed for reviewer fix. No files under `src/` changed and no behavior changed.
- Verification evidence: corrected resolver returned `No relative imports resolve to old flat wave paths.`; source literal-path scan returned no output; generated artifact scan matched only `dist/` output as expected.

## Reviewer Fix Verification

### Corrected Relative-Import Scan

Exact command:

```text
node -e "const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');const old=['src/admission/domain/entities/admission-wave.entity.ts','src/admission/domain/interfaces/admission-wave-repository.interface.ts','src/admission/infrastructure/persistence/prisma-admission-wave.repository.ts','src/admission/dto/request/admission-wave-ids.dto.ts','src/admission/dto/request/admission-wave-query.dto.ts','src/admission/dto/request/create-admission-wave.dto.ts','src/admission/dto/request/update-admission-wave.dto.ts','src/admission/use-cases/get-active-waves.use-case.ts','src/admission/use-cases/get-admission-waves.use-case.ts','src/admission/use-cases/get-admission-wave-by-id.use-case.ts','src/admission/use-cases/create-admission-wave.use-case.ts','src/admission/use-cases/update-admission-wave.use-case.ts','src/admission/use-cases/delete-admission-wave.use-case.ts','src/admission/use-cases/admission-wave.use-cases.spec.ts'].map(p=>path.resolve(p));const files=cp.execFileSync('rg',['--files','src','-g','*.ts'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);const re=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)[\"'](\.[^\"']+)[\"']/g;const hits=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(re)){const target=path.resolve(path.dirname(file),m[1]).replace(/\.js$/i,'.ts');if(old.includes(target))hits.push(file+': '+m[1]);}}if(hits.length){console.error(hits.join('\n'));process.exit(1)}console.log('No relative imports resolve to old flat wave paths.');"
