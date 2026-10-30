---
'exam-service': minor
'@mts241alikhlash/exam-api': minor
---

Exam camera streams. `POST /student-exams/{sessionId}/stream-token` issues a short-lived WHIP
publish token for the session's camera; calling it again is the heartbeat, and each call rotates a
nonce that invalidates every token issued before it. `POST /student-exams/{sessionId}/camera-blocked`
records why the camera is not streaming (`network`, `permission`, `battery`, `stopped`) without
counting it as a violation. `POST /internal/stream-auth` answers MediaMTX's auth hook for both
publish and read, and returns `expireAt` so an open publish session is closed and re-checked at
least every minute.
