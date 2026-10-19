---
'admission-service': major
'student-service': major
'@mts241alikhlash/admission-api': major
'@mts241alikhlash/student-api': major
'identity-service': minor
'academic-service': patch
'assessment-service': patch
'hr-service': patch
'presence-service': patch
'portal-service': patch
'inventory-service': patch
'@mts241alikhlash/academic-api': patch
'@mts241alikhlash/assessment-api': patch
'@mts241alikhlash/portal-api': patch
---

Ejaan Amerika di seluruh kode: `enrolment` menjadi `enrollment` dan `enrol` menjadi `enroll`, juga `summarise`, `normalise`, `serialise`, `recognise`, `authorise`, `colour`, `centre`, `catalogue`, `honour`, `labelled`.

Perubahan kontrak: `admissions/enrolments/*` menjadi `admissions/enrollments/*`, `POST students/enrol` menjadi `POST students/enroll`, kode izin `admission-enrolments.read|process|nis` menjadi `admission-enrollments.read|process|nis`, serta nama DTO dan operationId di kontrak OpenAPI dan klien yang dihasilkan.

identity-service: migrasi `20261019100000_rename_admission_enrolment_permissions` mengganti kode izin di tabel `permissions`, jadi peran yang sudah ada (termasuk yang diubah tangan) tetap memegang izinnya. Rilis bersama admission-web dan academic-web; token akses lama membawa kode lama sampai diperbarui.
