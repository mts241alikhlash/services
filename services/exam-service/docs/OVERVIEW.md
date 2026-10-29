# exam-service

241 Academic — computer-based exams (CBT). NestJS + Prisma + PostgreSQL,
NodeNext ESM: relative imports carry the `.js` extension even though the
source is `.ts`. Port 4100, database `exam_service`.

Designed in `platform-infra/docs/superpowers/specs/2026-10-24-exam-cbt-design.md`
and `2026-10-28-exam-phase2-design.md` (gitignored, on the owner's laptop).
Built in phases: phase 1 is the question bank, phase 2 the sitting of the exam
in three stages (stage 1, this release: packages, schedules and the access
code; stage 2: sessions, answers, automatic scoring; stage 3: teacher grading
and publishing scores to assessment-service), phase 3 Safe Exam Browser, AI
import and analysis.

## What this service owns

- **Questions** (`src/question/`): a question belongs to a subject and a grade
  level, has a type (multiple choice, multiple response, true/false, short
  answer, essay), a status (draft, submitted, approved, returned) and
  immutable versions. Editing an approved question writes a new version that
  needs approval again; the approved version stays usable meanwhile.
- **Reviews**: the history of submit, approve and return with notes.
- **Images** (`src/exam-file/`): question images in object storage under
  `exam/questions/<fileId>`.
- **Import** (`src/question-import/`): Excel and Word templates; every
  imported question is a draft.
- **Packages** (`src/exam-package/`): a fixed set of approved questions for one
  subject and grade. Each item pins the approved version number it had when it
  was added, so editing a question later never changes a package. A package is
  a draft until it is scheduled, then locked; a locked package can only be
  copied.
- **Schedules** (`src/exam-schedule/`): one package for one classroom inside a
  time window with a duration, for the active semester at creation. The access
  code students enter is derived with HMAC from the schedule id and
  `tokenRotation` (secret `EXAM_ACCESS_CODE_SECRET`) and is never stored; it
  appears only in the `access-code` endpoints.
- **Package candidates** (`GET /exam-packages/candidates`, `exam-packages.create`):
  the approved questions of one subject and grade, for the people who build
  packages. It ignores the teacher scope of the question bank on purpose, so
  the deputy for curriculum and the admin can pick any teacher's question.

- **Sessions** (`src/exam-session/`): a student starts a session with the
  access code (`POST /me/exams/:scheduleId/sessions`). The server owns the
  clock: `deadline = min(startedAt + duration, schedule end)` and the session
  closes at `deadline + 10 minutes` (answers in that grace are flagged
  `receivedAfterDeadline`). The paper is the package's pinned questions with
  question and choice order shuffled by a per-session seed (no answer keys
  are ever sent). Answers are idempotent by `clientId` and typed
  (`{key}`, `{keys}`, `{value}`, `{text}`). Five wrong codes lock the student
  for five minutes. A session is bound to one device (every session route needs the
  `X-Device-Id` header and answers 409 for any other device); a supervisor releases it
  (`POST /exam-sessions/:id/release`) and the same session, seed and deadline
  resume elsewhere.
- **Scoring** (`finalize-session.service.ts`): submitting, or the minute job
  closing sessions past their finalize time, scores multiple choice and
  true/false all-or-nothing and multiple response proportionally minus wrong
  choices. Short answer and essay stay ungraded; a session with none of them
  becomes `GRADED`, otherwise `SUBMITTED` or `EXPIRED`. Scores stay in this
  service; nothing is written to the report card.
- A schedule with sessions cannot be cancelled and only its end time can be
  extended; the schedule list and detail carry `hasSessions`, and the session
  list carries the student name and NIS (student-service ids joined with
  identity-service profiles).
- **Grading** (`src/exam-grading/`): a short answer or essay with text waits
  for the teacher; a blank or missing one scores 0 at once. Teachers list the
  exams they may grade (`GET /exam-grading/schedules`), the sessions of one
  exam, and the manual answers of a session, then grade each one
  (`PATCH /exam-grading/sessions/:sessionId/answers/:questionId`, 0 up to the
  question points, optional note). Scope is the teacher's teaching assignments
  (subject and classroom) in the semester of the exam, from academic-service;
  `exam-grading.manage-all` skips it. The last grade makes the session `GRADED`;
  grading a graded session again updates the total. Everything for one session
  runs under a row lock.
- **Score publication**: a `GRADED` session gets a `ScorePublication`
  (`PENDING`). A job every minute posts pending ones to assessment-service
  `POST /exam-scores` with the provisioning token (`ASSESSMENT_SERVICE_URL`,
  now required): `RETRY` outcomes wait `min(2^attempts, 60)` minutes and are retried for as
  long as it takes; a refusal is recorded in `lastError` and a publication stops
  after ten refusals. A mark only applies if the session was not graded again
  while the score was in flight. The
  payload carries the percentage `rawScore / maxScore * 100` and the student
  name and NIS. Nothing reaches `StudentScore` or the report card.

## What it borrows

| Borrowed | Why |
|---|---|
| `platform/auth` | Session liveness, `JwtAuthGuard` |
| `platform/access-control/permission` | `PermissionGuard`, `exam-questions.*` codes |
| `platform/identity` | Token introspection against identity-service |
| `platform/employee-identity` | Which employee record a signed-in user owns |
| `platform/academic-lookup` | The subject and grade pairs a teacher teaches, classrooms by id, the active semester |
| `platform/student-identity` | The student record of a signed-in account (student-service) |
| `platform/enrollment-lookup` | The active classroom of a student (student-service) |

## Permissions

`exam-questions.read|create|update|delete` for teachers (own subjects and grade
levels only), `exam-questions.approve` (explicit-only, Wakamad Kurikulum) and
`exam-questions.manage-all` (explicit-only, curriculum staff and Wakamad
Kurikulum) to work on any teacher's questions.

`exam-packages.read|create|update|delete` and
`exam-schedules.read|create|update|cancel|access-code` are explicit-only,
declared in identity-service and granted to curriculum staff, Wakamad
Kurikulum and the academic admin. Principal reads packages and schedules
through its read-everything grant but not the access code.

`exam-grading.read|grade` and `exam-scores.read` belong to teachers (and, with
`exam-grading.manage-all` and `exam-scores.read-all`, to the same curriculum
staff); all are explicit-only.

`exam-sessions.take` belongs to students only. `exam-sessions.read|release`
are explicit-only for curriculum staff, Wakamad Kurikulum and the academic
admin (Principal reads through its grant, not release). A role that was
edited by hand in admin-web does not get new codes by itself: grant them there.

## Known gaps

- A score a teacher changes after it was sent reaches assessment-service
  again, but the report card is never updated: the teacher enters it there.
- The sessions list does not say which students never started.
- No AI import (phase 3).
