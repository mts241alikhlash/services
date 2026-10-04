# Wave Layering Checkpoint

## Scope

Completed `T001-T002` only. External routes, permission codes, DTO validation,
response serialization, status codes, search/order behavior, and persistence
operations remain unchanged.

## Exact Moves

- `wave/domain/interfaces/admission-wave-repository.interface.ts` -> `wave/domain/repositories/admission-wave-repository.ts`
- `wave/infrastructure/persistence/prisma-admission-wave.repository.ts` -> `wave/infrastructure/persistence/prisma/prisma-admission-wave.repository.ts`
- `wave/dto/request/create-admission-wave.dto.ts` -> `wave/presentation/http/dto/request/create-admission-wave.dto.ts`
- `wave/dto/request/update-admission-wave.dto.ts` -> `wave/presentation/http/dto/request/update-admission-wave.dto.ts`
- `wave/dto/request/admission-wave-query.dto.ts` -> `wave/presentation/http/dto/request/admission-wave-query.dto.ts`
- `wave/dto/request/admission-wave-ids.dto.ts` -> `wave/presentation/http/dto/request/admission-wave-ids.dto.ts`
- `wave/use-cases/create-admission-wave.use-case.ts` -> `wave/application/use-cases/create-admission-wave/create-admission-wave.use-case.ts`
- `wave/use-cases/update-admission-wave.use-case.ts` -> `wave/application/use-cases/update-admission-wave/update-admission-wave.use-case.ts`
- `wave/use-cases/get-admission-waves.use-case.ts` -> `wave/application/use-cases/get-admission-waves/get-admission-waves.use-case.ts`
- `wave/use-cases/get-admission-wave-by-id.use-case.ts` -> `wave/application/use-cases/get-admission-wave-by-id/get-admission-wave-by-id.use-case.ts`
- `wave/use-cases/get-active-waves.use-case.ts` -> `wave/application/use-cases/get-active-waves/get-active-waves.use-case.ts`
- `wave/use-cases/delete-admission-wave.use-case.ts` -> `wave/application/use-cases/delete-admission-wave/delete-admission-wave.use-case.ts`
- `wave/use-cases/admission-wave.use-cases.spec.ts` -> `wave/application/use-cases/admission-wave.use-cases.spec.ts`
- `admission/presentation/admission-wave.controller.ts` -> `wave/presentation/http/admission-wave.controller.ts`
- New `wave/application/serialize-wave.ts` contains wave response serialization previously shared from application context.
- New `wave/application/use-cases/create-admission-wave/create-admission-wave.input.ts` removes DTO coupling from create use case.
- New `wave/application/use-cases/update-admission-wave/update-admission-wave.input.ts` removes DTO coupling from update use case.
- New `wave/application/use-cases/get-admission-waves/get-admission-waves.input.ts` removes DTO coupling from list use case.
- New `wave/wave.module.ts` owns wave controller, wave administration use cases,
  repository port, and Prisma adapter.
- New `wave/index.ts` exposes `WaveModule`, intentional wave port/types, and the
  `GetActiveWavesUseCase` type used by the existing public admission controller.
- `admission/admission.module.ts` imports `WaveModule` and no longer owns wave controller, provider, or adapter wiring.
- Cross-context wave entity/type consumers use `wave/index.ts`.
- Academic-year reference resolution remains inside wave Prisma infrastructure;
  it does not import application infrastructure.
- Empty legacy directories `wave/dto/request/` and `wave/use-cases/` were removed;
  no source files were removed.

## Forbidden-Import Scan

Commands:

```text
rg "from ['\"].*(wave/(use-cases|dto)|wave/domain/interfaces|wave/infrastructure/persistence/prisma-admission-wave|presentation/admission-wave)" src --glob "*.ts"
rg "from ['\"].*(presentation|dto)|@prisma|PrismaService" src/admission/wave/domain --glob "*.ts"
rg "from ['\"].*dto|@prisma|PrismaService" src/admission/wave/application --glob "*.ts"
rg "IAdmissionWaveRepository|PrismaAdmissionWaveRepository|prisma-admission-wave" src/admission/wave/presentation --glob "*.ts"
```

Results: all four scans returned no matches.

## Commands and Results

- `pnpm test -- wave/application/use-cases/admission-wave.use-cases.spec.ts --runInBand`: PASS, 1 suite, 10 tests.
- `pnpm run typecheck`: PASS.
- `pnpm run lint`: PASS, zero errors and warnings.
- `pnpm run lint:strict`: PASS, zero errors and warnings.
- `pnpm test -- app.module.boots.spec.ts --runInBand`: PASS, 1 suite, 1 test.
- `pnpm run format:check`: PASS, all matched files use Prettier code style.
- Stale/forbidden import scans above: PASS, zero matches.
- Cleanup verification: `wave/dto/request/` and `wave/use-cases/` contain no files
  and were removed; stale-path scan returned zero matches.

## Concerns

- `GetActiveWavesUseCase` still consumes `IAdmissionApplicantRepository`; applicant
  owns that port until its later migration, so the use case remains provided by
  `AdmissionModule` while its class is publicly exported by wave.
- Existing wave tests cover use-case behavior, not HTTP route registration; boot
  coverage verifies module dependency resolution.
- `admission-wave-ids.dto.ts` had no current consumer; moved unchanged as part of
  the requested DTO seam.
