CREATE TYPE "AdmissionType" AS ENUM ('NEW', 'TRANSFER');

ALTER TABLE "admission_applications"
  ADD COLUMN "admission_type" "AdmissionType",
  ADD COLUMN "target_grade_id" UUID,
  ADD COLUMN "target_grade_level" INTEGER,
  ADD COLUMN "nis" VARCHAR(20);

CREATE UNIQUE INDEX "admission_applications_nis_key" ON "admission_applications"("nis");

CREATE TABLE "admission_nis_locks" (
    "id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "locked_by_id" UUID NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_nis_locks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admission_nis_locks_academic_year_id_key" ON "admission_nis_locks"("academic_year_id");
