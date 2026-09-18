# ARCHITECTURE

The one reference for how this service is built. Two halves:

- **Part 1 — inside a module.** The Clean Architecture layering this
  service's modules are migrated to, and the procedure for converting a module.
- **Part 2 — between services.** What is borrowed from identity-service, the three
  couplings, and why the database is still shared.

They are independent: a module can be perfectly layered and still wrongly
coupled, and the reverse.

`NESTJS-RULES.md` holds the coding rules (controllers, DTOs, validation,
comments, naming). Its two _structure_ sections are superseded by Part 1 here.
`IAM.md` holds how authorization works.

---

# PART 1 — INSIDE A MODULE

## The two reference modules

Copy from these. Both are small and complete.

### `academic-setting` — the **class** entity

```
academic-setting/
├── academic-setting.module.ts
├── index.ts
├── constants/
│   ├── passing-score.constants.ts
│   └── weekday.constants.ts
├── domain/
│   ├── entities/academic-setting.entity.ts     class AcademicSetting
│   ├── errors/invalid-academic-setting.error.ts
│   └── repositories/academic-setting.repository.ts    abstract = port + DI token
├── application/use-cases/
│   ├── get-academic-setting/
│   │   └── get-academic-setting.use-case.ts    no input file — takes nothing
│   └── update-academic-setting/
│       ├── update-academic-setting.input.ts
│       └── update-academic-setting.use-case.ts
├── infrastructure/persistence/prisma/
│   └── prisma-academic-setting.repository.ts
└── presentation/http/
    ├── academic-setting.controller.ts
    └── dto/
        ├── request/update-academic-setting.dto.ts
        └── response/academic-setting-response.dto.ts
```

### `academic-year` — the **interface** entity, with policies

```
academic-year/
├── academic-year.module.ts
├── index.ts
├── constants/academic-year.constants.ts
├── domain/
│   ├── entities/academic-year.entity.ts        interface AcademicYear — shape only
│   ├── errors/invalid-academic-year.error.ts
│   ├── policies/validate-academic-year.policy.ts     the rules live here
│   └── repositories/academic-year.repository.ts
├── application/use-cases/
│   ├── activate-academic-year/       ─┐
│   ├── create-academic-year/          │  one folder per use case, each with
│   ├── deactivate-academic-year/      │  <name>.use-case.ts, and .input.ts /
│   ├── delete-academic-year/          │  .use-case.spec.ts where they apply
│   ├── get-academic-year-by-id/       │
│   ├── get-academic-years/            │
│   └── update-academic-year/         ─┘
├── infrastructure/persistence/prisma/
│   ├── prisma-academic-year.repository.ts
│   ├── prisma-academic-year-query.helper.ts
│   └── prisma-academic-year.activation.spec.ts
└── presentation/http/
    ├── academic-year.controller.ts
    ├── academic-year.controller.spec.ts
    └── dto/
        ├── request/{academic-year-query,create-academic-year,update-academic-year}.dto.ts
        └── response/academic-year-response.dto.ts
```

## Which entity style — the deciding question

> **Can the aggregate enforce a rule entirely on its own, with no database
> lookup?** If yes, a class. If no, an interface.

**`AcademicSetting` says yes.** It is a singleton of value fields, and every
write is read-current → apply-partial → validate-result:

```ts
export class AcademicSetting {
  private constructor(props: AcademicSettingProps) { ... }
  static reconstitute(props: AcademicSettingProps): AcademicSetting { ... }
  withUpdate(input: {...}): AcademicSetting { /* validates, returns a new one */ }
}
```

The private constructor is the point — the repository must call
`reconstitute()` too, so an invalid instance cannot exist anywhere. The
invariant is held by structure, not by remembering.

**`AcademicYear` says no.** Its field rules are two trivial checks (name length,
year range), while the rules that matter — the name is unique, only one year is
active — need `findByName()` and `deactivateAll()`. Those can never sit on an
entity, so a class would wrap the trivial half while the real logic stayed in
the use case.

> **Default to interface.** Every module except `academic-setting` is one.
> Reach for a class only when you can name the self-contained rule.

Self-contained checks go in `domain/policies/`, never in the entity file — an
entity file describes shape, a policy file states a rule. Existing:
`validate-academic-year.policy.ts`, `assert-score-in-range.policy.ts`,
`resolve-calendar-hours.policy.ts`. Related functions may share one file.

## The dependency rule

```
presentation ──> application ──> domain
infrastructure ─────────────────> domain
```

- `domain/` imports nothing from the other three layers.
- `application/` may import `domain/`. Never Prisma, never a DTO.
- `infrastructure/` implements a `domain/` port. The only place touching Prisma.
- `presentation/` may import `application/`. Never a repository, never Prisma.

## Three type boundaries

| Type                 | Lives in                        | Carries                            |
| -------------------- | ------------------------------- | ---------------------------------- |
| `XxxDto`             | `presentation/http/dto/`        | `class-validator` + `@ApiProperty` |
| `XxxInput`           | `application/use-cases/<name>/` | nothing — a plain interface        |
| `XxxRepositoryInput` | `domain/repositories/`          | nothing — a plain interface        |

They may be structurally identical. TypeScript is structural, so a controller
passes a Dto straight into a use case expecting an Input. **Do not write a
mapper for it.**

Create `.input.ts` only when the use case takes structured input. One taking
`(id: string)` or nothing needs no Input file.

## Import depth

NodeNext ESM: **every relative import ends in `.js`** though the source is
`.ts`. A wrong `../` count is the most common migration error, and
`pnpm run typecheck` catches every one.

| File location                                  | → `src/`             | → module root  |
| ---------------------------------------------- | -------------------- | -------------- |
| `<module>.module.ts`, `index.ts`               | `../../`             | `./`           |
| `domain/{entities,repositories,policies}/x.ts` | `../../../../`       | `../../`       |
| `application/use-cases/<name>/x.ts`            | `../../../../../`    | `../../../`    |
| `application/services/x.ts`                    | `../../../../`       | `../../`       |
| `infrastructure/persistence/prisma/x.ts`       | `../../../../../`    | `../../../`    |
| `infrastructure/http/x.ts`                     | `../../../../`       | `../../`       |
| `presentation/http/x.controller.ts`            | `../../../../`       | `../../`       |
| `presentation/http/dto/request/x.dto.ts`       | `../../../../../../` | `../../../../` |

```ts
// from application/use-cases/create-academic-year/
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.js'
import { PaginationQueryInput } from '../../../../../shared/domain/interfaces/repository.interface.js'
```

## Converting a module — the procedure

One module per commit. Old layout → new:

| Old                                                | New                                               |
| -------------------------------------------------- | ------------------------------------------------- |
| `domain/interfaces/<name>-repository.interface.ts` | `domain/repositories/<name>.repository.ts`        |
| `use-cases/<name>.use-case.ts`                     | `application/use-cases/<name>/<name>.use-case.ts` |
| `services/<name>.service.ts`                       | `application/services/<name>.service.ts`          |
| `infrastructure/persistence/*.ts`                  | `infrastructure/persistence/prisma/*.ts`          |
| `presentation/<name>.controller.ts`                | `presentation/http/<name>.controller.ts`          |
| `dto/request                                       | response/*.ts`                                    | `presentation/http/dto/request | response/*.ts` |

`constants/` stays at the module root. `domain/entities/` does not move.

**1. Find every external consumer first.** This is your fix-up list for step 6;
empty means the module is self-contained.

```bash
grep -rln "<module>/domain/interfaces\|<module>/use-cases\|<module>/dto/\|<module>/presentation/\|<module>/infrastructure/persistence" src
```

**2. Move the port.** Same depth, so its own imports do not change.

```bash
mkdir -p src/<module>/domain/repositories
git mv src/<module>/domain/interfaces/<name>-repository.interface.ts \
       src/<module>/domain/repositories/<name>.repository.ts
rmdir src/<module>/domain/interfaces
```

**3. Move each use case into its own folder.** Add `.input.ts` where it used to
take a `*Dto`, and change the signature to the `Input`. Move its `.spec.ts`
alongside. Fix depths. Never add a spec to a use case that never had one, never
delete one that did.

**4. Move infrastructure** into `infrastructure/persistence/prisma/`.

**5. Move presentation** into `presentation/http/`, DTOs under `dto/request/`
and `dto/response/`.

**6. Fix the consumers from step 1.** In one pass when there are more than a
few, then re-run the grep to confirm nothing is left:

```bash
for f in $(grep -rl "<module>/domain/interfaces/<name>-repository.interface" src); do
  sed -i 's|<module>/domain/interfaces/<name>-repository.interface|<module>/domain/repositories/<name>.repository|g' "$f"
done
```

**7. Rewrite `<module>.module.ts` and `index.ts`.** Keep any `forwardRef()`
exactly as it was — it is there for a circular dependency.

**8. Verify in order, stopping at the first failure.**

```bash
pnpm run typecheck                      # catches every wrong ../
pnpm run lint && pnpm run lint:strict
pnpm exec jest --testPathPatterns=<module>
npx prettier --write "src/<module>/**/*.ts"
pnpm run validate                       # the whole pipeline, including build
```

**9. Commit, scoped to the module.**

```bash
git add -A -- src/<module>/
git diff --cached --stat                # READ THIS before committing
git commit -m "refactor(<module>): migrate to Clean Architecture layering"
```

Done: every module under `src/`, including the `reference-data` lookups, plus
the narrowed `platform/` slices (`access-control`, `auth`, `teacher-identity`,
`student-identity`). On 2026-09-03 the modules were also flattened out of a
wrapping `src/academic/` folder — an artifact of the old layout that stopped
describing anything real once this became its own bounded context — so every path in
this doc is `src/<module>/`, never `src/academic/<module>/`. Also that day,
`platform/school-unit-identity` and `presence/daily-record` left for
assessment-service along with `report-card` and `attendance`, their only
callers here.

`academic-calendar-type`, `occupation`, and `semester-type` live in
`reference-data/`: small, mostly-static classification values shaped
`{id, name, isActive}`. **Reference data is not the governed golden record of a
core business entity** — that is a different thing with its own lifecycle
(Customer, Product, Student) and it does not belong in this folder. Every
service and the shared frontend package use `reference-data` for this shape.

## What this layering deliberately does not do

Stated once, here, so it isn't relitigated module by module:

- **No domain events.** A module needing another module's result makes a
  direct, awaited call into that module's exported use case. Do not add
  `@nestjs/event-emitter` or an event bus for this — it is not a dependency
  and nothing here emits or listens.
- **No value objects for primitives.** A name, a score, a date range is
  validated by a policy function at the boundary (`domain/policies/`), not
  wrapped in a class. See "ENTITY STYLE" above for when a class is warranted
  at all — it's the aggregate as a whole, never an individual field.
- **A repository port's input/output types are declared next to the port**,
  in the same file as the abstract class — never a bare domain entity passed
  straight into `create()`/`update()`. See `CLEAN-CODE.md`'s "no inline types"
  section for the rule and why.
- **A mapper file is the exception, not the default.** Reach for
  `infrastructure/mappers/` only when a row's outward shape genuinely differs
  from what Prisma returns. See `CLEAN-CODE.md`'s "mapper rules".

If a module's use-case count grows well past what today's largest module has
(~10), split `application/use-cases/` into `commands/` and `queries/`
subfolders before it does. No module needs this yet.

---

# PART 2 — BETWEEN SERVICES

> Until it is retired, a change to a file existing in both places must be made
> in **both**. There is no sync tooling.

## What is borrowed

Every module under `src/` is owned. Several platform pieces plus one presence
slice are borrowed, each narrowed to a read or a single write. **None is a
second copy of identity-service** — see CLAUDE.md's borrowed-pieces table for the
current, authoritative list; this section is not kept byte-for-byte in sync
with it.

| Here                                 | May do                                                                 | Left behind                                               |
| ------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `platform/auth`                      | Verify a token, check the session is live                              | Login, refresh, logout, password reset, session cleanup   |
| `platform/access-control/permission` | `PermissionGuard` asking if the caller holds a permission              | Eight use cases, the controller, the catalogue-sync hook  |
| `platform/user`                      | `AccountProvisioningService` — the account behind a teacher or student | `GET/POST/PATCH/DELETE /users` and their five use cases   |
| `platform/profile-lookup`            | `POST /profiles/batch` — a roster's teacher/student names, cached      | Everything else about `Profile` — it is not identity-service's `user` module, just the one read a roster needs |

`platform/school-unit-identity` and `presence/daily-record` were here too,
until 2026-09-03: both existed solely for `report-card` and `attendance`,
which moved to assessment-service that day and took them along rather than
leaving them behind as slices with no caller left.

> **The narrowing rule:** if a controller here would answer the same URL as one
> in identity-service, it does not belong here.

Before adding anything under `platform/` or `presence/`: does it fail that
rule? Is it a read, or a single write the academic flow cannot proceed without?
Does it widen what this service may do to another service's tables — and if so,
is the coupling table below updated?

## The three couplings

Status as of 2026-09-03. **Update this table when one moves.**

| #   | Coupling                         | Status                                                                                                                                             |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Authorization reads iam's tables | **Reduced.** Permissions come from the token; session validation still reads `auth_sessions` + `users` per request                                 |
| 2   | Provisioning writes iam's tables | **Closed, end to end.** `hr-service` and `student-service` — this repo owns neither caller any more — call identity-service's `POST /accounts` / `DELETE /accounts/:userId` over HTTP; academic-service no longer writes `users`/`user_roles` locally — see below |
| 3   | Rosters join to `profiles`       | **In progress, unmeasured.** `teaching-assignment` converted to a cached batch HTTP lookup; `classroom`, `schedule`, `enrollment` still join directly. No real identity-service or database was reachable in the dev session that built this, so the before/after this doc calls for has not been done |

**1 — Authorization.** `PermissionGuard` reads `roles` and `permissions` from
`request.user` since 2026-08-30. Measured with `log_statement='all'` over ten
requests: `user_roles`, `role_permissions`, `permissions` queried **zero**
times, against three reads per request before. Two things deliberately did not
change: session validation still hits the database, because a revoked session
must die immediately rather than at token expiry; and the
`IPermissionRepository` fallback stays wired, because a token can arrive
without permissions — SUPER_ADMIN's 262 grants are ~8.1KB encoded, past Nginx's
default 8k buffer, and it never needs them since the guard decides its bypass
on the role first.

**2 — Provisioning. Closed, end to end, as of 2026-09-03.** Hiring a teacher or
creating a student used to write the IAM account directly, on the same
`DATABASE_URL`. It no longer does, on either side of the call:

- **Caller side** (`hr-service`'s `teacher` module,
  `student-service`'s `student` module — this repo no longer has either,
  since both were extracted on 2026-09-03):
  `platform/user/domain/repositories/account-provisioning.port.ts` declares
  `IAccountProvisioningPort` (`provision`/`deprovision`), and
  `HttpAccountProvisioningAdapter` is its only implementation — there is no
  Prisma-backed fallback.
- **identity-service side:** `POST /accounts` and `DELETE /accounts/:userId`,
  behind `ProvisioningTokenGuard` (a shared secret in the
  `x-provisioning-token` header — not a JWT, since the caller is a backend,
  not a signed-in person). `AccountsController` → `ProvisionAccountUseCase`
  → the existing `AccountProvisioningService.provision()`, run inside its
  own transaction.

This is the **Saga pattern**'s compensating-transaction form — a sequence of
local steps instead of one distributed transaction, undone by a compensating
step on failure rather than rolled back atomically. `provision()` calls
identity-service; if the caller's own write then fails, `deprovision()` calls it
again to undo the account.

The contract, now implemented on both ends:

|                                             | Request                                                                                                                                                               | Success                             | Failure                                                                                                                                                       |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST {IDENTITY_SERVICE_URL}/accounts`           | `ProvisionAccountInput` as JSON body — `identifier`, `passwordHash`, `roleCode?`, `profile?` (`name`, `nik`, `gender`, `birthPlace`, `birthDate`, `email?`, `phone?`) | 2xx with `{ data: { id: string } }` | 409 on a duplicate identifier — the caller maps it to `ConflictException`. Anything else non-2xx, unreachable, or slower than 10s: the caller maps it to 503 |
| `DELETE {IDENTITY_SERVICE_URL}/accounts/:userId` | —                                                                                                                                                                     | Any 2xx                             | Same 503 mapping; no special case for "already gone" yet                                                                                                      |

Both requests carry an `x-provisioning-token` header — the same value in
`PROVISIONING_SERVICE_TOKEN` on every caller and on identity-service, checked with
a constant-time comparison. **Why a shared secret and not identity-service's own
JWT:** the caller here is a backend with no signed-in user behind the
request, so there is no token to present. **Why a guard here at all, unlike
`/auth/introspect`'s open pattern:** `/auth/introspect` stays open because the
token being asked about is itself the credential — a caller holding a valid
token learns only what that token already grants. Provisioning creates an
account and carries a password hash across the wire, which is a stronger
operation that copying the open pattern onto without deciding on purpose
would have been a gap, not a convention.

Related: **enrolment happens here, not in admission-service.**
`POST /students/enrol` took the transaction on 2026-08-30 — student, profile,
parents, address, STUDENT grant, classroom enrolment — and admission marks its
application ENROLLED afterwards, separately. It is **idempotent on `userId`**,
which is load-bearing: admission's second write can fail and the repair is to
repeat the whole action. `enrol-existing-account.use-case.spec.ts` guards the
ordering because it was once wrong — uniqueness before idempotency — and a
retry was rejected as a duplicate NIS by the very student it was confirming.

**3 — Profile join. In progress as of 2026-09-03.** Every roster used to read
`profile.name` through a Prisma relation. identity-service now answers
`POST /profiles/batch` (guarded by `ProvisioningTokenGuard`, the same shared
secret `/accounts` checks), and `platform/profile-lookup/` — a global module,
since every roster reaches it — is a `HttpProfileLookupAdapter` calling it,
caching each resolved profile by `userId` for `PROFILE_LOOKUP_CACHE_TTL_MS`
(60s default). `shared/utils/resolve-user-refs.helper.ts` is the merge step
a repository calls once per query, after collecting every `userId` its rows
need resolved, batching what used to be N join rows into one HTTP call (or a
few, chunked at identity-service's 200-id cap).

`teaching-assignment` is the one consumer converted so far.
`PrismaTeachingAssignmentRepository` no longer includes `teacher.user`; it
resolves the ref afterwards and merges it back on. Every existing test for
the module passed unchanged, because `ITeachingAssignmentRepository`'s
declared return type — `TeachingAssignmentWithDetails` — is hand-written in
the domain layer, not `Prisma.TeachingAssignmentGetPayload<...>`, so the port
never actually promised the join; only the Prisma-level type the repository
used to import did, and that type was private to the file.

**Not yet done, and it is the part that matters most: no before/after
measurement.** This was built in a dev environment with no reachable
database and no reachable identity-service — `pnpm test` mocks every
dependency, and `app.module.boots.spec.ts` only proves the DI graph
resolves, never opens a connection. "It typechecks and the tests pass" is
not the measurement this doc calls for. Before converting `classroom`,
`schedule`, or `enrollment` — the other three consumers of
`USER_REF_SELECT`/`USER_ROSTER_SELECT`/`USER_DISPLAY_SELECT` — measure
`teaching-assignment`'s real latency against a real identity-service with
realistic roster sizes, the same way coupling 1's reduction was measured
with `log_statement='all'` over ten requests. A regression here is not
hypothetical: an HTTP round trip, even cached, is a different failure mode
than a join that either the database has or does not.

The eventual shape has a name too: a cached batch lookup standing in for a
cross-service join is the **Materialized View** pattern (or, framed as a
component instead of a store, an **API wrapper** over the legacy access path)
— generate a read-optimised local copy instead of reaching across the
boundary on every request, and accept that the copy can lag.

## Its own database, and who may migrate it

This service owns `academic_service` alone: **21 models** across 7 `.prisma`
files, every one of them a table this service is responsible for. Nothing else
reads or writes them, so migrating is simply how this service deploys.

`pnpm prisma:migrate` and `pnpm prisma:deploy` both ship.

> **`start:prod` still does not migrate.** It is `node dist/src/main.js` and
> nothing else. Do not "fix" this.

That is no longer about racing another service for a shared schema — it is
about who decides *when* the schema changes. Migrating on boot hands that
decision to whichever replica starts first, and races every extra replica.
Migration is an explicit deploy step: `--profile migrate` in
`docker-compose.prod.yml`, per service.

**This inverted on 2026-09-09**, and the earlier rule read the opposite way:
one shared database, a partial schema per service, and "there is no
`prisma:migrate` script here, deliberately" — because back then a migrate from
here would have dropped the tables the other services described. Both halves of
that are gone: the database is this service's, and the schema is complete for
it.

- `pnpm prisma:generate` is required before anything else, and is always safe.
- A schema change is made here and nowhere else. This service's schema is the
  only description of its database.
## Closing order, and what done means

1. **Roles and permissions in the token** — _done 2026-08-30._ Accepted cost: a
   revoked grant lasts until the access token expires (15 min).
2. **Provisioning becomes an HTTP call** — _done 2026-09-03, on both ends._
   `hr-service` and `student-service` (which now own the callers —
   see "What this service owns" above) call identity-service's `POST /accounts` /
   `DELETE /accounts/:userId`, guarded by a shared `PROVISIONING_SERVICE_TOKEN`.
   See the coupling-2 table above for the full contract.
3. **Profile join becomes a cached batch lookup** — _in progress, 2026-09-03._
   `POST /profiles/batch` exists on identity-service; `platform/profile-lookup/`
   exists here; `teaching-assignment` is converted. `classroom`, `schedule`,
   and `enrollment` are not. Rosters are the hot path, and the before/after
   measurement this line has always called for still has not happened —
   no reachable database or identity-service existed in the session that
   built this. That measurement is the gate on converting the rest, not a
   formality after it.

> Coupling 2 is closed. Coupling 3 is what's left before the databases can
> separate — and only then does `prisma migrate` belong to this service.

## What enforces the boundary

| File                                      | Enforces                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `src/single-role-bypass.spec.ts`          | `SUPER_ADMIN` is checked in exactly one place, `PermissionGuard` (ADR-0011) |
| `src/app.module.boots.spec.ts`            | The app boots — catches a provider injected without its module imported     |
| `enrol-existing-account.use-case.spec.ts` | Idempotency is checked before uniqueness                                    |

Authorization rule, binding: **permissions, never role names** —
`@RequirePermissions('students.create')`, module segment plural.

Cross-module calls inside this service are a direct, awaited call into the
other module's exported use case. There are no domain events —
`@nestjs/event-emitter` is not a dependency.

## Naming the boundary correctly

Use the precise term when writing about `platform/` or the couplings — a
sloppy name here has already cost a wrong design once (see coupling 2's
history). Do not call `platform/` an **Anti-Corruption Layer**: an ACL
translates between two _different_ domain models at a boundary, and nothing
here does that — `platform/auth`'s `ValidateTokenUseCase` reads
`auth_sessions` and `users` through the identical Prisma models identity-service
itself uses. It becomes an accurate name only once a coupling closes into a
real HTTP call and something here has to translate identity-service's wire
contract into this service's own shapes — not before.

`provision()` / `deprovision()` is a **compensating transaction**: keep that
shape (a local step plus its own explicit undo) when coupling 2 becomes an
HTTP call, rather than reaching for a distributed transaction or two-phase
commit. Coupling 3's planned batch lookup is a **cached read model** standing
in for a cross-service join: build it to be explicitly stale-tolerant, not to
chase real-time consistency with identity-service.

---

# PITFALLS

**Never `git add -A` or `git add .` without a path.** ~1000 files show as
modified from CRLF/LF normalisation with zero content change, plus some
unrelated pending deletions. Scope to the module, and read
`git diff --cached --stat` before committing. To tell a real change from
line-ending noise: `git diff --ignore-cr-at-eol -- <path>` — empty means no
real change.

**Zero comments.** Do not add explanatory comments, and when relocating a file,
strip the comments it already carries in the same pass — including ones
documenting a past bug. Swagger `@ApiProperty({ description })` is API
documentation, not a comment, and stays. Full rule in `NESTJS-RULES.md`.

**Dead code found on the way** — a method on a Prisma repository not declared
on the port and called nowhere — gets deleted, and the commit message says so.
Grep the whole tree first; a method reachable through a differently-named port
method is not dead.

**Copy-pasted imports.** Entity files inherited an eight-name import block from
`shared/domain/entities` during the extraction; most use two or three. Trim to
what is used — `typecheck` proves the rest were unused.
