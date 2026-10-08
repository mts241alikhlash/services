---
'admission-service': minor
'@mts241alikhlash/admission-api': minor
---

Enrolment queue for TU Kesantrian: `GET /admissions/enrolments` (tabs Siap diproses, Tertahan, Selesai with counts and school years), NIS numbering (`GET /admissions/enrolments/nis-preview`, `POST /admissions/enrolments/nis` with the confirmed number of changes, `POST /admissions/enrolments/nis-lock`), bulk enrolment (`POST /admissions/enrolments/process`, up to 50 applicants with a result per applicant) and `PATCH /admissions/enrolments/:applicationId/placement`. NIS is the school-year code, the grade level and one alphabetical sequence per school year; students already created have their NIS updated in student-service in two steps. The single enrol endpoint now reads the NIS, NISN and grade from the application, which fixes the 400 for the missing grade, and requires `admission-enrolments.process` instead of `admissions.enroll`; Admin PPDB and Operator can no longer enrol.
