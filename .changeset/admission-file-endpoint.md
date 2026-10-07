---
'admission-service': minor
'@mts241alikhlash/admission-api': minor
---

`GET /admissions/files/:fileId` streams a document, payment proof or attachment of an admission record through the service (permission `admissions.read`), inline by default and as a download with `?download=1`. A file that no admission record owns answers 404.
