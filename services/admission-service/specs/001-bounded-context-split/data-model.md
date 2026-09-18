# Data Model: Admission Contexts

| Context | Aggregate/data | Current supporting records |
|---|---|---|
| applicant | `AdmissionApplicant` | applicant account and application-facing profile |
| application | `AdmissionApplication` | `AdmissionApplicationParent`, status transitions |
| wave | `AdmissionWave` | academic-year reference |
| announcement | `AdmissionAnnouncement` | announcement audience and publication state |
| document | `AdmissionDocument` | `AdmissionFile`, document type |
| payment | `AdmissionPayment` | `AdmissionFile`, payment proof |
| notification | applicant notification | notification rows and read state |

Stage 1 changes file ownership only. Database ownership, fields, constraints,
and relationships remain unchanged.
