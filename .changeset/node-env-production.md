---
'academic-service': patch
'admission-service': patch
'assessment-service': patch
'exam-service': patch
'hr-service': patch
'identity-service': patch
'inventory-service': patch
'portal-service': patch
'presence-service': patch
'student-service': patch
---

Images run with `NODE_ENV=production` unless the environment overrides it, so a missing variable can no longer expose reset tokens or skip the production checks.
