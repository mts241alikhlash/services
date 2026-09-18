-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('DAILY', 'MIDTERM', 'FINAL', 'ASSIGNMENT', 'PRACTICAL');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK');

-- CreateTable
CREATE TABLE "assessment_weights" (
    "id" UUID NOT NULL,
    "teaching_assignment_id" UUID NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "assessment_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_items" (
    "id" UUID NOT NULL,
    "teaching_assignment_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "max_score" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "assessment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_scores" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "assessment_item_id" UUID NOT NULL,
    "score" DOUBLE PRECISION,
    "note" TEXT,
    "corrected_by_id" UUID,
    "corrected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "schedule_id" UUID,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "total_average" DOUBLE PRECISION,
    "rank" INTEGER,
    "employee_note" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_card_subjects" (
    "id" UUID NOT NULL,
    "report_card_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "subject_code" VARCHAR(20),
    "subject_name" VARCHAR(100) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "passing_score" INTEGER NOT NULL,
    "predicate" VARCHAR(2) NOT NULL,
    "description" VARCHAR(50) NOT NULL,
    "is_complete" BOOLEAN NOT NULL,

    CONSTRAINT "report_card_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessment_weights_teaching_assignment_id_idx" ON "assessment_weights"("teaching_assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_weights_teaching_assignment_id_type_key" ON "assessment_weights"("teaching_assignment_id", "type");

-- CreateIndex
CREATE INDEX "assessment_items_teaching_assignment_id_idx" ON "assessment_items"("teaching_assignment_id");

-- CreateIndex
CREATE INDEX "student_scores_enrollment_id_idx" ON "student_scores"("enrollment_id");

-- CreateIndex
CREATE INDEX "student_scores_assessment_item_id_idx" ON "student_scores"("assessment_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_scores_enrollment_id_assessment_item_id_key" ON "student_scores"("enrollment_id", "assessment_item_id");

-- CreateIndex
CREATE INDEX "attendances_enrollment_id_idx" ON "attendances"("enrollment_id");

-- CreateIndex
CREATE INDEX "attendances_schedule_id_idx" ON "attendances"("schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_enrollment_id_date_schedule_id_key" ON "attendances"("enrollment_id", "date", "schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_cards_enrollment_id_key" ON "report_cards"("enrollment_id");

-- CreateIndex
CREATE INDEX "report_card_subjects_report_card_id_idx" ON "report_card_subjects"("report_card_id");

-- CreateIndex
CREATE INDEX "report_card_subjects_subject_id_idx" ON "report_card_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_card_subjects_report_card_id_subject_id_key" ON "report_card_subjects"("report_card_id", "subject_id");

-- AddForeignKey
ALTER TABLE "student_scores" ADD CONSTRAINT "student_scores_assessment_item_id_fkey" FOREIGN KEY ("assessment_item_id") REFERENCES "assessment_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_card_subjects" ADD CONSTRAINT "report_card_subjects_report_card_id_fkey" FOREIGN KEY ("report_card_id") REFERENCES "report_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

