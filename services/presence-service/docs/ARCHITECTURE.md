# ARCHITECTURE

The one reference for how this service is built. Two halves:

- **Part 1 — inside a module.** The Clean Architecture layering `src/presence/`
  and `src/payroll/` are being migrated to, and the procedure for converting a
  module.
- **Part 2 — between services.** Why two bounded contexts share one deployable,
  what `academic-service` borrows from here, and the shared database.

They are independent: a module can be perfectly layered and still wrongly
coupled, and the reverse.

`NESTJS-RULES.md` holds the coding rules (controllers, DTOs, validation,
naming). Its two *structure* sections — `DOMAIN STRUCTURE` and
`MODULE STRUCTURE` — are superseded by Part 1 here. `IAM.md` holds how
authorization works and which service owns it. `CLEAN-CODE.md` covers what a
file looks like once it is in the right place.

---

# PART 1 — INSIDE A MODULE

## Where this service stands today

Measured 2026-09-02 against `src/presence/` and `src/payroll/`:

| Signal | Count |
| --- | --- |
| Modules using the target `application/` layer | **0 of 14** |
| Use cases importing a `*.dto.js` (application → presentation) | **18 of 33** |
| Files touching Prisma outside `infrastructure/` or `core/` | **14** — the highest of the nine services |
| Controllers touching Prisma | 0 |
| Files over 300 lines | 0 |
| `.spec.ts` files | **44** — the most of the nine services |

Two numbers pull in opposite directions, and both are real. This service has the
most tests on the platform, and they are good ones — `payroll/integration`'s
README documents four arithmetic bugs that specs caught before they reached a
payslip. It also has the most Prisma leakage into layers that should not know
what an ORM is.

The leakage is not one problem but two, and they need different fixes.

### Leak 1 — a use case injecting `PrismaService` (1 file)

```ts
// presence/attendance-period/use-cases/close-attendance-period.use-case.ts
constructor(
  private readonly periods: IAttendancePeriodRepository,
  private readonly prisma: PrismaService,      // ← application → infrastructure
) {}
```

This is the hard violation. The use case holds a port *and* a database handle,
and its private `findIncomplete()` runs a query the port does not declare. The
arrow points from the inner layer to the outer one, and the use case can no
longer be tested without a database.

**The fix:** `findIncompleteRecords(year, month)` becomes a method on
`IAttendancePeriodRepository` (or on `IDailyPresenceReadPort`, whichever owns
the rows it reads), implemented in `infrastructure/`. The use case keeps its
decision — refuse to close while records are incomplete — and loses the query.
`IncompleteRecord` moves next to the port, as a port output type.

### Leak 2 — domain entities and DTOs importing Prisma enums (13 files)

```ts
// presence/leave/domain/entities/leave.entity.ts
import { LeaveRequestStatus, LeaveTreatment } from '@prisma/client'
```

Seven `domain/entities/` files and several DTOs do this. It is milder than leak
1 — a type-only import, no runtime dependency — but it means the domain's
vocabulary is defined by the schema, so a status cannot be renamed, deprecated,
or given a domain-only member without a migration.

**The fix:** declare the enum in `domain/enums/` and map to Prisma's in the
repository. `portal-service` already does exactly this
(`domain/enums/content-status.enum.ts`); copy the pattern.

Do leak 1 first — it is one file and it is the one that actually breaks
testability.

## Two contexts, one deployable

`src/presence/` and `src/payroll/` are two bounded contexts, and the boundary
between them is real: presence records what happened, payroll decides what it is
worth. They share a process, not a model.

**They were split into two services on 2026-08-29 and merged back the next day.**
That history is the most useful architectural fact in this repo, and
`payroll/integration/README.md` records why: the split created an
`IDailyPresenceReadPort` adapter carrying a *copy* of presence's
`summariseMonth` arithmetic, and the copy got four things wrong — `LATE`
counting as a present day, `lateCount` keying on status rather than minutes,
`lateMinutes` accumulating unconditionally, and the month bounded `lte` rather
than `lt`. None would have failed a build. All four would have produced payslips
that were quietly, slightly wrong.

The lesson, stated as a rule:

> **Do not split payroll from presence again until `summariseMonth` has one
> implementation behind a contract that both sides test.** The seam is not the
> module boundary; it is that arithmetic.

Inside one process, the correct shape is a direct, awaited call into the other
context's exported use case — which is what `payroll` does now, importing
`IAttendancePeriodRepository` and `IDailyPresenceReadPort` from `presence/`.

## The target layout

Every module converges on this shape. `presence/device` is the module to convert
first: four use cases, one repository, one controller, no cross-context readers.

```
device/
├── device.module.ts
├── index.ts
├── constants/                                  stays at the module root
├── domain/
│   ├── entities/device.entity.ts
│   ├── enums/                                  declare enums here, not @prisma/client
│   ├── policies/                               self-contained rules go here
│   └── repositories/device.repository.ts       abstract = port + DI token
├── application/
│   ├── use-cases/
│   │   ├── register-device/
│   │   │   ├── register-device.input.ts
│   │   │   └── register-device.use-case.ts
│   │   └── ...                                 one folder per use case
│   └── services/                               stateless logic shared by 2+ use cases
├── infrastructure/
│   └── persistence/prisma/
│       └── prisma-device.repository.ts
└── presentation/http/
    ├── device.controller.ts
    └── dto/
        ├── request/
        └── response/
```

`presence/shared/` (constants, decorators, guards, services) and
`payroll/shared/` (filters, services) stay where they are — they are each
context's kernel, not a module, and they hold no business logic.

`payroll/integration/` stays too. It is the port to `academic-service` and it
belongs at the context root, not inside a module — see Part 2.

## The dependency rule

```
presentation ──> application ──> domain
infrastructure ─────────────────> domain
```

- `domain/` imports nothing from the other three layers — **and nothing from
  `@prisma/client`.**
- `application/` may import `domain/`. **Never Prisma, never a DTO.**
- `infrastructure/` implements a `domain/` port. The only place touching Prisma.
- `presentation/` may import `application/`. Never a repository, never Prisma.

Across contexts: `payroll/` may import a `domain/repositories/` port and an
exported use case from `presence/`. It may not import a `presence/`
`infrastructure/` file, a DTO, or a controller.

## Which entity style — the deciding question

> **Can the aggregate enforce a rule entirely on its own, with no database
> lookup?** If yes, a class. If no, an interface.

**`AttendancePeriod` says yes.** Whether a period may close is a rule about its
own status, and `AttendancePeriodEntity` already exists as a class. Its
`close()` should assert the transition internally so a closed period cannot be
closed twice — the check `existing?.status === 'CLOSED'` currently sits in the
use case.

**`DailyPresence` says yes for its arithmetic and no for its completeness.**
Whether a day is late, and by how many minutes, is decided from the record's own
timestamps and the work pattern handed to it. Whether the *month* is complete
needs a query. Put the arithmetic on the entity or in
`domain/policies/presence-arithmetic.policy.ts` — it is the code the failed
split proved must have exactly one home — and leave completeness in the use
case.

**`PayrollRun` says no.** Its inputs are a month's worth of other aggregates.

Self-contained checks go in `domain/policies/`, never in the entity file — an
entity file describes shape, a policy file states a rule.

**Default to interface.** Reach for a class only when you can name the
self-contained rule.

## Three type boundaries

| Type | Lives in | Carries |
| --- | --- | --- |
| `XxxDto` | `presentation/http/dto/` | `class-validator` + `@ApiProperty` |
| `XxxInput` | `application/use-cases/<name>/` | nothing — a plain interface |
| `XxxRepositoryInput` | `domain/repositories/` | nothing — a plain interface |

They may be structurally identical. TypeScript is structural, so a controller
passes a Dto straight into a use case expecting an Input. **Do not write a
mapper for it.** What you must not do is let the use case *name* the Dto.

Create `.input.ts` only when the use case takes structured input. One taking
`(id: string)` or nothing needs no Input file.

A port's **output** types are declared next to the port too. `IncompleteRecord`
in `close-attendance-period.use-case.ts` is one of these in the wrong file — it
describes what a query returns, so it belongs with the port that will return it.

## Import depth

NodeNext ESM: **every relative import ends in `.js`** though the source is
`.ts`. A wrong `../` count is the most common conversion error, and
`pnpm run typecheck` catches every one.

| File location | → `src/` | → module root |
| --- | --- | --- |
| `<module>.module.ts`, `index.ts` | `../../` | `./` |
| `domain/{entities,repositories,policies,enums}/x.ts` | `../../../../` | `../../` |
| `application/use-cases/<name>/x.ts` | `../../../../../` | `../../../` |
| `application/services/x.ts` | `../../../../` | `../../` |
| `infrastructure/persistence/prisma/x.ts` | `../../../../../` | `../../../` |
| `presentation/http/x.controller.ts` | `../../../../` | `../../` |
| `presentation/http/dto/request/x.dto.ts` | `../../../../../../` | `../../../../` |

Depths assume a module directly under `src/presence/` or `src/payroll/`.

## Converting a module — the procedure

One module per commit. Old layout → new:

| Old | New |
| --- | --- |
| `domain/interfaces/<name>-repository.interface.ts` | `domain/repositories/<name>.repository.ts` |
| `use-cases/<name>.use-case.ts` | `application/use-cases/<name>/<name>.use-case.ts` |
| `services/<name>.service.ts` | `application/services/<name>.service.ts` |
| `infrastructure/persistence/*.ts` | `infrastructure/persistence/prisma/*.ts` |
| `presentation/<name>.controller.ts` | `presentation/http/<name>.controller.ts` |
| `dto/request/*.ts`, `dto/response/*.ts` | `presentation/http/dto/request/*.ts`, `.../response/*.ts` |

`constants/` stays at the module root. `domain/entities/` does not move.

**1. Find every external consumer first** — and for this service that includes
the *other context* and `academic-service`.

```bash
grep -rln "<module>/domain/interfaces\|<module>/use-cases\|<module>/dto/\|<module>/presentation/\|<module>/infrastructure/persistence" src
```

**2. Move the port.** Same depth, so its own imports do not change.

**3. Move each use case into its own folder.** Add `.input.ts` where it used to
take a `*Dto`, and change the signature to the `Input`. Move its `.spec.ts`
alongside. Fix depths. Never add a spec to a use case that never had one, never
delete one that did.

**4. Move infrastructure** into `infrastructure/persistence/prisma/`.

**5. Move presentation** into `presentation/http/`, DTOs under `dto/request/`
and `dto/response/`.

**6. Fix the consumers from step 1**, then re-run the grep to confirm nothing is
left.

**7. Rewrite `<module>.module.ts` and `index.ts`.** Keep any `forwardRef()`
exactly as it was — it is there for a circular dependency.

**8. Verify in order, stopping at the first failure.**

```bash
pnpm run typecheck                      # catches every wrong ../
pnpm run lint && pnpm run lint:strict
pnpm exec jest --testPathPatterns=<module>
npx prettier --write "src/<context>/<module>/**/*.ts"
pnpm run validate                       # the whole pipeline, including build
```

**9. Commit, scoped to the module.**

```bash
git add -A -- src/<context>/<module>/
git diff --cached --stat                # READ THIS before committing
git commit -m "refactor(<module>): migrate to Clean Architecture layering"
```

**Suggested order:** `presence/device` (the rehearsal) → `presence/work-pattern`
→ `presence/leave` → `presence/credential` → `presence/attendance-period` (fix
leak 1 here) → `payroll/component` → `payroll/assignment` → `payroll/payslip` →
`payroll/run` → `presence/scan` → `presence/daily-record` **last**, because it is
the module `academic-service` and all of `payroll/` read.

Done so far: none.

## What this layering deliberately does not do

Stated once, here, so it isn't relitigated module by module:

- **No domain events.** A module needing another module's result makes a direct,
  awaited call into that module's exported use case. `@nestjs/event-emitter` is
  not a dependency. This includes across the presence/payroll boundary.
- **No value objects for primitives.** A date, a minute count, a rupiah amount
  is validated by a policy function at the boundary (`domain/policies/`), not
  wrapped in a class.
- **A repository port's input/output types are declared next to the port**, in
  the same file as the abstract class.
- **A mapper file is the exception, not the default.** Reach for
  `infrastructure/mappers/` only when a row's outward shape genuinely differs
  from what Prisma returns.

---

# PART 2 — THE SERVICE BOUNDARY

## What is owned, and what is borrowed

`src/presence/` and `src/payroll/` are owned. Three platform pieces are borrowed
from `identity-service`, each narrowed to a read or a single write.

| Here | May do | Left behind |
| --- | --- | --- |
| `platform/auth` | Verify a token, check the session is live | Login, refresh, logout, password reset, session cleanup |
| `platform/access-control` | `PermissionGuard` asking if the caller holds a permission | The use cases, the controller, the catalogue-sync hook |
| `platform/audit-log` | Write an audit entry for a correction or an approval | Reading and searching the audit log |

> **The narrowing rule:** if a controller here would answer the same URL as one
> in `identity-service`, it does not belong here.

## What this service provides to others

Unusually, this service is on the *supply* side of a boundary.
`academic-service` borrowed `presence/daily-record` and narrowed it to **two
methods** — gate suggestions and a monthly summary — leaving behind twenty-eight
files covering scan, corrections, credentials, work patterns and audit.

That narrowing is a contract even though it is currently satisfied by a copy of
the code rather than an HTTP call. Two rules follow:

- **`summariseMonth` and the gate-suggestion read are public API.** Changing
  either one's semantics changes `academic-service`'s report cards. The failed
  split proved this the expensive way.
- **Do not delete or rename a `daily-record` port method** without checking
  `academic-service/src/presence/daily-record/domain/repositories/`.

## The one port out

| Port | Method | Owned by |
| --- | --- | --- |
| `IPayrollRosterPort` | `listActiveEmployees()` | `academic-service` |

It stays a port because `academic-service` really is a separate service. Swap
its adapter for an HTTP client and `payroll` stops reading the `teachers` table
directly — that is the whole remaining distance for this coupling.

Two ports that used to exist here are gone, and should not come back inside one
process: `IAttendancePeriodGate.isClosed()` and `IDailyPresenceReadPort.summariseMonth()`
are now the real repositories from `presence/`, imported directly. See
`payroll/integration/README.md`.

## Its own database, and who may migrate it

This service owns `presence_service` alone: **14 models** across 2 `.prisma`
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
## Couplings, and what closing them means

| # | Coupling | Status |
| --- | --- | --- |
| 1 | Authorization reads iam's tables | **Open.** `platform/auth` reads `auth_sessions` and `users` per request through Prisma |
| 2 | Payroll reads academic's `teachers` | **Port in place, adapter still local.** `IPayrollRosterPort` exists; its implementation reads Prisma |
| 3 | Presence records join to `profiles` | **Open, deliberately.** While both tables sit in one database the join is the faster read |
| 4 | `academic-service` holds a copy of `daily-record` | **Open.** Two methods, narrowed, but still a copy |

Coupling 1 is the next to close, and the shape is proven: `inventory-service`
replaced exactly this with `IIdentityPort` + `HttpIdentityAdapter` calling
`POST /auth/introspect`. Copy that, including its two decisions — cache the
introspection for a few seconds, and return 503 rather than 401 when
`identity-service` is unreachable.

Coupling 2 is the cheapest: the port already exists, so only the adapter
changes.

Only after all four can this service's database separate — and only then does
`prisma migrate` belong to it.

## Naming the boundary correctly

`payroll/integration/` is a **port and adapter**. It becomes a genuine
**Anti-Corruption Layer** once its adapter speaks HTTP and has to translate
`academic-service`'s employee shape into payroll's roster shape.

Do not call `platform/` an ACL. It reads `auth_sessions` and `users` through the
identical Prisma models `identity-service` itself uses; it translates nothing.

## Authorization rule, binding

**Permissions, never role names** — `@RequirePermissions('payroll-runs.approve')`,
module segment plural. `SUPER_ADMIN` is checked in exactly one place, the
`PermissionGuard`.

---

# PITFALLS

**Never `git add -A` or `git add .` without a path.** Scope to the module, and
read `git diff --cached --stat` before committing. To tell a real change from
line-ending noise: `git diff --ignore-cr-at-eol -- <path>` — empty means no real
change.

**Do not re-split payroll from presence.** It was tried on 2026-08-29 and
reverted on 2026-08-30, and the reason is written down in
`payroll/integration/README.md`. If it is attempted again, the precondition is
one tested implementation of `summariseMonth` behind a contract — not a copied
one.

**Never duplicate presence arithmetic.** `summariseMonth` and the late/present
rules have exactly one implementation. A second copy has already produced four
silent errors, each of which would have shipped a slightly wrong payslip.

**An approved payroll run cannot be edited (FR-050).** That is why
`CloseAttendancePeriodUseCase` refuses to close a month with incomplete records.
Do not relax that check to unblock a run; resolve the records.

**Zero comments in business code.** Do not add explanatory comments, and when
relocating a file, strip the comments it already carries in the same pass.
Swagger `@ApiProperty({ description })` is API documentation and stays. The
prose on `CloseAttendancePeriodUseCase` is the sanctioned exception — it states
why a refusal is preferable to an adjustment run; see `CLEAN-CODE.md`, "comment
rules".

**Dead code found on the way** gets deleted, and the commit message says so.
Grep both contexts and `academic-service` first; a method reachable through a
differently-named port method is not dead.
