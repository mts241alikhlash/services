-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PROMOTED', 'REPEATED', 'TRANSFERRED', 'DROPPED', 'GRADUATED');

-- CreateEnum
CREATE TYPE "IncomeRange" AS ENUM ('BELOW_500K', 'BETWEEN_500K_1M', 'BETWEEN_1M_2M', 'BETWEEN_2M_3M', 'ABOVE_3M');

-- CreateEnum
CREATE TYPE "ParentRelation" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'TRANSFERRED', 'DROPPED', 'GRADUATED');

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "semester_id" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "note" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_graduations" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "graduation_date" DATE,
    "certificate_no" VARCHAR(100),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_graduations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_graduation_holds" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_graduation_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nik" VARCHAR(16) NOT NULL,
    "birth_place" VARCHAR(100) NOT NULL,
    "birth_date" DATE NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(15),
    "occupation_id" UUID NOT NULL,
    "education_id" UUID,
    "income" "IncomeRange",
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_parents" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "relation" "ParentRelation" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "nis" VARCHAR(20) NOT NULL,
    "nisn" VARCHAR(20) NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "grade_id" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_enrollments_classroom_id_idx" ON "student_enrollments"("classroom_id");

-- CreateIndex
CREATE INDEX "student_enrollments_semester_id_idx" ON "student_enrollments"("semester_id");

-- CreateIndex
CREATE INDEX "student_enrollments_status_idx" ON "student_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_student_id_semester_id_key" ON "student_enrollments"("student_id", "semester_id") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "student_graduations_student_id_key" ON "student_graduations"("student_id");

-- CreateIndex
CREATE INDEX "student_graduations_academic_year_id_idx" ON "student_graduations"("academic_year_id");

-- CreateIndex
CREATE INDEX "student_graduation_holds_academic_year_id_idx" ON "student_graduation_holds"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_graduation_holds_student_id_academic_year_id_key" ON "student_graduation_holds"("student_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "parents_occupation_id_idx" ON "parents"("occupation_id");

-- CreateIndex
CREATE UNIQUE INDEX "parents_nik_key" ON "parents"("nik") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "student_parents_student_id_parent_id_key" ON "student_parents"("student_id", "parent_id") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE INDEX "students_status_idx" ON "students"("status");

-- CreateIndex
CREATE INDEX "students_grade_id_idx" ON "students"("grade_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_nis_key" ON "students"("nis") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "students_nisn_key" ON "students"("nisn") WHERE ("deleted_at" IS NULL);

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_graduations" ADD CONSTRAINT "student_graduations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_graduation_holds" ADD CONSTRAINT "student_graduation_holds_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

