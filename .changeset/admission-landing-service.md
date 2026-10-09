---
'admission-service': minor
'@mts241alikhlash/admission-api': minor
---

PPDB landing content: staff with `admission-landing.*` save drafts of seven landing sections (hero, life, info, steps, faq, stories, closing), upload images that are converted to WebP, publish every draft at once, or discard them; visitors read the published content with `GET /admissions/landing` and the images with `GET /admissions/landing/images/:id`. Adds the tables `admission_landing_sections` and `admission_landing_images` and the `sharp` dependency.
