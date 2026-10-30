# @mts241alikhlash/exam-api

## 1.1.0

### Minor Changes

- 865d755: Exam camera streams. `POST /student-exams/{sessionId}/stream-token` issues a short-lived WHIP
  publish token for the session's camera; calling it again is the heartbeat, and each call rotates a
  nonce that invalidates every token issued before it. `POST /student-exams/{sessionId}/camera-blocked`
  records why the camera is not streaming (`network`, `permission`, `battery`, `stopped`) without
  counting it as a violation. `POST /internal/stream-auth` answers MediaMTX's auth hook for both
  publish and read, and returns `expireAt` so an open publish session is closed and re-checked at
  least every minute.

## 1.0.0

### Major Changes

- 785d574: A schedule now carries its exam type (UH, QUIZ, TUGAS, UTS or UAS), required when it is created or changed and frozen once a student has started. The student exam list reports the type and the subject name, so the apps can title an exam "UTS - IPA"; the name comes from the new internal POST /subjects/by-ids in academic-service, and a failing lookup leaves it null instead of hiding the exams. Existing schedules become UH. The student paper is now grouped by question type (multiple choice first, then true/false, short answer and essay), still shuffled inside each type and per seed. The grading schedule list reports the type too. POST /student-exams/{sessionId}/submit takes an optional `violations` count, kept on the session (never lowered) and shown as `violationCount` in the session lists, so staff can tell an exam the app handed in after the student left it too often.
- c0a3284: Questions now belong to one package. A teacher creates an empty package, then writes questions in it, imports an Excel or Word file into it, or copies questions from an approved or scheduled package of the same subject and grade; a copy keeps where it came from and changing it never touches the original. A package goes DRAFT, SUBMITTED, APPROVED (or RETURNED with a note and notes on single questions) and only an approved package, or one already scheduled for another classroom, can be scheduled. Submitting, approving and returning are whole-package actions with a review history; an approver cannot approve a package they wrote unless they manage all questions. The package view marks each question as new, changed or copied. A teacher lists their own packages in every status and the approved or scheduled packages of others; drafts of others stay hidden. Copying a package now copies its questions. GET /exam-packages/candidates is gone and the import takes a packageId instead of a subject and a grade. Roles that build exams need exam-packages.read, create, update and delete; reviewers need exam-questions.approve. A package can be changed, submitted, imported into or deleted only by the teacher who started it or by someone who manages all questions. The migration refuses to run while questions exist, so reset the exam database first.

### Minor Changes

- 57b4fb5: Makeup exams. A teacher creates a makeup from a regular schedule for chosen students who did not sit it: `GET /exam-schedules/{id}/absentees` lists the roster with who can still sit one, `POST /exam-schedules/{id}/makeups` creates it (own window that opens after the regular one ends, own token, the same classroom, semester and type, the same package or another approved one of the same subject and grade), and `GET`, `POST` and `DELETE /exam-schedules/{id}/participants` show live status per student, add and remove them. Schedules report `kind` and `makeupOfId`. A makeup shows only to its participants, titled with "(Susulan)", is hidden once the student has sat the regular exam, and refuses a start after that; students who moved classroom keep it. Scores of a makeup reach the assessment with the same title suffix, as a separate row of the same class, subject and semester. Teachers run makeups for the classes and subjects they teach (exam-grading.read and exam-grading.grade with the teaching scope; staff with exam-grading.manage-all see all), so the makeup routes no longer need exam-schedules permissions. The grading schedule list also shows ended schedules nobody started and makeups, and carries packageId, durationMinutes and kind. A session the clock closed with no answer at all no longer sends a score of zero to the assessment: such a student counts as not having sat the exam and can sit a makeup.

## 0.2.0

### Minor Changes

- a5d3ed2: Add the exam service with its question bank: questions of five types with immutable versions, a submit, approve and return flow bound to the revision the reviewer read, teacher scope from teaching assignments, question images, and Excel and Word import. Ships with its generated OpenAPI contract and client.
