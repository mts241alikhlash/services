---
'exam-service': minor
'academic-service': minor
---

A schedule now carries its exam type (UH, QUIZ, TUGAS, UTS or UAS), required when it is created or changed and frozen once a student has started. The student exam list reports the type and the subject name, so the apps can title an exam "UTS - IPA"; the name comes from the new internal POST /subjects/by-ids in academic-service, and a failing lookup leaves it null instead of hiding the exams. Existing schedules become UH. The student paper is now grouped by question type (multiple choice first, then true/false, short answer and essay), still shuffled inside each type and per seed. The grading schedule list reports the type too.
