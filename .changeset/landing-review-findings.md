---
'admission-service': patch
---

Landing content: the unused-image cleanup removes the stored object before its row, so a storage failure leaves the row for the next check instead of an orphan object, and publishing no longer overwrites a draft that was saved at the same moment (a section is published only if its draft is unchanged since it was read).
