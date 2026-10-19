UPDATE "permissions"
SET "module" = 'admission-enrollments',
    "code" = replace("code", 'admission-enrolments.', 'admission-enrollments.')
WHERE "code" LIKE 'admission-enrolments.%'
  AND NOT EXISTS (
    SELECT 1 FROM "permissions" AS existing
    WHERE existing."code" = replace("permissions"."code", 'admission-enrolments.', 'admission-enrollments.')
  );
