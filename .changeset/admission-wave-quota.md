---
'admission-service': major
'@mts241alikhlash/admission-api': major
---

A wave's quota now counts applicants whose payment is verified. Verifying a payment locks the wave and answers 409 "Gelombang penuh" once the quota is met; the verification that fills a wave moves its unverified applicants to the next open wave of the same academic year and rebills them at that wave's fee. Public registration skips full waves, an admin registration or a proof upload into a full wave answers 409, wave summaries carry `filledCount`, stats rows carry `filled`, and application reads carry `waveIsFull`. Accepting no longer returns `quotaWarning`, which makes this a breaking contract change.
