# integration — what payroll needs from another service

Payroll moved here from `presence-service` on 2026-09-10, when presence was
kept separate because **students** need gate attendance too and student
scans must not share a database with staff salaries. The seams inverted in
the move: the roster became local, and the two presence reads became HTTP.

| Port | One method | Answered by |
|---|---|---|
| `IPayrollRosterPort` | `listActiveEmployees()` | this service, in process |
| `IDailyPresenceReadPort` | `summariseMonth()` | presence-service |
| `IAttendancePeriodReadPort` | `isClosed()` | presence-service |

## The roster stopped being a call

`LocalPayrollRosterAdapter` asks `ITeacherIdentityReadPort.listRosterUserIds()`
— the staff module in this same service — and then
`IProfileLookupPort.findByUserIds()` for the name and the active flag. The
employee record and the payslip now live in one database, so the seam that
`HttpPayrollRosterAdapter` crossed is gone; that adapter and its spec are
deleted.

It is still a port, and the provider is still swapped in
`integration.module.ts`. Nothing in `payroll/run` moved.

## The two presence reads became calls

Both are HTTP now, and both ask for an answer presence-service already
computes:

| Port | Endpoint |
|---|---|
| `summariseMonth()` | `POST /daily-presences/monthly-summary` |
| `isClosed()` | `GET /presence/periods/:year/:month/closed` |

**Neither adapter carries a copy of presence's arithmetic**, and that is the
one thing to hold onto here. The 2026-08-29 payroll split shipped a verbatim
copy of `summariseMonth` because an earlier rewrite had got four things wrong
— `LATE` counting as a present day, `lateCount` keying on status rather than
minutes, `lateMinutes` accumulating unconditionally, and the month bounded
`lte` rather than `lt`. None would have failed a build; all four would have
produced payslips that were quietly, slightly wrong.

`POST /daily-presences/monthly-summary` is that arithmetic, served rather than
copied — assessment-service has consumed it since 2026-09-09.
`GET /presence/periods/:year/:month/closed` was added for this move: payroll
refuses to run against an open month, because a scan recorded afterwards would
change a payslip already issued.

Both fail closed. A presence-service that is down does not produce a payslip
computed from nothing; it produces a 503.

## The independence guard is whole again, in one repository

`src/payroll/payroll-roster-independence.spec.ts` (FR-055, FR-056) refuses any
read of `position`, `positionCategory`, `teacherPosition` or `employmentType`
across `src/payroll`, and refuses a comparison against any seeded code. Its
positive half follows the query into `local-payroll-roster.adapter.ts`, where
the roster filter lives: it may narrow by "active" and by nothing else.

`src/teacher/.../teacher-identity-read.port.spec.ts` guards the other side —
that the roster query itself applies no position. Both sweeps are in **this**
repository now, so neither half can be deleted without the other turning red.
While the roster was an HTTP call the two lived in different repositories that
could not see each other, and deleting either one silently halved the rule.
