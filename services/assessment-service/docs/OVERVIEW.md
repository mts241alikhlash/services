# assessment-service

SIAKAD 241 — teaching evaluation: assessment items and weights, student
scores, attendance, report cards, and the combined teacher/student dashboard.
NestJS + Prisma + PostgreSQL, NodeNext ESM — relative imports carry the `.js`
extension even though the source is `.ts`.

Extracted from `academic-service`'s `assessment`, `attendance`, `report-card`,
and `my-dashboard` modules on 2026-09-03, by copying — the same Strangler Fig
move academic-service itself was extracted with. Unlike the
`student-service`/`hr-service` extractions earlier the same day,
academic-service **was** updated in the same pass to remove these four
modules and the two borrowed slices (`platform/school-unit-identity`,
`presence/daily-record`) that had no caller left once they were gone —
`pnpm run validate` passes clean on both sides as of this extraction, with no
follow-up removal step pending.

## What this service owns

The teaching-evaluation half of what `academic-service` used to call
"Teaching & Timetable": assessment items and weights, student scores,
attendance records, report cards (including the PDF export), and the
dashboard that combines a teacher's or student's own slice of all of the
above. Modules sit directly under `src/`, matching academic-service's own
post-flatten layout — not nested inside an `academic/` folder.

One real defect surfaced and fixed on the way out, not ported:
`assessment.module.ts` imported `SemesterModule` and listed it in `imports:
[]`, but no use case in the module ever injected `ISemesterRepository` —
`PrismaGradingScopeReadPort` reads `assessmentItem`/`studentEnrollment`
directly. The import was dead in academic-service too; it is simply gone here
rather than carried over.

## What it borrows

Five platform pieces, copied wholesale:

| Borrowed, wholesale | Why |
|---|---|
| `platform/auth` | Session liveness, `JwtAuthGuard` |
| `platform/access-control/permission` | `PermissionGuard`, the permission catalogue |
| `platform/teacher-identity` | "which teacher record does this signed-in user own" — every `/me` route |
| `platform/student-identity` | "which student record does this signed-in user own" — every `/me` route |
| `platform/school-unit-identity` | Report card PDF header (school name, address, contact) |

**The five narrowed read-only slices are gone as of 2026-09-09** —
`academic-setting`, `curriculum-subject`, `enrollment`, `teaching-assignment`
and `presence/daily-record` each carried a `domain/` and an
`infrastructure/persistence/prisma/` folder reading another service's tables
directly. Everything they answered now arrives over HTTP:

| Wanted | Now |
|---|---|
| The teaching assignment an assessment item hangs off | `POST /teaching-assignments/by-ids` → academic |
| A teacher's assignments for a term | `GET /teaching-assignments/by-teacher` |
| May this teacher grade this item? | `GET /teaching-assignments/:id/exists?employeeId=` |
| Is this teacher the homeroom teacher? | `GET /classrooms/supervises` |
| Which classes is this teacher homeroom of? | `GET /classrooms/supervised` |
| The enrolment a score, mark or card belongs to | `POST /student-enrollments/by-ids` → student |
| Which enrolments match this class / term / student? | `POST /student-enrollments/search` |
| How many students are in these classes? | `POST /student-enrollments/count-by-classrooms` |
| A day of a timetable | `GET /schedules/lessons` |
| The period an attendance record was taken in | `POST /schedules/by-ids` |
| The gate record behind a class register | `POST /daily-presences/by-users` → presence |
| Passing scores, the settings, the term, the classroom | as before |

Every one of them is batched by distinct id, so a page of thirty scores costs
two calls rather than sixty, and every lookup fails closed: an unreachable
owner is a 503, never an empty list. What can legitimately come back missing is
a single id the owner no longer has, and that resolves to `undefined` — the
record keeps its ids and loses only its labels.

`GET /dashboards/me` is **not** dead code, and an earlier note here that
suggested deleting `my-dashboard` was wrong: `assessment-web` calls it. Eight
of its eleven reads were foreign; they are HTTP now.

## Database — its own

`prisma/` declares **six models**, all of them this service's:
`AssessmentWeight`, `AssessmentItem`, `StudentScore`, `Attendance`,
`ReportCard`, `ReportCardSubject`. It used to declare 25.

Nothing here reads another service's tables through Prisma any more — no
`prisma.x` call, no relation include, no relation filter, no `orderBy` through
a relation. `student_scores.enrollment_id`, `attendances.schedule_id` and
`assessment_items.teaching_assignment_id` keep their columns and indexes and
have no foreign key, because the rows they point at live in another database.

`Day` and `PresenceDayStatus` used to be imported from `@prisma/client`. They
are declared locally now (`shared/domain/enums/day.enum.ts`,
`platform/presence-lookup/presence-lookup.port.ts`) because the tables that
defined them belong to other services — an enum that crosses a service
boundary is part of the contract, not a generated type.

## Commands

```bash
pnpm install
pnpm prisma:generate          # required before anything else
pnpm dev
pnpm validate                 # format:check + lint + typecheck + lint:strict + test + build
```
