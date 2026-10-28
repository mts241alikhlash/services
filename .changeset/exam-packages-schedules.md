---
'exam-service': minor
'identity-service': minor
---

Add exam packages and schedules to the exam service: packages pin the approved version of each question and lock when scheduled, schedules tie a package to a classroom with a time window and duration, and the access code students enter is derived from the schedule and never stored. Identity gains the exam-packages and exam-schedules permission codes, given only through the curriculum staff, the deputy for curriculum and the academic admin roles. exam-service now needs EXAM_ACCESS_CODE_SECRET (at least 32 characters).
