-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Day" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- CreateTable
CREATE TABLE "academic_settings" (
    "id" UUID NOT NULL,
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "weekly_holidays" INTEGER[] DEFAULT ARRAY[0]::INTEGER[],
    "default_passing_score" INTEGER NOT NULL DEFAULT 75,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "start_year" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "type_id" UUID NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_calendars" (
    "id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "semester_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "type_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "start_time" TIME(0),
    "end_time" TIME(0),
    "description" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "academic_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_calendar_classrooms" (
    "id" UUID NOT NULL,
    "academic_calendar_id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,

    CONSTRAINT "academic_calendar_classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curricula" (
    "id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "curricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_calendar_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "academic_calendar_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 99,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "semester_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100),
    "capacity" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_supervisors" (
    "id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "semester_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "classroom_supervisors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_structures" (
    "id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "semester_id" UUID NOT NULL,
    "president_id" UUID,
    "vice_president_id" UUID,
    "secretary_id" UUID,
    "treasurer_id" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "classroom_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_academic_years" (
    "id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "curriculum_id" UUID NOT NULL,

    CONSTRAINT "grade_academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "occupations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_subjects" (
    "id" UUID NOT NULL,
    "curriculum_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "hours_per_week" INTEGER NOT NULL DEFAULT 2,
    "passing_score" INTEGER NOT NULL DEFAULT 75,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "curriculum_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_slot_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_lesson" BOOLEAN NOT NULL DEFAULT true,
    "days" "Day"[] DEFAULT ARRAY[]::"Day"[],
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "time_slot_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_slots" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "order" INTEGER NOT NULL,
    "type_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_assignments" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "semester_id" UUID NOT NULL,
    "passing_score" INTEGER,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "teaching_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" UUID NOT NULL,
    "teaching_assignment_id" UUID NOT NULL,
    "time_slot_id" UUID NOT NULL,
    "day" "Day" NOT NULL,
    "room" VARCHAR(50),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_settings_singleton_key" ON "academic_settings"("singleton");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE INDEX "semesters_is_active_idx" ON "semesters"("is_active");

-- CreateIndex
CREATE INDEX "semesters_start_date_end_date_idx" ON "semesters"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_academic_year_id_type_id_key" ON "semesters"("academic_year_id", "type_id");

-- CreateIndex
CREATE INDEX "academic_calendar_classrooms_classroom_id_idx" ON "academic_calendar_classrooms"("classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_calendar_classrooms_academic_calendar_id_classroom_key" ON "academic_calendar_classrooms"("academic_calendar_id", "classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "curricula_name_key" ON "curricula"("name");

-- CreateIndex
CREATE INDEX "curricula_academic_year_id_idx" ON "curricula"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_calendar_types_name_key" ON "academic_calendar_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "semester_types_name_key" ON "semester_types"("name");

-- CreateIndex
CREATE INDEX "classrooms_academic_year_id_idx" ON "classrooms"("academic_year_id");

-- CreateIndex
CREATE INDEX "classrooms_grade_id_idx" ON "classrooms"("grade_id");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_academic_year_id_grade_id_code_key" ON "classrooms"("academic_year_id", "grade_id", "code");

-- CreateIndex
CREATE INDEX "classroom_supervisors_employee_id_idx" ON "classroom_supervisors"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_supervisors_classroom_id_semester_id_key" ON "classroom_supervisors"("classroom_id", "semester_id");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_structures_classroom_id_semester_id_key" ON "classroom_structures"("classroom_id", "semester_id");

-- CreateIndex
CREATE UNIQUE INDEX "grades_level_key" ON "grades"("level");

-- CreateIndex
CREATE INDEX "grade_academic_years_academic_year_id_idx" ON "grade_academic_years"("academic_year_id");

-- CreateIndex
CREATE INDEX "grade_academic_years_curriculum_id_idx" ON "grade_academic_years"("curriculum_id");

-- CreateIndex
CREATE UNIQUE INDEX "grade_academic_years_grade_id_academic_year_id_key" ON "grade_academic_years"("grade_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "occupations_name_key" ON "occupations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "educations_name_key" ON "educations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE INDEX "curriculum_subjects_curriculum_id_idx" ON "curriculum_subjects"("curriculum_id");

-- CreateIndex
CREATE INDEX "curriculum_subjects_subject_id_idx" ON "curriculum_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_subjects_curriculum_id_subject_id_key" ON "curriculum_subjects"("curriculum_id", "subject_id") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "time_slot_types_code_key" ON "time_slot_types"("code") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE INDEX "teaching_assignments_employee_id_idx" ON "teaching_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "teaching_assignments_classroom_id_idx" ON "teaching_assignments"("classroom_id");

-- CreateIndex
CREATE INDEX "teaching_assignments_subject_id_idx" ON "teaching_assignments"("subject_id");

-- CreateIndex
CREATE INDEX "teaching_assignments_semester_id_idx" ON "teaching_assignments"("semester_id");

-- CreateIndex
CREATE UNIQUE INDEX "teaching_assignments_employee_id_classroom_id_subject_id_se_key" ON "teaching_assignments"("employee_id", "classroom_id", "subject_id", "semester_id") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE INDEX "schedules_teaching_assignment_id_idx" ON "schedules"("teaching_assignment_id");

-- CreateIndex
CREATE INDEX "schedules_time_slot_id_idx" ON "schedules"("time_slot_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_teaching_assignment_id_day_time_slot_id_key" ON "schedules"("teaching_assignment_id", "day", "time_slot_id") WHERE ("deleted_at" IS NULL);

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "semester_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_calendars" ADD CONSTRAINT "academic_calendars_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_calendars" ADD CONSTRAINT "academic_calendars_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_calendars" ADD CONSTRAINT "academic_calendars_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "academic_calendar_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_calendar_classrooms" ADD CONSTRAINT "academic_calendar_classrooms_academic_calendar_id_fkey" FOREIGN KEY ("academic_calendar_id") REFERENCES "academic_calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_calendar_classrooms" ADD CONSTRAINT "academic_calendar_classrooms_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curricula" ADD CONSTRAINT "curricula_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_supervisors" ADD CONSTRAINT "classroom_supervisors_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_supervisors" ADD CONSTRAINT "classroom_supervisors_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_structures" ADD CONSTRAINT "classroom_structures_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_structures" ADD CONSTRAINT "classroom_structures_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_academic_years" ADD CONSTRAINT "grade_academic_years_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_academic_years" ADD CONSTRAINT "grade_academic_years_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_academic_years" ADD CONSTRAINT "grade_academic_years_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "curriculum_subjects_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "curriculum_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "time_slot_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teaching_assignment_id_fkey" FOREIGN KEY ("teaching_assignment_id") REFERENCES "teaching_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

