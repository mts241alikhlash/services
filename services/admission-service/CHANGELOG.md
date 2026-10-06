# admission-service

## 2.0.0

### Major Changes

- 99c0a25: A wave's quota now counts applicants whose payment is verified. Verifying a payment locks the wave and answers 409 "Gelombang penuh" once the quota is met; the verification that fills a wave moves its unverified applicants to the next open wave of the same academic year and rebills them at that wave's fee. Public registration skips full waves, an admin registration or a proof upload into a full wave answers 409, wave summaries carry `filledCount`, stats rows carry `filled`, and application reads carry `waveIsFull`. Accepting no longer returns `quotaWarning`, which makes this a breaking contract change.

## 1.1.0

### Minor Changes

- faea0d6: `GET /admissions/stats` accepts `academicYearId` beside `waveId`, so the admin dashboard can show one academic year instead of every wave ever opened. Both query values are now validated as UUIDs through `AdmissionStatsQueryDto`; an invalid `waveId` used to reach the database and now answers 400.

## 1.0.0

### Major Changes

- First stable release.
