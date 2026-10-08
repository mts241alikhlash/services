# @mts241alikhlash/identity-api

## 1.1.0

### Minor Changes

- c0d0dba: Profile addresses can carry a validated region code chain (province, regency, district, village). identity-service resolves codes against its region records, stores official names with them, and returns codes. Name-only addresses remain supported and leave region codes empty. Changing a region name without codes clears stored codes.

## 1.0.0

### Major Changes

- First stable release.
