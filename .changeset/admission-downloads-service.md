---
'admission-service': minor
'@mts241alikhlash/admission-api': minor
---

PPDB download files: staff with `admission-downloads.*` upload, rename, describe, replace, activate, reorder and delete PDF files (at most 5 MB, checked by header) under `/admissions/downloads`, and visitors list the active ones with `GET /admissions/downloads/active` and download one with `GET /admissions/downloads/:id/file` without signing in. Adds the table `admission_downloads` (migration `20261009010000_admission_downloads`).
