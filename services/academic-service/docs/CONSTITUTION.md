# 241 Apps Constitution

**Version 1.1.0 · Ratified 2026-09-02 · Last amended 2026-09-16**

This document is binding across all nine services of the 241 Apps platform,
maintained in the `241-services` monorepo:
`identity-service`, `academic-service`, `admission-service`, `inventory-service`,
`portal-service`, `presence-service`, `hr-service`, `student-service`,
`assessment-service`.

**The shared principles and governance text applies to all nine services in one
`241-services` repository.** The shared text is mirrored into each service's
`docs/CONSTITUTION.md`; changes to a shared rule must update every copy in the
same session, and a drifted copy is a bug — see Governance.

Each service profile below is service-specific by design and MUST NOT be copied
between services. The repository boundary does not remove runtime, database,
migration, or release boundaries: each service remains independently operated
inside the monorepo.

Where this document and a service's own `docs/ARCHITECTURE.md`,
`docs/CLEAN-CODE.md` or `docs/NESTJS-RULES.md` disagree, **this document
wins** and the other is to be corrected. Where it is silent, they govern.

---

## Core Principles

### I. Layered Dependency Flow (NON-NEGOTIABLE)

Dependencies point one way, from the outside in. No layer may reach past its
neighbour.

```
presentation ──> application ──> domain
infrastructure ─────────────────> domain
```

- Controller → Use Case → Repository port → Prisma. Controllers MUST be
  HTTP-only (parse, delegate, return); they MUST NOT contain business logic or
  touch Prisma.
- Use cases MUST be injected with the abstract `IXxxRepository` token, never a
  concrete Prisma class, and **MUST NOT import or inject `PrismaService`**.
- Only `infrastructure/persistence/` may import Prisma. The port lives in
  `domain/repositories/`; the module wires them with
  `{ provide: IXxxRepository, useClass: PrismaXxxRepository }`.
- `domain/` MUST NOT import from `@prisma/client`, including type-only enum
  imports. A domain concept is declared in `domain/enums/` and mapped to the
  ORM's enum in the repository.
- One use case = one business operation, and **one use case = one file**.
  Several small classes (`CreateAgendaUseCase`, `UpdateAgendaUseCase`) are
  REQUIRED over one `manage-agenda.use-cases.ts` holding nine.
  `application/services/` is reserved for stateless helpers shared by two or
  more use cases, not for business operations.

Rationale: this is what makes a module removable and a service independently
evolvable. Every shortcut across a layer trades a few minutes now for a module
that can no longer be tested, replaced, or extracted later. A use case holding a
`PrismaService` cannot be tested without a database, and the query it runs is
invisible to everyone reading the port.

### II. Service Boundaries and One Source of Truth

A service owns its domain, and every other service reaches it only through a
published API.

- **A service MUST NOT import source from another service**, by path, by
  package, or by copy-paste. The nine service projects are siblings at runtime,
  dependencies.
- Where a service needs data another service owns, **HTTP is the only
  channel.** It declares a **port** (an abstract class in `platform/` or
  `integration/`) naming exactly what it needs, and an **adapter** behind it
  that speaks HTTP. The reference implementations are
  `inventory-service/src/platform/identity/` and
  `admission-service/src/admission/integration/`.
- The calling service MUST declare its own **narrow read model** naming only the
  fields it uses — never a type imported or copied from the owning service,
  whose payloads are free to grow.
- Ports and adapters MUST be confined to `platform/` or `integration/`. A use
  case calls the port; it never calls `fetch`.
- Inside a service, cross-module access goes through a module's public API only.
  `platform/` is a supplier to every module; business modules MUST NOT reach
  into each other's internals.
- **Barrel exception (NodeNext ESM):** a NestJS Module class or a cross-module
  DTO MUST be imported from its own `.module.js` / DTO file, never through a
  barrel. A DTO importing a barrel closes an ESM cycle and crashes boot.
- Code duplicated across services is a known, accepted cost of separate
  repositories, with one exception: **business arithmetic MUST NOT be
  duplicated.** See Principle VIII.

Rationale: the services were split by copying, so nothing mechanical prevents
one from growing a second copy of another's tables, types, or rules. Boundaries survive only because they are written down and
reviewed.

### III. Scoped and Authorized Data Access (NON-NEGOTIABLE)

Every query is scoped and every action is permission-controlled.

- Every query over a soft-deletable model MUST filter `deletedAt: null`. A
  `findMany()` without it silently returns deleted records. `includeDeleted` is
  an explicit input a caller must pass, never a default.
- Every row that belongs to a period MUST be scoped by its period key
  (`semesterId`, `academicYearId`, or a year/month pair). When the caller
  supplies none, the active period MUST be resolved rather than reading across
  all of them.
- Scoping happens **in the repository, in the `where` clause** — never by
  filtering in JavaScript after a wide read.
- Month bounds are `gte` / `lt`, never `lte`. A `lte` on the last day of a month
  includes midnight of the next one.
- Authorization MUST use permissions (`@RequirePermissions('students.create')`,
  module segment plural). **Role-name and role-code string comparisons are
  forbidden** in controllers, use cases, and repositories.
- Exactly one role bypasses the permission check: `SUPER_ADMIN`, as break-glass,
  so the school can recover when a grant configuration has locked everybody out.
  Every other role, `ADMIN` included, is authorised by the permissions it holds
  and by nothing else.
- The bypass is checked in exactly one place, `PermissionGuard`, and **MUST NOT
  be copied elsewhere.** A copy of a rule does not move when the original does,
  and the disagreement is invisible: a copy that survived the removal of the
  `ADMIN` bypass went on granting an approval signature the workflow never gave
  it. Adding a second bypassing role, or any exemption mechanism that restores
  one, is an amendment to this principle rather than a configuration change.
- Reading your own record is a separate permission and a separate route, not an
  `if` on `request.user` inside a general one.

Rationale: wrong data in a school record looks exactly like correct data to the
user reading it. Scoping and permission failures are silent by nature, so they
must be structural, not remembered per query.

### IV. Explicit Contracts at Every Boundary

Each boundary has its own shape, and crossing one means mapping, not forwarding.

| Type | Lives in | Carries |
| --- | --- | --- |
| `XxxDto` | `presentation/http/dto/` | `class-validator` + `@ApiProperty` |
| `XxxInput` | `application/use-cases/<name>/` | nothing — a plain interface |
| `XxxRepositoryInput` | `domain/repositories/` | nothing — a plain interface |

- **A use case MUST NOT import a `*Dto`.** A controller MAY pass its Dto object
  into a use case declaring an `Input` — TypeScript is structural and the use
  case's declared type is what is enforced — but the use case names the `Input`.
- **Use cases MUST map Input → RepositoryInput field by field.** Forwarding a
  whole object is forbidden: structural typing makes the pass-through compile,
  which is how an unwanted field silently reaches persistence.
- A repository port's input **and output** types are declared next to the port,
  in the same file as the abstract class. `Partial<Pick<Entity, ...>>` as a port
  parameter is forbidden — it couples the write surface to the entity's field
  list, so adding a field silently widens what every caller may write.
- API responses MUST use the global envelope `{ statusCode, message, data,
  meta? }`. There is no `success` field.
- **No `any`. No `unknown` in a declared return type.** No magic strings or
  numbers, no inline types inside use cases — types go next to their port or in
  `types/`, constants in `constants/`. Narrow projections in a signature
  (`Promise<{ id: string } | null>`) are acceptable.
- Errors MUST be NestJS HTTP exceptions (`NotFoundException`,
  `ConflictException`). `throw new Error()` is forbidden; custom exceptions MUST
  extend a built-in. A `domain/` file MAY throw an `HttpException` subclass; it
  MUST NOT import `@Injectable()`, a repository, Prisma, or a DTO.
- **Domain events are not used.** `@nestjs/event-emitter` is not a dependency in
  any service. A 1:1 must-succeed consequence MUST be a direct awaited call. An
  in-process emitter is fire-and-forget, so a failed consequence is logged
  instead of reaching the caller; decoupling that hides a failed enrolment is
  not decoupling. Revisit only if a real broker is introduced, and record it as
  an ADR.
- **A cross-service response contract is append-only.** Removing or renaming a
  field in a payload another service reads requires a coordinated release with
  every consumer, and the consumer's narrow read model changes in the same PR
  pair.

Rationale: an implicit contract fails at runtime, in production, on a record
someone depends on. Every rule here converts a silent failure mode into a
compile error or an HTTP status.

### V. Green Quality Gates

A change is finished when the gates are green — not when it works locally.

- Every service exposes `validate` and MUST pass it before merge:
  `format:check + lint + typecheck + lint:strict + test + build`.
- `pnpm prisma:generate` is required before anything else in a fresh checkout,
  and is always safe.
- **New use cases MUST ship with a `*.spec.ts`.** This is established practice
  across the platform, not a new demand.
- **Never add a spec to a use case that never had one, and never delete one that
  did**, during a refactor. A refactor commit that changes test coverage is two
  changes in one diff.
- File budgets, counting code (imports, `@Api*` Swagger decorators, and pure
  data/registry constant files excluded): use case / service ≤ 300 lines,
  repository class ≤ 200, controller ≤ 150, any other file ≤ 300. An
  over-budget repository MUST be split into sibling `*.includes.ts`,
  `*.where.ts`, `*.reader.ts`, `*.writer.ts` files, leaving the class a flat
  contract → call map. **The interface MUST NOT be split.**
- Lint and type errors MUST be fixed, not suppressed. A disabled rule REQUIRES a
  comment naming the upstream cause.
- **Zero comments in business code.** Not on a use case, not on a repository
  method, not on a controller. If a line needs a comment to be understood, the
  name is wrong or the function is too long. Swagger
  `@ApiProperty({ description })` is API documentation and stays. A test is how
  a past bug is documented.
- **The one sanctioned comment exception** is a decision a reader cannot recover
  from the code, where getting it wrong fails quietly: a trade-off at a service
  boundary, in `platform/` and `integration/` adapters, published contract
  types, and shared persistence helpers. It explains WHY, never what the code
  already says.
- Commit scope: `git add -- <path>`, never `git add -A` or `git add .` without a
  path, and read `git diff --cached --stat` before committing.

Rationale: gates that are optional are gates that are skipped under deadline.
The budgets are early warnings — a file exceeding them has usually absorbed a
second responsibility.

### VI. Data Ownership and Transaction Boundaries

A module owns its tables. Prisma is one client over one database, so nothing
mechanical stops a repository from reading another module's rows — which is
precisely why this must be a stated rule.

- A repository MUST query only the models its own module owns. Reading another
  module's data goes through that module's injected port, never
  `this.prisma.<theirModel>`.
- Use a Prisma transaction when several writes inside ONE module must land
  together and are not safe to retry. Reach for one because of that, never
  because "multiple writes" pattern-matches a database habit.
- Prefer the batch form `prisma.$transaction([...])` when the writes do not
  depend on each other; reserve the interactive form for genuine
  read-then-decide-then-write sequences. Interactive transactions MUST stay
  short and MUST NOT contain network calls, file/storage I/O, or slow queries.
- **A write sequence that crosses a service boundary MUST NOT be wrapped in a
  shared transaction.** Immediate consistency belongs inside an aggregate;
  between services it is eventual. See Principle VIII for the shape that
  replaces it.

Rationale: Principle I's layering is enforced by types; data ownership is not.
Prisma will happily join across every domain in the schema, and a transaction
will happily span two modules. Both boundaries survive only because they are
written down and reviewed.

### VII. Schema Ownership and Migration Safety (NON-NEGOTIABLE)

Exactly one process may migrate any given database.

- A service MAY run `prisma migrate` **only if** its `DATABASE_URL` names a
  database no other service writes to **and** its schema declares every model in
  that database. Both conditions, not either.
- A service that does not meet both conditions MUST NOT ship a `prisma:migrate`
  or `prisma:deploy` script, and its `start:prod` MUST be
  `node dist/src/main.js` and nothing else.
- Where several services share a database, each one's schema MUST declare **all**
  models in it, not only its own. A partial schema is a lie about the database
  the client connects to, and it turns an accidental migrate from wrong into
  catastrophic: Prisma treats its schema as the whole truth and drops what the
  schema does not declare.
- A schema change to a shared database is made in the owning repository first,
  then copied into every other service as a `.prisma` edit with **no** migration
  run from those repositories.

> "Services can safely share the same physical database **server**, but problems
> arise when services share the same **schema or the same set of database
> tables**." — Azure Architecture Center, *Data considerations for
> microservices*

That quote names the state most of this platform is in today — the same schema
and the same tables, not merely the same server. It is the state the couplings
listed in each service's `ARCHITECTURE.md` exist to leave.

Rationale: two deployers racing to change one schema that each describes only
part of means the loser drops the winner's tables. This is the only rule in this
document whose violation destroys data rather than degrading quality.

### VIII. Cross-Service Failure Is Explicit

A call across a service boundary can fail in ways an in-process call cannot, and
each failure mode gets a decided answer rather than a default.

- **Fail closed on authorization.** When the identity service is unreachable,
  refuse the request. Return **503, not 401** — a 401 sends an operator to check
  their password, a 503 says the platform is degraded.
- **Cache deliberately, and state the staleness.** Caching an identity lookup
  makes revocation eventually consistent within a bounded window. That window is
  configuration, it is short, and it is documented at the adapter.
- **A multi-service write is a saga, not a transaction.** A sequence of local
  transactions, each with a compensating step, replaces one distributed commit.
  The compensating step is written at the same time as the forward step, not
  later.
- **Every cross-service write MUST be idempotent on a natural key**, and the
  idempotency check MUST run **before** the uniqueness check. Reversing them
  makes a retry fail as a duplicate of the very record it is confirming.
- **A non-atomic sequence MUST be visible and repairable.** An operator must be
  able to see the half-finished state and fix it by repeating the action. A
  failure mode that is invisible is worse than one that is merely inconvenient.
- **Business arithmetic has exactly one implementation.** A rule copied across a
  service boundary does not move when the original does. Splitting payroll from
  presence produced a copied `summariseMonth` with four defects — `LATE`
  counting as a present day, `lateCount` keying on status rather than minutes,
  `lateMinutes` accumulating unconditionally, and the month bounded `lte`
  rather than `lt`. None failed a build; all four would have shipped payslips
  that were quietly, slightly wrong. Before extracting a service, identify the
  arithmetic that must not be duplicated and put it behind a contract both sides
  test.

Rationale: a single process fails loudly — an exception, a rolled-back
transaction. A distributed system fails quietly: a stale grant, a half-completed
enrolment, a payslip that is off by one day. Each of these rules converts a
quiet failure into a loud one.

---

## Technology and Structure Constraints

- **Runtime:** Node.js, TypeScript, NestJS, Prisma over PostgreSQL.
- **Modules:** NodeNext ESM. Every relative import ends in `.js` though the
  source is `.ts`. This is correct and is not a typo to fix.
- **Target:** ES2023. `module` and `moduleResolution` are both `nodenext` in
  every service.
- **Package manager:** pnpm. Each service is its own workspace.
- **Logging:** `nestjs-pino`. Structured, never `console.log`.
- **Validation:** `class-validator` + `class-transformer` in DTOs. `zod` is used
  for environment configuration, not for request bodies.
- **Auth transport:** JWT via `passport-jwt`, verified locally in every service.
  Who the caller *is* comes either from `identity-service` over HTTP or, in services
  that have not yet migrated, from a direct read of the shared database.
- **HTTP hardening:** `helmet` and `@nestjs/throttler` in every service. A
  public surface gets its own throttle configuration, separate from the
  authenticated default.
- **The canonical module layout** is the four layers of Principle I:
  `domain/`, `application/`, `infrastructure/`, `presentation/http/`, with
  `constants/` at the module root. Each service's `docs/ARCHITECTURE.md` states
  how far that service has migrated and in what order it will finish.
- **`shared/` is a kernel, not a dumping ground.** Helpers, types, enums,
  constants, utils — never business logic. When a shared helper starts encoding
  a domain rule, it belongs in that domain's module instead.
- **`platform/` is a supplier.** It holds what a service borrows from
  `identity-service`, narrowed to a read or a single write. If a controller in
  `platform/` would answer the same URL as one in `identity-service`, it does not
  belong there.

## Adding a New Service

A new service is justified only when it owns a domain no existing service owns.
Before creating one, answer all five:

1. **What does it own?** Name the tables. If the answer is "some of another
   service's", it is a module, not a service.
2. **What does it need from others, and through which port?** Name the port and
   the endpoint. "It will read the shared database" is not an answer; it is the
   state the platform is trying to leave.
3. **Which database?** A new service SHOULD own its database from day one —
   that is the one thing `inventory-service` got right that the others must now
   retrofit. If it must share, Principle VII's full-schema rule applies from the
   first commit.
4. **What arithmetic must not be duplicated?** Principle VIII. Answer this
   before writing code, not after a bug.
5. **How does a caller fail when this service is down?** Decide the status code
   and the fallback now.

Then: `docs/ARCHITECTURE.md`, `docs/CLEAN-CODE.md`, `docs/NESTJS-RULES.md`,
`docs/IAM.md`, and this constitution are copied in, the profile section is
written, and `.claude/skills/` is copied from a sibling.

## Development Workflow and Review Process

- **One module per commit** during a layering migration. A rename plus a split
  in one diff is unreviewable.
- **Split multi-use-case files as their own commit**, before any folder moves.
- A refactor commit changes structure only. Behaviour changes are separate
  commits.
- Every PR runs `pnpm run validate` in the service it touches.
- A change to a file that exists in two repositories — `NESTJS-RULES.md`,
  `IAM.md`, this constitution's shared text, a `.prisma` model in the shared
  schema — MUST be made in **all** of them, in the same session. There is no
  sync tooling and no CI check for this.
- Cross-service contract changes ship as a PR pair, merged in dependency order:
  the provider's append-only change first, the consumer's read-model change
  second.

## Compliance Baseline (surveyed 2026-09-02)

Measured across the six services included in the initial survey on 2026-09-02. It
records the distance to be closed, not a set of new violations.

| Service | `application/` layer | Use cases naming a Dto | Prisma outside `infrastructure/` | Specs |
| --- | --- | --- | --- | --- |
| `academic-service` | 13 modules migrated | 9 / 219 | 10 | — |
| `identity-service` | 0 of 6 | 11 / 35 | 1 | 31 |
| `inventory-service` | 0 of 8 | 22 / 40 | 1 | 12 |
| `admission-service` | 0 of 1 (flat) | 19 / 36 | 1 | 20 |
| `portal-service` | 0 of 8 | 19 / 30 | 1 | 36 |
| `presence-service` | 0 of 14 | 18 / 33 | 14 | 44 |

Known outstanding items, each named in the owning service's `ARCHITECTURE.md`:

- **Principle VII: closed on 2026-09-09.** The survey above was taken while
  eight services shared one database and each declared only part of it, which
  is why `identity-service` holding `prisma:migrate` was a defect. The database
  was separated rather than the scripts removed: every service now owns its own
  and declares it completely, so all nine hold both scripts legitimately. The
  per-service profile below reflects that; the table's other columns still
  reflect 2026-09-02.
- **Principle I:** `presence-service`'s `CloseAttendancePeriodUseCase` injects
  `PrismaService`. Thirteen further files import Prisma enums into `domain/` or
  DTOs across that service.
- **Principle I:** nine files in `portal-service` hold between 2 and 9 use case
  classes each.
- **Principle II:** `academic-service`, `admission-service`, `portal-service`
  and `presence-service` read `auth_sessions` and `users` from the shared
  database rather than calling `POST /auth/introspect`.
- **Principle V:** `inventory-service`'s `circulation` module — the borrow and
  return flow — has no specs.
- **Auditing is not enforced.** `platform/audit-log/` exists as infrastructure;
  most modules do not write to it. Do not describe this platform as audited.

## Governance

- This constitution supersedes conflicting guidance in any service's own docs.
- **Amendment procedure:** an amendment names (a) the exact edits, (b) the
  version bump and its rationale, (c) the docs and ADRs affected, (d) the
  migration plan or its absence, and (e) whether the Compliance Baseline is
  re-surveyed. It is then applied to **the root constitution and all nine
  service copies** in the same
  session.
- **Versioning:** MAJOR for a principle removed or materially narrowed in a way
  that removes a capability; MINOR for a new principle or a materially expanded
  one; PATCH for clarifications that change no rule.
- **Drift is a bug.** If the shared text differs between two repositories,
  whichever carries the higher version number is authoritative, and the others
  are corrected in the same session the drift is found.
- Compliance is reviewed at PR time against the service's `ARCHITECTURE.md` and
  `CLEAN-CODE.md`, which are this document's concrete expression.

---
# SERVICE PROFILE — academic-service

*This section is specific to this repository. Do not copy it into another
service.*

**What it owns:** SIAKAD — students, staff, curriculum, schedule, assessment,
report cards. `src/academic/` holds twenty-five modules.

**What it borrows:** four platform pieces from `identity-service`
(`platform/auth`, `platform/access-control/permission`, `platform/user`,
`platform/school-unit`) and one slice of `presence-service`
(`presence/daily-record`, narrowed to two methods). Each is narrowed to a read
or a single write. None is a second copy of the owning service.

**What it publishes:** `POST /students/enrol`, consumed by
`admission-service`'s `HttpStudentEnrolmentAdapter`. It is **idempotent on
`userId`**, and under Principle VIII that idempotency is checked before
uniqueness — `enrol-existing-account.use-case.spec.ts` guards the ordering.

**Database posture — Principle VII, satisfied by owning the database.**
`academic_service`, 21 models across 7 `.prisma` files, none of them another
service's. `prisma:migrate` and `prisma:deploy` both ship and are safe to run.
`start:prod` does not migrate — migration is an explicit deploy step.

**Layering status:** 13 modules migrated — the reference implementation for the
platform. `academic-setting` (class entity) and `academic-year` (interface
entity with policies) are the two modules to copy from.

**Open couplings:** authorization reads iam's tables (reduced — permissions now
come from the token); provisioning writes iam's tables (transaction split done,
still a local write); rosters join to `profiles` (not started, deliberately).
Detail and closing order in `docs/ARCHITECTURE.md`, Part 2.
