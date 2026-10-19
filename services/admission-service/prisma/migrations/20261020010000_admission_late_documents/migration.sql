CREATE TYPE "AdmissionDocumentRequirement" AS ENUM ('REQUIRED', 'LATER', 'OPTIONAL');

ALTER TABLE "admission_document_types"
  ADD COLUMN "requirement" "AdmissionDocumentRequirement" NOT NULL DEFAULT 'REQUIRED',
  ADD COLUMN "late_due_months" INTEGER;

UPDATE "admission_document_types"
SET "requirement" = CASE WHEN "is_required" THEN 'REQUIRED'::"AdmissionDocumentRequirement" ELSE 'OPTIONAL'::"AdmissionDocumentRequirement" END;
