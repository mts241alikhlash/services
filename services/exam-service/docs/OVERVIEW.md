# exam-service

241 Academic — computer-based exams (CBT). NestJS + Prisma + PostgreSQL,
NodeNext ESM: relative imports carry the `.js` extension even though the
source is `.ts`. Port 4100, database `exam_service`.

Designed in `platform-infra/docs/superpowers/specs/2026-10-24-exam-cbt-design.md`
(gitignored, on the owner's laptop). Built in phases: phase 1 is the question
bank (this release), phase 2 the sitting of the exam (packages, rooms,
sessions, answers, scoring), phase 3 Safe Exam Browser, AI import and
analysis.

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

## What it borrows

| Borrowed | Why |
|---|---|
| `platform/auth` | Session liveness, `JwtAuthGuard` |
| `platform/access-control/permission` | `PermissionGuard`, `exam-questions.*` codes |
| `platform/identity` | Token introspection against identity-service |
| `platform/employee-identity` | Which employee record a signed-in user owns |
| `platform/academic-lookup` | The subject and grade pairs a teacher teaches |

## Permissions

`exam-questions.read|create|update|delete` for teachers (own subjects and grade
levels only), `exam-questions.approve` (explicit-only, Wakamad Kurikulum) and
`exam-questions.manage-all` (explicit-only, curriculum staff and Wakamad
Kurikulum) to work on any teacher's questions.

## Known gaps

- No exam packages, sessions or scoring yet (phase 2).
- No AI import (phase 3).
