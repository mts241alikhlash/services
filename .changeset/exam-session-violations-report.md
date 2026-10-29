---
'exam-service': minor
---

Add POST /student-exams/{sessionId}/violations. The app reports how many times the student left the exam as it happens, the server keeps the highest count it was told and answers with it, so an app whose data was cleared reads the real count back by sending 0.
