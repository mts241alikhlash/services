---
'exam-service': minor
'@mts241alikhlash/exam-api': minor
---

Makeup exams. A teacher creates a makeup from a regular schedule for chosen students who did not sit it: `GET /exam-schedules/{id}/absentees` lists the roster with who can still sit one, `POST /exam-schedules/{id}/makeups` creates it (own window that opens after the regular one ends, own token, the same classroom, semester and type, the same package or another approved one of the same subject and grade), and `GET`, `POST` and `DELETE /exam-schedules/{id}/participants` show live status per student, add and remove them. Schedules report `kind` and `makeupOfId`. A makeup shows only to its participants, titled with "(Susulan)", is hidden once the student has sat the regular exam, and refuses a start after that; students who moved classroom keep it. Scores of a makeup reach the assessment with the same title suffix, as a separate row of the same class, subject and semester.
