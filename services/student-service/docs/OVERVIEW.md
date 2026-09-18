# student-service

SIAKAD 241 — student lifecycle: students, parents, enrolment, graduation,
semester promotion, semester rollover. NestJS + Prisma + PostgreSQL, NodeNext
ESM — relative imports carry the `.js` extension even though the source is
`.ts`.

Extracted from `academic-service`'s `student`, `parent`, `enrollment`,
`graduation`, `semester-promotion`, and `semester-rollover` modules on
2026-09-03, by copying — the same Strangler Fig move academic-service itself
was extracted with. `academic-service` was not modified to
remove these modules as part of this first pass; that removal, and the small
local read-ports it needs in their place, is a following step.

## What this service owns

The "Student Lifecycle" bounded context: a student's whole journey from
enrolment to graduation, plus their parents and the two process managers
(promotion, rollover) that move a cohort between semesters. Modules sit
directly under `src/`, not nested inside an `academic/` folder — that nesting
was an artifact of academic-service, and this service is not that.

`semester-rollover` **left on 2026-09-09.** Four of the five tables it wrote
are academic-service's, so it runs there in one local transaction and then
calls `POST /student-enrollments/rollover` here for the enrolments. That second
step is deliberately outside the transaction: if it fails, next semester's
classrooms exist and the enrolments do not, which the operator can see and
repairs by running it again — the endpoint skips a student already enrolled in
the target semester.

## What it borrows

Four platform pieces `academic-service` borrows too (`auth`,
`access-control/permission`, `user`, `profile-lookup`), copied wholesale.

**The five read-only slices are gone as of 2026-09-09** — `classroom`, `grade`,
`semester`, `academic-year` and `teaching-assignment` each carried a `domain/`
and a `infrastructure/persistence/prisma/` folder reading academic-service's
tables directly. Everything that needed them now asks academic-service over
HTTP through `platform/academic-lookup`, and the folders were deleted with
their Prisma models.

| Wanted | Now |
|---|---|
| Classroom by id, code, or academic year | `GET /classrooms/{:id/detail,by-code/:code,by-academic-year/:id}`, `POST /classrooms/by-ids` |
| Capacity, for the enrolment guard | `capacity` on the classroom detail |
| Grade by level or id | `GET /grades/by-level/:level`, `POST /grades/by-ids` |
| The active term, or a year's terms | `GET /semesters/{active,by-academic-year/:id}`, `POST /semesters/by-ids` |
| Academic year by id | `GET /academic-years/{active,:id/summary}`, `POST /academic-years/by-ids` |
| A classroom's officers and subjects | `GET /classrooms/:id/context` |
| Occupation, for a parent | `GET /occupations/:id/summary`, `POST /occupations/by-ids` |

The batch endpoints exist because the row-labelling reads are lists: an
enrolment page spans whichever classrooms and terms its rows happen to name, so
it cannot be answered by a per-year endpoint without fetching a year to find
three classrooms. Each list read costs one call per entity type per page, not
one per row.

`platform/academic-lookup` fails closed the same way `platform/identity` does:
academic-service being down is a 503, never an empty list. A row whose
classroom or term is missing from the response keeps its ids and loses only the
label — the enrolment is this service's record and stays listed whatever
academic-service knows about it.

## A person's address is not here

`Address` was deleted on 2026-09-11. It had two real writers —
`createStudentWithRelations` and `enrolExistingAccount` — and both now hand the
address to identity-service, which owns the person: the first through
`POST /accounts`, where the profile and its address are written in one
transaction, and the second through `POST /addresses`, because that account
already exists.

**No parent address table was created to replace it, deliberately.** `Parent`
has no `userId` — a parent is not a platform user, so identity-service does not
know that person. When parents get accounts, `Parent` stops being a standalone
row and becomes a profile with a role, and the address follows everyone else's.
Building a table now would only mean moving it then.

## Database — its own

`prisma/` declares **six models**, all of them this service's: `Student`,
`Parent`, `StudentParent`, `StudentEnrollment`, `StudentGraduation`,
`StudentGraduationHold`. It used to declare 26, including eleven of
academic-service's and one of hr-service's, which is what the deleted slices
read. `Education` went to academic-service on 2026-09-09 and `Address` to
identity-service on 2026-09-11.

Nothing here reads another service's tables through Prisma any more — no
`prisma.x` call, no relation include, no relation filter. `StudentEnrollment`
keeps `classroomId` and `semesterId` as plain columns with their indexes and
no foreign key, because the rows they point at live in another database.

## Cross-service reads still pending

None inbound. `student`'s `IStudentIdentityReadPort` and `enrollment`'s read
methods are served to academic-service and assessment-service over HTTP by
`student-internal.controller.ts` and `enrollment-internal.controller.ts`.

## Commands

```bash
pnpm install
pnpm prisma:generate          # required before anything else
pnpm dev
pnpm validate                 # format:check + lint + typecheck + lint:strict + test + build
```
