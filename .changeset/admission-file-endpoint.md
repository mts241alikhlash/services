---
'admission-service': minor
'@mts241alikhlash/admission-api': minor
---

`GET /admissions/files/:fileId` streams a document, payment proof or attachment of an admission record through the service (permission `admissions.read`), inline by default and as a download with `?download=1`. A file that no admission record owns answers 404.

The guard requires every listed permission, so the endpoint takes one code and `admissions.read` is the one: a custom role that holds only `admission-payments.*` cannot open a payment proof until it also gets `admissions.read` in admin-web. The default roles (Bendahara through TU Keuangan, Admin PPDB, Operator, TU Kesantrian) already hold it.
