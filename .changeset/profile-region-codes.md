---
'identity-service': minor
'@mts241alikhlash/identity-api': minor
---

Profile addresses can carry a validated region code chain (province, regency, district, village). identity-service resolves codes against its region records, stores official names with them, and returns codes. Name-only addresses remain supported and leave region codes empty. Changing a region name without codes clears stored codes.
