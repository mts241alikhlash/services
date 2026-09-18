# 241 HUB

# BACKEND CODING RULES

Version: 1.2

Reconciled against the code. Where this document and the source disagreed, the
source won and the rule was rewritten to match — see EVENT RULES, SCOPING
RULES, RESPONSE RULES, MAPPER RULES, and ERROR HANDLING. Architectural
decisions are recorded in `docs/adr/`.

Module system:
NodeNext ESM (relative imports carry the `.js` extension)

Framework:
NestJS

Architecture:
Clean Architecture, Domain-Driven modules — this governs code organization
INSIDE one service (presentation → use-case → repository-port → adapter). It
is orthogonal to deployment topology. This repo is itself one microservice,
and the layering below is unchanged by that: it was never about how many
services exist.

ORM:
Prisma

Database:
PostgreSQL

Authorization:
RBAC + Permission Based Access Control

---

# CORE PRINCIPLES

1. Modular Monolith

2. Domain Driven Modules

3. One File = One Concern

4. Business Logic Inside Use Cases

5. Controllers Stay Thin

6. Explicit Dependencies

7. Feature First

8. Permission First

9. Scope Every Query (soft delete + active period)

10. Clean Code Over Clever Code

---

# HIGH LEVEL STRUCTURE

This document is carried byte-identical by every service here, so it describes
the pattern, not one fixed folder list.
**This repo's actual tree:**

src

├── core
├── shared
├── platform     # narrowed slices borrowed from identity-service — see CLAUDE.md
├── academic     # everything academic-service owns
└── presence     # a 2-method slice borrowed from presence-service

`inventory` and `admission` do not exist here — they are inventory-service's
and admission-service's own domains now, each in its own repo with its own
copy of this document. If you are reading this in one of those services,
substitute its domain for `academic` above; the rest of this document does
not change.

---

# DOMAIN STRUCTURE

The layering below is per-module and repeats identically whether the module
sits in this repo (`academic`, the narrowed `platform` slices) or in a
sibling service (`inventory`, `admission`, `iam` proper). It is not a
statement that those domains share a process with this one.

> **This repo has diverged from what follows.** The layout described in
> this section and the next is the *original* one. Every module under `src/`
> has been migrated to a stricter Clean Architecture layering — see
> `ARCHITECTURE.md`'s Part 1, which supersedes the two structure sections
> below. The rest of this document (controller, use-case, DTO, validation,
> comment, authorization rules) is unaffected and still binding everywhere.
> Note also that these modules sit directly under `src/`, not inside a
> `src/academic/` wrapper — that nesting was removed on 2026-09-03.
>
> The short version of what changed: the port moved from `domain/interfaces/`
> to `domain/repositories/`; use cases moved from `use-cases/` to
> `application/use-cases/<name>/`; the Prisma implementation moved into
> `infrastructure/persistence/prisma/`; controllers and DTOs moved under
> `presentation/http/`.

Each domain owns (original layering, superseded by ARCHITECTURE.md's Part 1
for every module in this repo, still accurate for any sibling that has not
migrated):

- presentation (controllers — thin, HTTP only)
- use-cases (one class per business operation)
- domain (entities, enums, interfaces, exceptions)
    interfaces/ holds the abstract repository = the port AND the DI token
- infrastructure (persistence: Prisma impl + *.includes.ts; mappers; parsers)
- dto (request/ and response/ — one DTO per file)
- types, constants

There is no top-level `repositories/` folder. The port lives in
`domain/interfaces/`, its Prisma implementation in `infrastructure/persistence/`,
and the module wires them together:

providers: [{ provide: IStudentRepository, useClass: PrismaStudentRepository }]

---

# MODULE STRUCTURE

Example

academic/student

student
├── presentation/       # controllers (thin, HTTP only)
├── use-cases/          # CreateStudentUseCase, UpdateStudentUseCase, ...
├── domain/
│   ├── entities/
│   ├── enums/
│   ├── exceptions/     # StudentNotFoundException, ... + index.ts
│   └── interfaces/     # IStudentRepository — port + injection token
├── infrastructure/
│   ├── persistence/    # PrismaStudentRepository + *.includes.ts / .where.ts / .writer.ts
│   ├── mappers/
│   └── parsers/
├── dto/                # request/ and response/ — one DTO per file
├── constants/
└── student.module.ts

---

# FORBIDDEN STRUCTURE

src

controllers

services

repositories

dto

shared globally

Never organize by technical layer.

Always organize by domain.

---

# CONTROLLER RULES

Controller responsibility:

- receive request
- validate request
- call the use case
- return response

Nothing else.

---

# CONTROLLER FORBIDDEN

Business logic

Database query

Complex mapping

Permission logic

Validation logic

---

# USE CASE RULES

The use-case owns the business logic. `academic/` names them `*UseCase`, not
`*Service` — `services/` is reserved for the few stateless helpers that are not
a business operation (e.g. `report-card/services/calculate-subject-grades.ts`,
`pdf.service.ts`).

Examples of what belongs here:

Student promotion

Report card generation

Attendance validation

Assessment publication

---

One use case

One business responsibility

---

Bad

StudentService

3000 lines

handles everything

---

Good

CreateStudentUseCase

UpdateStudentUseCase

PromoteStudentsUseCase

GenerateReportCardUseCase

---

A use-case may call another module's exported use-case directly (see EVENT
RULES). It must never call a controller, and never touch Prisma.

---

# USE CASE SIZE

Recommended

50-150 lines

Review

200+ lines

Refactor

300+ lines

---

# REPOSITORY RULES

Repository owns:

Database access only

---

Repository must never contain:

Business logic

Permission logic

Validation logic

---

Allowed

findById()

findMany()

create()

update()

delete()

---

# PRISMA RULES

All Prisma access must go through repository layer.

Forbidden

Controller → Prisma

Use Case → Prisma

---

Required

Controller

↓

Use Case          (injected as IXxxRepository, never the Prisma class)

↓

Repository        (the port; Prisma impl bound in the module)

↓

Prisma

---

The use-case depends on the ABSTRACTION. That inversion is what lets 1200+
tests run without a database — swap `useClass` and nothing above it changes.

---

# DTO RULES

One DTO per file.

Split by direction into subfolders:

dto/request/   (create / update / query)

dto/response/  (response DTOs)

---

Allowed

dto/request/create-student.dto.ts

dto/request/update-student.dto.ts   (UpdateDto = PartialType of the Create DTO,
unless a field set is intentionally restricted, e.g. immutable code/FK excluded)

dto/request/student-query.dto.ts

dto/response/student-response.dto.ts

---

Forbidden

20 DTOs in one file

A response DTO living under dto/request/ (or vice versa)

---

## Read only the fields the caller shows

A `Profile` holds sixteen columns, most of them identifying. Reading the whole
record to draw a name carries all of it out of the database on every row of
every list, and silently adds any column defined later to every screen at once.

**Every read that reaches a profile uses one of three shapes** from
`shared/domain/prisma-selects.ts`. `profile: true`, or an inline profile select,
is a defect.

| Situation | Shape |
|---|---|
| A person appears as a label | `PROFILE_NAME_SELECT` |
| A person's picture is drawn | `PROFILE_DISPLAY_SELECT` |
| Student, teacher or enrolment list | `PROFILE_ROSTER_SELECT` |
| A spreadsheet export or the profile screen | Its own explicit select, at the call site, with a comment |

Each shape carries `satisfies Prisma.ProfileDefaultArgs`, so a field that does
not exist fails to compile. Widening a shape reaches every caller — add the
field at the call site instead.

**The domain row must be as narrow as the query.** `ProfileNameRef`,
`ProfileDisplayRef` and `ProfileRosterRef` mirror the three shapes;
`UserRef<TProfile>` and `PersonRef<TProfile>` take the projection as a
parameter, defaulting to the name.

> **A row that types its fields as optional cannot catch a narrowing.** This has
> already cost a bug: the student list narrowed to three fields, the spreadsheet
> export shared its query, and because `StudentWithDetails` typed birth place,
> birth date, email and phone as optional, it compiled and would have written
> four empty columns. A read whose fields must be present types them as
> **required** — see `StudentExportWithDetails`.

### Reaching a person *through their account*

Narrowing the profile is only half of it. Prisma's `include` means "these
relations **as well as** every scalar column I own", so this reads like a
narrowed query and is not one:

```ts
user: { include: { profile: PROFILE_NAME_SELECT } } // every column of User
```

`User` owns `passwordHash`. Combined with a use case that returns what the
repository handed it, that shape answered a student's own profile request with
their homeroom teacher's bcrypt hash. Neither half was wrong alone.

So a user relation is reached with `USER_REF_SELECT`, `USER_DISPLAY_SELECT` or
`USER_ROSTER_SELECT` — id, identifier, isActive, and the matching profile.
`user: true` and `user: { include: … }` are both defects, and
`no-user-scalar-overfetch.spec.ts` fails the build on either. It strips comments
first, so a file may name the shape it warns against.

The same reasoning applies to any model holding a secret: prefer `select` over
`include` at the point where one is reached.

Two more habits the same rule implies:

- **A list and a detail read differently.** Aliasing them (`LIST = DETAIL`) means
  the list page fetches whatever the detail screen needs.
- **A bare `true` on a relation pulls every column.** Select what the domain row
  declares. On a to-one relation Prisma takes no `where`, so soft-deleted rows
  cannot be filtered in the include — select `deletedAt` and let the caller check.

---

## Reading your own record: a separate permission, a separate route

A read that answers about the person asking is not a narrowed version of the
read that answers about everyone. It is a different endpoint with a different
permission, and the difference is what makes a role's grants legible: you can
tell what a role may see by reading its permissions, without opening a use case
to look for a conditional.

```
report-cards.read        GET /rapors        every student's
report-cards.read-own    GET /rapors/me     the caller's own
```

Four rules, each of which has already been got wrong here at least once.

**The caller's identity is applied after their query, never before.**

```ts
// right — a supplied studentId cannot win
return this.getReportCards.execute(query, { studentId: resolved });

// wrong — `?studentId=<someone else>` overrides the caller
return this.getReportCards.execute({ studentId: resolved, ...query });
```

The wrong version returns a correctly formatted list of report cards belonging
to the wrong person, which is indistinguishable on screen from the right one.

**Where the scope lands matters as much as when.** If a where-builder rewrites
a relation object wholesale for some other filter, a scope merged into that
object is erased by a query parameter. Put it in `AND`, which nothing the caller
sends can reach — `prisma-attendance.where.ts` carries the note.

**No student record means an empty result, returned explicitly.** A null that
falls through into an unfiltered read widens it to everyone, silently.

**A cohort-shaped read is refused, not narrowed.** A recap or a trend describes
a group; answering one to a self-service caller hands them a summary of other
people without disclosing a single row. Their own figures come from their own
rows instead.

Two mechanics: declare `.../me` **before** its `:id` sibling or Nest parses `me`
as a uuid, and never put the subject on the DTO — a field on a DTO is a field a
caller can send. It is a use-case argument.

If a route does not use the caller, it must not ask for them. A parameter named
`_user` records a decision to ignore identity, and a reader skims past a
decision; `no-ignored-caller.spec.ts` enforces the absence.

---

## Language: the backend is written in English

Exception and validation messages, Swagger summaries and descriptions, log
lines, field and class names, and comments are all English. Indonesian is the
frontend's job: it owns presentation, and it can turn an English message or
code into whatever the screen should say. A field is `passingScore`, never
`kkm`.

Exempt, on one principle — text that leaves the system as the final thing a
person reads, with nothing in between to translate it:

- **Rendered documents.** `report-card-pdf.template.ts` prints the rapor a
  parent receives. The student import/export column headers are the contract
  with a spreadsheet the TU already fills in; renaming them breaks their file.
- **Messages delivered to a person.** Password-reset email bodies, and the
  admission notification titles and bodies, which are stored and shown verbatim
  to the applicant.
- **Seed data** under `prisma/seeds/` — subject names, positions and holidays
  are real school data, not interface text.

Anything else reading as Indonesian under `src/` is a bug.

---

## `*Dto` vs `*Input` — two boundaries, not two styles

Both exist on purpose. They are not interchangeable and neither replaces
the other.

| | `*Dto` | `*Input` |
|---|---|---|
| Boundary | HTTP (presentation) | domain port (repository) |
| Form | class + class-validator + Swagger | plain interface, no decorators |
| Lives in | `dto/request/`, `dto/response/` | `domain/interfaces/<x>-repository.interface.ts` |
| Answers | what the wire accepts | what persistence needs |

The flow is layered:

```
HTTP body
  -> CreateSubjectDto              dto/request/        (validated here)
  -> use case                      use-cases/
  -> CreateSubjectRepositoryInput  domain/interfaces/  (framework-free)
  -> Prisma
```

If a repository took the DTO, class-validator and Swagger — both HTTP
concerns — would sit behind a port that must stay transport-agnostic, and
the repository could no longer be driven from a CLI, a scheduled job, or
a test without dragging the HTTP layer in. `shared/domain/interfaces/
repository.interface.ts` states the same reason for `PaginationQueryInput`.

Naming: `*QueryInput` for reads, `*RepositoryInput` for writes,
`<Operation>Input` for a specific operation.

---

## Map the DTO to the Input explicitly

Forbidden — forwarding the whole DTO:

```ts
await this.subjectRepository.create(dto);
```

TypeScript is structural, so this compiles whenever the shapes happen to
line up. The cost is that a field added to the DTO later reaches
persistence with nobody deciding it should. That is precisely how
`teacherIds` entered the subject write path and began assigning one
teacher to every classroom.

Required — field by field:

```ts
await this.subjectRepository.create({
  code: dto.code,
  name: dto.name,
});
```

Note this is a review-time rule, not a test-enforced one: an existing spec
asserting `toHaveBeenCalledWith(dto)` stays green either way, because the
mapped object is structurally equal to the DTO.

---

# VALIDATION RULES

Use:

class-validator

class-transformer

---

Validation only inside DTO.

---

Forbidden

if (!name)

inside a use case

---

# NO INLINE TYPES

Forbidden

interface StudentData

inside a use-case or controller

---

Use

types/ · domain/entities/ · domain/interfaces/

A repository's input and result shapes belong next to the port they serve, in
`domain/interfaces/<x>-repository.interface.ts`.

---

Also forbidden: repeating an object literal in a signature.

Bad — this exact shape was copy-pasted across 27 files

async findAll(...): Promise<{
  data: StudentWithDetails[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}>

Good

async findAll(...): Promise<PaginatedResponse<StudentWithDetails>>

---

Narrow projections in a signature are FINE and should stay inline:

Promise<{ id: string } | null>      an id-only lookup

Promise<{ count: number }>          a Prisma BatchPayload

Naming those adds a hop without adding meaning. The rule targets duplicated or
domain-bearing shapes, not every brace.

---

# NO INLINE CONSTANTS

Forbidden

status = "ACTIVE"

role = "ADMIN"

inside a use case

---

Use

constants/

student.constants.ts

role.constants.ts

---

# COMMENT RULES

Normal state: zero comments in a file. A well-named function, parameter and
class reads as a sentence; a comment above one only repeats it.

A comment is added ONLY when its absence would let a future edit
reintroduce a concrete failure — a workaround for a specific external bug
(tied to an issue/ticket), or a constraint enforced nowhere else (no test,
no type) that silently breaks if removed. It exists for the next editor to
avoid that failure, not to narrate today's decision to today's reviewer —
the diff and its description are where that belongs.

Forbidden — remove on sight

Restating what the next line does

Explaining why a file/class/method is shaped the way it is

Narrating the rationale behind a design choice

Describing what a class "represents" or "is for"

---

When in doubt: no comment.

---

# SCOPING RULES

The deployment is single-school. There is no `organizationId`, and
`schoolUnitId` exists only on `Address` and a couple of platform models — the
academic domain does not filter by it anywhere. Do not add a tenant filter that
the schema cannot honour.

What every academic query MUST scope by instead:

---

1. Soft delete

deletedAt: null

Non-negotiable. Nearly every academic table is soft-deleted, so a query without
it silently returns removed students, classes, and scores.

---

2. Period, wherever the row belongs to one

semesterId — enrolments, teaching assignments, supervisors

academicYearId — classrooms, curricula, semesters

When the caller gives neither, resolve the ACTIVE semester rather than reading
across every year (see `shared/utils/active-academic-year.helper.ts`).

---

Forbidden

findMany() with no deletedAt filter

An unbounded list read that ignores the active period

---

A second school is a second deployment of these repositories against its own
database — not a tenant column added here. Nothing in this section changes to
serve one.

---

# AUTHORIZATION RULES

Never check role names.

Forbidden

user.role === "ADMIN"

---

Good

@RequirePermissions('students.create')

Codes are `<module>.<action>`, and the module segment is PLURAL — `students`,
`schedules`, `report-cards`. The full list lives in
`platform/access-control/permission/constants/permission-codes.constants.ts`.

There is no `permissionService.has(...)` helper; the guard below is the only
enforcement point.

---

# AUTHORIZATION ENFORCEMENT

Authorization is permission-based, enforced at the controller via the
`@RequirePermissions(...)` decorator + guard — not per-module policy files.

Example

@RequirePermissions('students.create')

@RequirePermissions('students.read')

@RequirePermissions('students.update')

@RequirePermissions('students.delete')

---

Permission strings, roles, and their design live in `IAM.md`.

---

# MAPPER RULES

Never let a raw Prisma row reach the client untyped.

In practice the shape is pinned at the query, not by a mapper class: each
repository declares its `include` once in a `*.includes.ts` file and derives the
return type from it.

Example (`prisma-student.includes.ts`)

export const STUDENT_INCLUDE = { ... } satisfies Prisma.StudentInclude

export type StudentWithDetails =
  Prisma.StudentGetPayload<{ include: typeof STUDENT_INCLUDE }>

---

Reach for a dedicated mapper under `infrastructure/mappers/` only when the
outward shape genuinely differs from the row — renamed or computed fields,
flattened relations. Today only `student` and `semester` need one.

---

The controller's declared return type is the real contract. Every list endpoint
returns `PaginatedResponse<T>`; every detail endpoint returns an explicit
entity or response DTO. Never `any`, never an inline object literal.

---

# ENTITY RULES

Entity represents domain.

Not database.

In this repo's migrated modules, an entity is an `interface` by default — a plain shape.
Use a class only when the aggregate can enforce a rule entirely on its own,
without a repository lookup; `academic-setting` is the one example. Rules that
stand alone but need no class go in `domain/policies/`, never in the entity
file. See `ARCHITECTURE.md`.

---

Example

StudentEntity

TeacherEntity

AssessmentEntity

---

# SHARED RULES

shared contains only:

helpers

types

enums

constants

utils

---

Shared must not contain:

business logic

---

# EVENT RULES

This codebase does NOT use domain events. `@nestjs/event-emitter` is not a
dependency, and nothing emits or listens.

Default: a direct, awaited call into the other module's exported use-case.

---

Why (ADR-0002)

`student.created` used to be emitted after creating a student with a classroom,
with `EnrollmentModule` listening. `EventEmitter2.emit()` is never awaited, so a
failed enrolment was only logged — the API had already answered "created". It
was replaced by an awaited call to `EnsureStudentEnrollmentUseCase`, and the
event + listener were deleted.

---

Rule of thumb

ONE business rule → ONE must-succeed consequence
  = direct awaited call, so the error reaches the caller

ONE fact → MANY independent subscribers
  = a genuine event; reintroduce the emitter when that case actually appears

---

Loose coupling is not the goal. Correct data is. A module boundary that hides
failures is worse than a compile-time dependency.

No `events/` folder and no `*.events.ts` file remains anywhere in `src/`. If one
reappears, it should come with an emitter, a subscriber, and the dependency —
not on its own.

---

# RESPONSE RULES

Controllers return plain payloads. The global `ResponseInterceptor`
(`core/interceptors/response.interceptor.ts`) wraps every one of them — never
build the envelope by hand.

Actual shape

{
statusCode: 200,
message: "Success",
data: {},
meta?: {}
}

There is no `success` field. The status code carries that.

---

Pagination

Repositories return the flat shape:

{ data: [], total, page, limit }

The interceptor detects it and folds it into `data` + `meta`. A use-case that
computes `totalPages` returns `PaginatedResponse<T>` instead, and the
interceptor passes it through untouched.

---

Use the shared types — do not re-declare the envelope inline:

shared/domain/interfaces/repository.interface.ts

  PaginatedResult<T>    repository side  { data, total, page, limit }

  PaginatedResponse<T>  HTTP side        { data, meta }

  PaginationMeta                         { page, limit, total, totalPages }

Response DTOs must import `PaginationMeta` with `import type` — it sits under a
Swagger decorator, and `isolatedModules` + `emitDecoratorMetadata` reject a
value import there.

---

StreamableFile responses (Excel export, report-card PDF) bypass the envelope.

---

# FILE SIZE RULES

The budget counts CODE. Import blocks and `@Api*` Swagger decorators do not
count against it — they are documentation, and a well-documented controller
routinely reaches ~190 physical lines while every handler body is one line.

Use case / service     max 300 lines

Repository class       max 200 lines

Any other file         max 300 lines

Controller             max 150 lines of code
                       (physical length is dominated by Swagger; judge the
                        handler bodies, not `wc -l`)

---

# SPLITTING A REPOSITORY

When a Prisma repository outgrows 200 lines, do NOT split the class or the
interface it implements. Move the details out into sibling files and leave the
class as a flat map of contract method → one call:

*.includes.ts    Prisma include/select objects + the derived payload type

*.where.ts       where-clause builders shared by list and export queries

*.queries.ts     multi-step or grouped reads

*.writer.ts      multi-table writes taking a `Prisma.TransactionClient`

*.steps.ts       one function per stage of a long transaction
                 (see prisma-rollover.steps.ts, prisma-promotion.steps.ts)

---

If it still does not fit, the contract itself is too fat — that is an Interface
Segregation problem, not a formatting one.

`IScheduleRepository` had 18 methods, six of which reached outside the Schedule
aggregate (resolve a classroom, find the active semester, create a teaching
assignment). Those moved to `IScheduleLookupRepository`, and both adapters came
in comfortably under the limit. Splitting the port is the correct fix; padding
the file is not.

---

# IMPORT RULES

Backend is NodeNext ESM. No path aliases — use relative imports, and every
relative import MUST carry the `.js` extension (source is `.ts`).

Allowed

import { AppModule } from './app.module.js'

import { StudentRepository } from '../repositories/student.repository.js'

---

# BARREL & MODULE IMPORT RULES

A feature's `index.ts` barrel = its PUBLIC API (DTOs, tokens, use-cases, guards)
for outside consumers.

NestJS Module classes:
import via `x.module.js` DIRECTLY — never through a barrel.

Cross-module DTO → DTO:
import the DTO FILE directly — never through the other feature's barrel.

Why:
a feature barrel also re-exports runtime-heavy symbols (its Module, use-cases,
repositories). A lightweight DTO importing that barrel drags the whole graph in
and closes an ESM import cycle, crashing boot with:

"Nest cannot create the <X>Module instance.
 The module at index [0] of the imports array is undefined."

(Official NestJS: barrel files must be omitted when importing module or provider
classes — https://docs.nestjs.com/faq/common-errors)

Bad

// role-response.dto.ts
import { PermissionResponseDto } from '../../../permissions/index.js'

Good

// role-response.dto.ts
import { PermissionResponseDto }
  from '../../../permissions/dto/response/permission-response.dto.js'

For a genuine mutual module/provider dependency, use forwardRef() on both sides.

---

# ERROR HANDLING

Throw NestJS HTTP exceptions from the use-case layer. They carry the right
status code and are picked up by the global `HttpExceptionFilter`.

Default vocabulary

NotFoundException

ConflictException

BadRequestException

ForbiddenException

---

Forbidden

throw new Error()

A bare `Error` becomes an opaque 500. If a failure really is an unexpected
invariant violation, say so with `InternalServerErrorException` (or a custom
exception extending it) so the intent is on the page.

---

Custom exceptions are OPTIONAL, and always extend a built-in.

Add one when a rule is thrown from several call sites and deserves a domain
name — not for every throw. `academic/student/domain/exceptions/` is the
reference implementation:

StudentNotFoundException            extends NotFoundException

StudentNisAlreadyExistsException    extends ConflictException

StudentCreationFailedException      extends InternalServerErrorException

---

Because they extend the built-ins, the HTTP contract does not change and tests
asserting `rejects.toThrow(NotFoundException)` keep passing. That is the point:
a custom exception adds a NAME, never new transport behaviour.

One file per exception, under the owning module's `domain/exceptions/`, plus an
`index.ts` barrel (exceptions only — no Module, no use-case).

---

# TRANSACTION RULES

Use a Prisma transaction when several writes inside ONE module must land
together:

Student promotion / semester rollover  (classrooms → enrolments → schedules)

Account provisioning  (User + Profile + Student/Teacher)

Bulk score import, bulk attendance

Soft-deleting a student  (student row + its user account)

---

Do NOT wrap a sequence that crosses a module boundary (ADR-0003).

Student → Enrollment writes are deliberately left untransacted:

- Prisma's own guidance is to keep interactive transactions short and free of
  branching; `EnsureStudentEnrollmentUseCase` alone is a find → decide →
  create-or-transfer chain.
- They are separate aggregates in separate modules. DDD asks for immediate
  consistency inside an aggregate, eventual consistency between them.
- Every step is idempotent, and the failure already surfaces in the bulk-import
  row's `errors[]` rather than being swallowed.

Reach for a transaction because the writes are same-module and NOT safe to
retry — not because "multiple writes" pattern-matches a database habit.

---

# AUDIT RULES

STATUS: infrastructure only. NOT yet wired into `academic/`.

What exists

`AuditLog` model (`prisma/iam.prisma`) — actor, action, resource, resourceId,
metadata, ipAddress, userAgent

`platform/audit-log/` — repository, `CreateAuditLogUseCase`, and a read
endpoint behind `audit-logs.read`

What does not exist

Zero calls from `academic/`. No student create, grade change, or report-card
publish currently writes an audit row.

---

Do not describe auditing as if it were enforced. When it is wired up, the
target list is:

Create · Update · Delete · Publish · Approve

with report-card publish and grade changes first — those are the records a
school is actually asked to account for.

---

# MODULE DEPENDENCY RULES

Two boundaries look similar in an import statement and are not the same
thing. Know which one you're crossing before reaching for a fix.

## In-process: the 25 academic submodules, and the platform slices, inside this repo

`student`, `teacher`, `grade`, `schedule` and the rest all still run in one
Node process. Nothing here changed:

Platform (narrowed slices in this repo)

may be used by every academic submodule (supplier)

---

Academic submodules

may consume platform, and may consume each other's public API, but must not
reach into each other's internals

---

Cross-module access only through a module's public API (its barrel /
exported tokens / exported use-case — see EVENT RULES) — never deep-import
another module's internals. This is a direct, awaited, in-process call; no
network is involved, and a failure propagates as a normal thrown exception.

## Cross-service: identity-service, admission-service, presence-service, inventory-service

These are separate deployments. Their TypeScript is not in this repo, so
nothing here can import it — the equivalent mistake here is one of the three
couplings CLAUDE.md documents (reading `auth_sessions`/`users` off the shared
database, writing an account inside `AccountProvisioningService`'s
transaction, joining `profiles` directly), all of which exist only because
academic-service and identity-service still share one `DATABASE_URL`. That is a
temporary, deliberately-tracked exception, not a pattern to extend — see
CROSS-SERVICE COMMUNICATION below for what replaces each one.

---

# CROSS-SERVICE COMMUNICATION

STATUS: aspirational. Nothing in this repo makes an HTTP call to another
service today — there is no `@nestjs/axios`, no `fetch`/`axios` call to
another service anywhere in `src/`. `AccountProvisioningService` still writes
`User`/`Profile` rows directly, in the same Prisma transaction as the
academic write, because the database is still shared. This section describes
the target shape for the day each of CLAUDE.md's three couplings closes —
write code that matches this once that day comes, don't build it early
against a service boundary that isn't real yet.

## What changes, concretely

| Coupling (CLAUDE.md) | Today | Target |
|---|---|---|
| Session/permission read | `JwtStrategy` → `ValidateTokenUseCase` reads `auth_sessions` + `users` off the shared DB | Unchanged for now — see CLAUDE.md's own note: revocation must stay immediate, so this is the one coupling that may not move to a token-only check |
| Provisioning write | `AccountProvisioningService` writes the account inside the same transaction as the academic record | A typed HTTP client call to identity-service's `POST /users`, with the academic write and the account write no longer atomic |
| Profile join | `profile.name` read through a Prisma relation | A batch lookup (`POST /profiles/batch` or similar) against identity-service, cached — rosters are the hot path, per CLAUDE.md |

## Rules for when a cross-service call is added

**A cross-service call can fail independently of the local write it sits
next to.** The transaction that used to make "create the student" and
"create the account" atomic is gone once the second half is an HTTP call.
Decide explicitly what happens on partial failure — an outbox, a
compensating delete, or (per `enrol-existing-account.use-case.spec.ts`'s
precedent) an idempotent retry — before merging. "It probably won't fail" is
not a decision.

**The client is typed and lives in `infrastructure/`, never in a use-case.**
Same inversion as a Prisma repository: define a port in
`domain/interfaces/` (e.g. `IIdentityProvisioningPort`), implement it in
`infrastructure/http/` against the other service's OpenAPI contract, and
inject the port. A use-case that calls `fetch` or `HttpService` directly is
the cross-service equivalent of a use-case that calls Prisma directly, and is
forbidden for the same reason: it cannot be tested without the other service
running.

**A network call is not a domain event.** EVENT RULES' "direct, awaited
call" default was written for in-process calls and still applies to the
*shape* of the call (await it, let its failure surface) — but timeouts and
retries are now the caller's problem in a way an in-process call never was.
Set an explicit timeout; do not let a hung identity-service call hang the request
that depends on it forever.

**Never re-implement the other service's business rule locally.** If a
uniqueness check, a status transition, or a validation rule lives in
identity-service, call it — don't duplicate its logic here to avoid the network
hop. Two implementations of the same rule drift, and the coupling this
avoids is smaller than the bug it causes.

---

# FORBIDDEN

Business logic in controller

Prisma in controller

Prisma in use case

Role checking by string

Cross-domain direct access

Global god service/use case

5000 line use case

Any type

Magic strings

Magic numbers

Direct entity exposure

Unscoped query (missing `deletedAt` or active-period filter — see SCOPING
RULES; this deployment is single-school and has no tenant column to check)

---

# SUCCESS CRITERIA

A feature can be removed without breaking another feature.

A domain can evolve independently.

A future microservice extraction is possible.

Every query is scoped — soft delete, and the active period. (This deployment
is single-school; a second school is a second deployment, not a tenant column.)

Every action is permission controlled.

The codebase remains maintainable at 100+ modules and 500+ endpoints.
