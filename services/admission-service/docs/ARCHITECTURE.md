# ARCHITECTURE

The one reference for how this service is built. Two halves:

- **Part 1 — inside a module.** The Clean Architecture layering `src/admission/`
  is being migrated to, the submodules it needs to be split into first, and the
  procedure for converting one.
- **Part 2 — between services.** What this service borrows from `identity-service`,
  the enrolment handover to `academic-service`, and the shared database.

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

Measured 2026-09-02 against `src/admission/`:

| Signal | Count |
| --- | --- |
| Modules | **1** — everything is one flat `admission/` |
| Use cases in a single `use-cases/` folder | **34** |
| Use cases importing a `*.dto.js` (application → presentation) | **19 of 36** |
| Controllers | 5 |
| Repositories | 4 |
| Files touching Prisma outside `infrastructure/` or `core/` | 1 |
| `.spec.ts` files | 20 |

This service has the strongest *domain* layer of the five unmigrated services —
`admission-status.transitions.ts` is a real state machine, and
`enroll-as-student.rules.ts` has its own spec — and the weakest *module*
structure: one folder holding thirty-four use cases covering applicants, waves,
announcements, documents, payments, verification and notifications.

So the work here is in two stages, and the order matters: **split into
submodules first, then layer each submodule.** Layering a thirty-four-use-case
module produces a thirty-four-folder `application/use-cases/` directory that is
no easier to navigate than what exists now.

## Stage 1 — the submodule split

The bounded context is *admission*. Inside it, these are the aggregates, taken
from the repositories and entities that already exist:

| Submodule | Owns | Use cases today |
| --- | --- | --- |
| `applicant` | `AdmissionApplicant` — the person registering | register, get-my-application, update-my-application |
| `application` | `AdmissionApplication` — the form and its status | submit, verify, accept, reject, request-revision, enroll, get-applications, get-application-by-id, get-admission-stats |
| `wave` | `AdmissionWave` — the intake period | create, update, delete, get, get-by-id, get-active |
| `announcement` | `AdmissionAnnouncement` | create, update, delete, publish, get, get-published |
| `document` | `AdmissionDocument`, `AdmissionFile` | upload-admission-document, verify-document |
| `payment` | `AdmissionPayment` | upload-payment-proof, verify-payment |
| `notification` | applicant-facing notices | get-my-notifications, mark-notification-read |

`admission-status.transitions.ts` belongs to `application` — it is that
aggregate's invariant, and nothing else may import it except through a use case.

Split with `git mv`, one submodule per commit, keeping the old flat layout
inside each until stage 2. Nothing else changes in the same commit.

## Stage 2 — the target layout

Each submodule then converges on this shape:

```
wave/
├── wave.module.ts
├── index.ts
├── constants/                                  stays at the module root
├── domain/
│   ├── entities/admission-wave.entity.ts
│   ├── policies/                               self-contained rules go here
│   └── repositories/admission-wave.repository.ts   abstract = port + DI token
├── application/
│   ├── use-cases/
│   │   ├── create-admission-wave/
│   │   │   ├── create-admission-wave.input.ts
│   │   │   └── create-admission-wave.use-case.ts
│   │   ├── get-active-waves/                   no .input.ts — takes nothing
│   │   └── ...
│   └── services/                               stateless logic shared by 2+ use cases
├── infrastructure/
│   └── persistence/prisma/
│       ├── prisma-admission-wave.repository.ts
│       └── prisma-admission.includes.ts
└── presentation/http/
    ├── admission-wave.controller.ts
    └── dto/
        ├── request/
        └── response/
```

The five current controllers do not map one-to-one onto submodules —
`admission-admin.controller.ts` and `admission-public.controller.ts` are cut by
*audience*, not by aggregate. Keep that cut: a submodule may own two
controllers, one admin-facing and one public, and `presentation/http/` is where
both live. What must not happen is one controller reaching into two submodules'
use cases; if it would, the route belongs to whichever submodule owns the
aggregate being written.

## The dependency rule

```
presentation ──> application ──> domain
infrastructure ─────────────────> domain
```

- `domain/` imports nothing from the other three layers.
- `application/` may import `domain/`. **Never Prisma, never a DTO.**
- `infrastructure/` implements a `domain/` port. The only place touching Prisma.
- `presentation/` may import `application/`. Never a repository, never Prisma.

Nineteen of this service's thirty-six use cases break the second rule by
importing a DTO. The fix is one small file per use case — see "Three type
boundaries".

### The accepted deviation: `ConflictException` in `domain/`

```ts
// domain/admission-status.transitions.ts
import { ConflictException } from '@nestjs/common'

export function assertTransition(from: AdmissionStatus, to: AdmissionStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new ConflictException(`Invalid status transition: ${from} → ${to}`)
  }
}
```

Strictly, the domain layer now depends on NestJS. This is **accepted**, not
overlooked, and the reasoning is worth stating so it is not repeatedly
rediscovered:

- The alternative — a domain error type plus an exception filter translating it
  to 409 — is the correct shape and costs a file, a filter branch, and a mapping
  table for every rule.
- The whole platform runs on NestJS and no second delivery mechanism is planned.
  The portability the rule buys has no buyer.

The line to hold: **a domain file may throw an `HttpException` subclass. It may
not import a service, a repository, Prisma, a DTO, or `@nestjs/common`'s DI
decorators.** If a domain file ever needs `@Injectable()`, it is not a domain
file.

Revisit this if a rule ever has to be enforced outside an HTTP request — a
scheduled job, a queue consumer — since a `ConflictException` thrown there is
logged as a 409 that nobody sent.

## Which entity style — the deciding question

> **Can the aggregate enforce a rule entirely on its own, with no database
> lookup?** If yes, a class. If no, an interface.

**`AdmissionApplication` says yes**, and it is the one aggregate on the platform
that most clearly earns a class. Its central rule is a state machine over a
field it already holds — `assertTransition` needs nothing but `from` and `to`.
On conversion, `AdmissionApplication` becomes a class whose `submit()`,
`verify()`, `accept()`, `reject()` and `requestRevision()` methods return a new
instance and call `assertTransition` internally, so an application in an
impossible state cannot be constructed.

**`AdmissionWave` says no.** Overlapping-wave and open-period rules need
`findOverlapping()`. It stays an interface.

Self-contained checks go in `domain/policies/`, never in the entity file — an
entity file describes shape, a policy file states a rule.
`admission-status.transitions.ts` and `enroll-as-student.rules.ts` become
`domain/policies/` on conversion; both already have the right shape.

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

Note that `dto/` here has a `request/` folder and no `response/` — responses are
built by `admission.serializers.ts` in `domain/`. That is the wrong home for
them: a serializer shapes an HTTP response, so it is presentation. On conversion
it moves to `presentation/http/dto/response/` as `*ResponseDto` classes with
`fromDomain()` static methods.

## Import depth

NodeNext ESM: **every relative import ends in `.js`** though the source is
`.ts`. A wrong `../` count is the most common conversion error, and
`pnpm run typecheck` catches every one.

| File location | → `src/` | → module root |
| --- | --- | --- |
| `<module>.module.ts`, `index.ts` | `../../` | `./` |
| `domain/{entities,repositories,policies}/x.ts` | `../../../../` | `../../` |
| `application/use-cases/<name>/x.ts` | `../../../../../` | `../../../` |
| `application/services/x.ts` | `../../../../` | `../../` |
| `infrastructure/persistence/prisma/x.ts` | `../../../../../` | `../../../` |
| `presentation/http/x.controller.ts` | `../../../../` | `../../` |
| `presentation/http/dto/request/x.dto.ts` | `../../../../../../` | `../../../../` |

Depths assume a submodule at `src/admission/<submodule>/` after stage 1.

## Converting a module — the procedure

One submodule per commit. Old layout → new:

| Old | New |
| --- | --- |
| `domain/interfaces/<name>-repository.interface.ts` | `domain/repositories/<name>.repository.ts` |
| `use-cases/<name>.use-case.ts` | `application/use-cases/<name>/<name>.use-case.ts` |
| `services/<name>.service.ts` | `application/services/<name>.service.ts` |
| `infrastructure/persistence/*.ts` | `infrastructure/persistence/prisma/*.ts` |
| `presentation/<name>.controller.ts` | `presentation/http/<name>.controller.ts` |
| `dto/request/*.ts` | `presentation/http/dto/request/*.ts` |
| `domain/admission.serializers.ts` | `presentation/http/dto/response/*.dto.ts` |

`constants/` stays at the module root. `domain/entities/` does not move.

**1. Find every external consumer first.** This is your fix-up list for step 6;
empty means the module is self-contained.

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
npx prettier --write "src/admission/<module>/**/*.ts"
pnpm run validate                       # the whole pipeline, including build
```

**9. Commit, scoped to the module.**

```bash
git add -A -- src/admission/<module>/
git diff --cached --stat                # READ THIS before committing
git commit -m "refactor(<module>): migrate to Clean Architecture layering"
```

**Suggested order:** `announcement` (six use cases, no cross-aggregate reads,
already has a spec) → `wave` → `notification` → `document` → `payment` →
`applicant` → `application` last, because it owns the state machine and the
enrolment handover and every other submodule reads it.

Done so far: none.

## What this layering deliberately does not do

Stated once, here, so it isn't relitigated module by module:

- **No domain events.** A submodule needing another's result makes a direct,
  awaited call into that submodule's exported use case.
  `@nestjs/event-emitter` is not a dependency.
- **No value objects for primitives.** A NISN, a wave name, a date range is
  validated by a policy function at the boundary (`domain/policies/`), not
  wrapped in a class.
- **A repository port's input/output types are declared next to the port**, in
  the same file as the abstract class — never a bare domain entity passed into
  `create()`/`update()`.
- **A mapper file is the exception, not the default.** Reach for
  `infrastructure/mappers/` only when a row's outward shape genuinely differs
  from what Prisma returns. `prisma-admission.includes.ts` is the right pattern
  for the common case.

---

# PART 2 — THE SERVICE BOUNDARY

## What is owned, and what is borrowed

`src/admission/` is owned. Three platform pieces are borrowed from
`identity-service`, each narrowed to a read or a single write. **None is a second
copy of identity-service.**

| Here | May do | Left behind |
| --- | --- | --- |
| `platform/auth` | Verify a token, check the session is live | Login, refresh, logout, password reset, session cleanup |
| `platform/access-control/permission` | `PermissionGuard` asking if the caller holds a permission | The eight use cases, the controller, the catalogue-sync hook |
| `platform/user` | Read the account behind an applicant | `GET/POST/PATCH/DELETE /users` and their use cases |

> **The narrowing rule:** if a controller here would answer the same URL as one
> in `identity-service`, it does not belong here.

Before adding anything under `platform/`: does it fail that rule? Is it a read,
or a single write the admission flow cannot proceed without? Does it widen what
this service may do to another service's tables?

## The enrolment handover — the one real port

This is the most interesting boundary on the platform, and the pattern the other
services should copy.

Until 2026-08-30 admission ran enrolment itself:
`PrismaAdmissionApplicationRepository.enrollAsStudent()` opened one transaction
and wrote `profiles`, `students`, `parents`, `student_parents`, `addresses`,
`user_roles`, `student_enrollments` and `admission_applications` — **three
services' tables in one commit**, the heaviest coupling the split produced.

Six of those eight tables belong to `academic-service`. So the transaction moved
there, behind `POST /students/enrol`, and what remains here is a port and one
write of admission's own:

```
EnrollApplicantUseCase
  └─> StudentEnrolmentPort                  src/admission/integration/student-enrolment.port.ts
        └─> HttpStudentEnrolmentAdapter     src/admission/integration/http-student-enrolment.adapter.ts
              └─> POST {ACADEMIC_SERVICE_URL}/students/enrol
```

### What it costs, stated plainly

The operation is **no longer atomic**. academic enrols the student; admission
then marks the application `ENROLLED`. If that second write fails, a student
exists whose application still reads `ACCEPTED`.

That is a worse failure mode than one local transaction and a better one than
a distributed transaction, for two reasons:

- **It is visible.** The operator sees an application they just processed still
  sitting in the queue.
- **It is repairable by repeating the action**, because `POST /students/enrol`
  is **idempotent on `userId`**. A retry returns the existing student rather
  than creating a second one.

This is the **Saga pattern**'s compensating form — a sequence of local
transactions instead of one distributed one. The idempotency is load-bearing:
`academic-service`'s `enrol-existing-account.use-case.spec.ts` guards that
idempotency is checked *before* uniqueness, because it was once the other way
round and a retry was rejected as a duplicate NIS by the very student it was
confirming.

**Do not "fix" the non-atomicity** by moving the transaction back, or by adding
a two-phase commit. The shape that exists survives separating the databases; the
one it replaced does not.

## Its own database, and who may migrate it

This service owns `admission_service` alone: **9 models** across 3 `.prisma`
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
| 2 | Enrolment writes academic's tables | **Closed 2026-08-30.** Now `POST /students/enrol` behind a port |
| 3 | Applicant rows join to `profiles` | **Open, deliberately.** While both tables sit in one database the join is the faster read |

Coupling 1 is the next one to close, and the shape is already proven:
`inventory-service` replaced exactly this with `IIdentityPort` +
`HttpIdentityAdapter` calling `POST /auth/introspect`. Copy that, including its
two decisions — cache the introspection for a few seconds, and return 503 rather
than 401 when `identity-service` is unreachable.

Only after 1 and 3 close can this service's database separate — and only then
does `prisma migrate` belong to it.

## Naming the boundary correctly

`integration/` is a **port and adapter** and, because it translates admission's
applicant model into academic's `EnrolStudentInput`, it is a genuine
**Anti-Corruption Layer**. Use that term for it.

Do not call `platform/` an ACL. An ACL translates between two *different* domain
models, and nothing there does that — `platform/auth` reads `auth_sessions` and
`users` through the identical Prisma models `identity-service` itself uses. It
becomes an accurate name only once coupling 1 closes into a real HTTP call.

## Authorization rule, binding

**Permissions, never role names** — `@RequirePermissions('applications.verify')`,
module segment plural. `SUPER_ADMIN` is checked in exactly one place, the
`PermissionGuard`.

---

# PITFALLS

**Never `git add -A` or `git add .` without a path.** Scope to the module, and
read `git diff --cached --stat` before committing. To tell a real change from
line-ending noise: `git diff --ignore-cr-at-eol -- <path>` — empty means no real
change.

**Do not restore `enrollAsStudent()`.** The method that wrote three services'
tables in one transaction is gone on purpose. Its replacement is the port in
`integration/`, and the non-atomicity is the accepted cost. If you find yourself
wanting one transaction across the handover, re-read Part 2.

**Zero comments in business code.** Do not add explanatory comments, and when
relocating a file, strip the comments it already carries in the same pass.
Swagger `@ApiProperty({ description })` is API documentation and stays. The
prose in `integration/student-enrolment.port.ts` is the sanctioned exception — a
trade-off at a service boundary; see `CLEAN-CODE.md`, "comment rules".

**`prisma-admission-applicant.repository.ts` is 408 lines.** It is the largest
file in the service and past the point where one repository is one concern. Split
it when converting `applicant` — see `NESTJS-RULES.md`, "SPLITTING A
REPOSITORY".

**Dead code found on the way** gets deleted, and the commit message says so.
Grep the whole tree first; a method reachable through a differently-named port
method is not dead.
