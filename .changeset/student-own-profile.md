---
'student-service': minor
---

GET /students/me now carries the caller's own birth place, birth date, email and phone, read from identity-service; the roster and list endpoints still leave them out. GET /students/me/classroom now reports the semester the enrollment belongs to, as `semester` with its name and sequence, or null when it cannot be resolved.
