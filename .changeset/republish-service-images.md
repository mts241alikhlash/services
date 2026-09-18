---
"identity-service": patch
"academic-service": patch
"inventory-service": patch
"presence-service": patch
"portal-service": patch
"admission-service": patch
"hr-service": patch
"student-service": patch
"assessment-service": patch
---

Republish service images. The previous images were deleted while recovering from an orphaned-package registry issue and never got rebuilt (an empty diff never re-triggers `publish-images`); this changeset forces a real one.
