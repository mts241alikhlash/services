---
'exam-service': minor
'identity-service': minor
---

Add exam sessions for students: GET /me/exams, start with the access code (device bound, five wrong codes lock for five minutes), the shuffled paper without keys, idempotent answers, submit, automatic scoring of objective questions and a minute job that closes sessions past their finalize time. Supervisors list the sessions of a schedule and release a session from a device. A schedule with sessions cannot be cancelled and can only be extended. identity-service gains exam-sessions.take (students) and exam-sessions.read and release (curriculum staff); edited roles need the new codes in admin-web.
