---
'exam-service': patch
---

Point `.env.example` at the WHIP variable the service actually reads. Both
stream variables take a base address only: `issue-stream-token` appends
`/<sessionId>/whip` and `list-schedule-streams` appends
`/<sessionId>/index.m3u8`, so a path in the variable doubles the segment and
MediaMTX rejects the publish.
