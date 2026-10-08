---
'admission-service': minor
'@mts241alikhlash/admission-api': minor
'@mts241alikhlash/academic-api': minor
---

An applicant account can record whether it is a new or a transfer applicant and the grade it joins (`admissionType`, `targetGradeId`, optional on public and staff registration so older clients keep working), `GET /admissions/grades` (public) lists the active grades, and applications gain an `nis` column and the school-year NIS lock table. No behavior changes for existing applications.
