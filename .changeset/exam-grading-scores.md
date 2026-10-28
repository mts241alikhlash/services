---
'exam-service': minor
'assessment-service': minor
'identity-service': minor
---

Teachers grade the short answers and essays of their classes in exam-service; the last grade closes the session and its score is posted by a minute job, with backoff, to the new exam_scores table in assessment-service (separate from student scores and the report card). Blank manual answers score 0 at once. Schedules now report hasSessions and the session list carries student names. identity-service gains exam-grading.read|grade|manage-all and exam-scores.read|read-all; edited roles need the new codes in admin-web. exam-service now requires ASSESSMENT_SERVICE_URL.
