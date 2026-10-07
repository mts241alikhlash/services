---
'admission-service': minor
'@mts241alikhlash/admission-api': minor
'identity-service': minor
---

The treasurer works admission payments from a payment queue: `GET /admissions/payments` (tabs Menunggu, Terverifikasi, Ditolak with counts), `PATCH /admissions/payments/:applicationId/verify`, `POST /admissions/payments/:applicationId/cancel` (reason required, allowed until the application is decided), `POST /admissions/payments` (add a verified payment for an applicant, proof required) and `GET /admissions/payments/eligible-applications`, guarded by the new `admission-payments.read|verify|create` permissions. The existing payment verification endpoint is now guarded by `admission-payments.verify`. `TREASURER` holds the three permissions and no longer `admissions.verify`.

Rejecting a payment that is already verified now answers 409 (cancel the verification first). Accepting, rejecting and verifying an application now lock the application row and answer 409 when a payment cancellation changed it first. Queue search treats `%` and `_` literally. `TREASURER` also gets `admission-waves.read` for the wave filter.

Existing installs: the seed only adds permissions, it never removes them. Remove `admissions.verify` from the Bendahara role and add `admission-waves.read` to it in admin-web after deploying.
