---
'admission-service': minor
'@mts241alikhlash/admission-api': minor
---

`GET /admissions/stats` accepts `academicYearId` beside `waveId`, so the admin dashboard can show one academic year instead of every wave ever opened. Both query values are now validated as UUIDs through `AdmissionStatsQueryDto`; an invalid `waveId` used to reach the database and now answers 400.
