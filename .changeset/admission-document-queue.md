---
'admission-service': minor
'@mts241alikhlash/admission-api': minor
---

Document review queue for staff: `GET /admissions/document-reviews` (tabs Menunggu, Perlu perbaikan, Selesai with counts), `GET /admissions/document-reviews/:applicationId`, `PATCH /admissions/document-reviews/:applicationId/documents/:documentId` (saves a decision without notifying the applicant) and `POST /admissions/document-reviews/:applicationId/send` (the only moment the applicant hears back; a rejected document or a data note returns the form with one notification). An application becomes VERIFIED automatically once it is submitted, every required document is approved and the payment is verified: after sending a result, after a payment is verified or added by the treasurer, and when an applicant resubmits with nothing left to review. The detail endpoints that approve a document, request a revision or verify an application now require `admission-documents.verify` instead of `admissions.verify`.
