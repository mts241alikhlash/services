CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Day" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

CREATE TABLE "academic_settings" (
    "id" UUID NOT NULL,
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "weekly_holidays" INTEGER[] DEFAULT ARRAY[0]::INTEGER[],
    "default_passing_score" INTEGER NOT NULL DEFAULT 75,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "start_year" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "academic_calendar_classrooms" (
    "id" UUID NOT NULL,
    "academic_calendar_id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,

    CONSTRAINT "academic_calendar_classrooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "curricula" (
    "id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "curricula_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "academic_calendar_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "academic_calendar_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "semester_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 99,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "semester_types_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "classroom_supervisors" (
    "id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "semester_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "classroom_supervisors_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "grades" (
    "id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grade_academic_years" (
    "id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "curriculum_id" UUID NOT NULL,

    CONSTRAINT "grade_academic_years_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "occupations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "occupations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "educations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "income_ranges" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "income_ranges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "financing_sources" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "financing_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "disability_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "disability_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "special_needs" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "special_needs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_residences" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_residences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parent_residences" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parent_residences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transportations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transportations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "travel_distances" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "travel_distances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "travel_times" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "travel_times_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parent_life_statuses" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parent_life_statuses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "domiciles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "domiciles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scholarship_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "scholarship_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scholarship_provider_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "scholarship_provider_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "competition_fields" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "competition_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "competition_levels" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "competition_levels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "curriculum_subjects" (
    "id" UUID NOT NULL,
    "curriculum_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "hours_per_week" INTEGER NOT NULL DEFAULT 2,
    "passing_score" INTEGER NOT NULL DEFAULT 75,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "curriculum_subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "time_slot_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_lesson" BOOLEAN NOT NULL DEFAULT true,
    "days" "Day"[] DEFAULT ARRAY[]::"Day"[],
    "deleted_at" TIMESTAMP(3),
    "default_duration_minutes" INTEGER NOT NULL DEFAULT 40,

    CONSTRAINT "time_slot_types_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "schedules" (
    "id" UUID NOT NULL,
    "teaching_assignment_id" UUID NOT NULL,
    "time_slot_id" UUID NOT NULL,
    "day" "Day" NOT NULL,
    "room" VARCHAR(50),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "academic_settings_singleton_key" ON "academic_settings"("singleton");

CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

CREATE INDEX "semesters_is_active_idx" ON "semesters"("is_active");

CREATE INDEX "semesters_start_date_end_date_idx" ON "semesters"("start_date", "end_date");

CREATE UNIQUE INDEX "semesters_academic_year_id_type_id_key" ON "semesters"("academic_year_id", "type_id");

CREATE INDEX "academic_calendar_classrooms_classroom_id_idx" ON "academic_calendar_classrooms"("classroom_id");

CREATE UNIQUE INDEX "academic_calendar_classrooms_academic_calendar_id_classroom_key" ON "academic_calendar_classrooms"("academic_calendar_id", "classroom_id");

CREATE UNIQUE INDEX "curricula_name_key" ON "curricula"("name");

CREATE INDEX "curricula_academic_year_id_idx" ON "curricula"("academic_year_id");

CREATE UNIQUE INDEX "academic_calendar_types_name_key" ON "academic_calendar_types"("name");

CREATE UNIQUE INDEX "semester_types_name_key" ON "semester_types"("name");

CREATE INDEX "classrooms_academic_year_id_idx" ON "classrooms"("academic_year_id");

CREATE INDEX "classrooms_grade_id_idx" ON "classrooms"("grade_id");

CREATE UNIQUE INDEX "classrooms_academic_year_id_grade_id_code_key" ON "classrooms"("academic_year_id", "grade_id", "code");

CREATE INDEX "classroom_supervisors_employee_id_idx" ON "classroom_supervisors"("employee_id");

CREATE UNIQUE INDEX "classroom_supervisors_classroom_id_semester_id_key" ON "classroom_supervisors"("classroom_id", "semester_id");

CREATE UNIQUE INDEX "classroom_structures_classroom_id_semester_id_key" ON "classroom_structures"("classroom_id", "semester_id");

CREATE UNIQUE INDEX "grades_level_key" ON "grades"("level");

CREATE INDEX "grade_academic_years_academic_year_id_idx" ON "grade_academic_years"("academic_year_id");

CREATE INDEX "grade_academic_years_curriculum_id_idx" ON "grade_academic_years"("curriculum_id");

CREATE UNIQUE INDEX "grade_academic_years_grade_id_academic_year_id_key" ON "grade_academic_years"("grade_id", "academic_year_id");

CREATE UNIQUE INDEX "occupations_name_key" ON "occupations"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "educations_name_key" ON "educations"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "income_ranges_name_key" ON "income_ranges"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "financing_sources_name_key" ON "financing_sources"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "disability_types_name_key" ON "disability_types"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "special_needs_name_key" ON "special_needs"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "student_residences_name_key" ON "student_residences"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "parent_residences_name_key" ON "parent_residences"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "transportations_name_key" ON "transportations"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "travel_distances_name_key" ON "travel_distances"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "travel_times_name_key" ON "travel_times"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "parent_life_statuses_name_key" ON "parent_life_statuses"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "domiciles_name_key" ON "domiciles"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "scholarship_categories_name_key" ON "scholarship_categories"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "scholarship_provider_types_name_key" ON "scholarship_provider_types"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "competition_fields_name_key" ON "competition_fields"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "competition_levels_name_key" ON "competition_levels"("name") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name") WHERE ("deleted_at" IS NULL);

CREATE INDEX "curriculum_subjects_curriculum_id_idx" ON "curriculum_subjects"("curriculum_id");

CREATE INDEX "curriculum_subjects_subject_id_idx" ON "curriculum_subjects"("subject_id");

CREATE UNIQUE INDEX "curriculum_subjects_curriculum_id_subject_id_key" ON "curriculum_subjects"("curriculum_id", "subject_id") WHERE ("deleted_at" IS NULL);

CREATE UNIQUE INDEX "time_slot_types_code_key" ON "time_slot_types"("code") WHERE ("deleted_at" IS NULL);

CREATE INDEX "teaching_assignments_employee_id_idx" ON "teaching_assignments"("employee_id");

CREATE INDEX "teaching_assignments_classroom_id_idx" ON "teaching_assignments"("classroom_id");

CREATE INDEX "teaching_assignments_subject_id_idx" ON "teaching_assignments"("subject_id");

CREATE INDEX "teaching_assignments_semester_id_idx" ON "teaching_assignments"("semester_id");

CREATE UNIQUE INDEX "teaching_assignments_employee_id_classroom_id_subject_id_se_key" ON "teaching_assignments"("employee_id", "classroom_id", "subject_id", "semester_id") WHERE ("deleted_at" IS NULL);

CREATE INDEX "schedules_teaching_assignment_id_idx" ON "schedules"("teaching_assignment_id");

CREATE INDEX "schedules_time_slot_id_idx" ON "schedules"("time_slot_id");

CREATE UNIQUE INDEX "schedules_teaching_assignment_id_day_time_slot_id_key" ON "schedules"("teaching_assignment_id", "day", "time_slot_id") WHERE ("deleted_at" IS NULL);

ALTER TABLE "semesters" ADD CONSTRAINT "semesters_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "semesters" ADD CONSTRAINT "semesters_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "semester_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "academic_calendars" ADD CONSTRAINT "academic_calendars_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "academic_calendars" ADD CONSTRAINT "academic_calendars_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "academic_calendars" ADD CONSTRAINT "academic_calendars_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "academic_calendar_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "academic_calendar_classrooms" ADD CONSTRAINT "academic_calendar_classrooms_academic_calendar_id_fkey" FOREIGN KEY ("academic_calendar_id") REFERENCES "academic_calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "academic_calendar_classrooms" ADD CONSTRAINT "academic_calendar_classrooms_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "curricula" ADD CONSTRAINT "curricula_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "classroom_supervisors" ADD CONSTRAINT "classroom_supervisors_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "classroom_supervisors" ADD CONSTRAINT "classroom_supervisors_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "classroom_structures" ADD CONSTRAINT "classroom_structures_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "classroom_structures" ADD CONSTRAINT "classroom_structures_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "grade_academic_years" ADD CONSTRAINT "grade_academic_years_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "grade_academic_years" ADD CONSTRAINT "grade_academic_years_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "grade_academic_years" ADD CONSTRAINT "grade_academic_years_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "curriculum_subjects_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "curriculum_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "time_slot_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teaching_assignment_id_fkey" FOREIGN KEY ("teaching_assignment_id") REFERENCES "teaching_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "schedules" ADD CONSTRAINT "schedules_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "income_ranges" ("id", "name", "sort_order") VALUES
  ('ad78a84c-a83f-4888-bdc6-7a9bf2f408d9', 'Kurang dari Rp500.000', 1),
  ('ffc9086f-7df5-40ff-8045-95d194c50e5b', 'Rp500.000–Rp1.000.000', 2),
  ('861993f5-7504-46e8-b888-359c65a4fc6f', 'Rp1.000.000–Rp2.000.000', 3),
  ('3f2b33e9-269f-4302-9b19-896f634512ce', 'Rp2.000.000–Rp3.000.000', 4),
  ('53f22a40-5c05-41a3-a083-0ccf4bd4a194', 'Lebih dari Rp3.000.000', 5)
ON CONFLICT DO NOTHING;

INSERT INTO "financing_sources" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Orang tua', 1),
  (gen_random_uuid(), 'Wali', 2),
  (gen_random_uuid(), 'Diri sendiri', 3),
  (gen_random_uuid(), 'Beasiswa', 4),
  (gen_random_uuid(), 'Lainnya', 5)
ON CONFLICT DO NOTHING;

INSERT INTO "disability_types" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Tidak ada', 1),
  (gen_random_uuid(), 'Tunanetra', 2),
  (gen_random_uuid(), 'Tunarungu', 3),
  (gen_random_uuid(), 'Tunawicara', 4),
  (gen_random_uuid(), 'Tunadaksa', 5),
  (gen_random_uuid(), 'Tunagrahita', 6),
  (gen_random_uuid(), 'Tunalaras', 7),
  (gen_random_uuid(), 'Autis', 8),
  (gen_random_uuid(), 'Lainnya', 9)
ON CONFLICT DO NOTHING;

INSERT INTO "special_needs" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Tidak ada', 1),
  (gen_random_uuid(), 'Lamban belajar', 2),
  (gen_random_uuid(), 'Kesulitan belajar spesifik', 3),
  (gen_random_uuid(), 'Cerdas istimewa/bakat istimewa', 4),
  (gen_random_uuid(), 'Lainnya', 5)
ON CONFLICT DO NOTHING;

INSERT INTO "student_residences" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Bersama orang tua', 1),
  (gen_random_uuid(), 'Bersama wali', 2),
  (gen_random_uuid(), 'Kos', 3),
  (gen_random_uuid(), 'Asrama', 4),
  (gen_random_uuid(), 'Pesantren', 5),
  (gen_random_uuid(), 'Panti asuhan', 6),
  (gen_random_uuid(), 'Lainnya', 7)
ON CONFLICT DO NOTHING;

INSERT INTO "parent_residences" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Milik sendiri', 1),
  (gen_random_uuid(), 'Rumah orang tua', 2),
  (gen_random_uuid(), 'Sewa/kontrak', 3),
  (gen_random_uuid(), 'Rumah dinas', 4),
  (gen_random_uuid(), 'Menumpang', 5),
  (gen_random_uuid(), 'Lainnya', 6)
ON CONFLICT DO NOTHING;

INSERT INTO "transportations" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Jalan kaki', 1),
  (gen_random_uuid(), 'Sepeda', 2),
  (gen_random_uuid(), 'Sepeda motor', 3),
  (gen_random_uuid(), 'Mobil pribadi', 4),
  (gen_random_uuid(), 'Antar jemput sekolah', 5),
  (gen_random_uuid(), 'Angkutan umum', 6),
  (gen_random_uuid(), 'Ojek', 7),
  (gen_random_uuid(), 'Lainnya', 8)
ON CONFLICT DO NOTHING;

INSERT INTO "travel_distances" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Kurang dari 1 km', 1),
  (gen_random_uuid(), '1–3 km', 2),
  (gen_random_uuid(), '3–5 km', 3),
  (gen_random_uuid(), '5–10 km', 4),
  (gen_random_uuid(), 'Lebih dari 10 km', 5)
ON CONFLICT DO NOTHING;

INSERT INTO "travel_times" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Kurang dari 15 menit', 1),
  (gen_random_uuid(), '15–30 menit', 2),
  (gen_random_uuid(), '30–60 menit', 3),
  (gen_random_uuid(), '1–2 jam', 4),
  (gen_random_uuid(), 'Lebih dari 2 jam', 5)
ON CONFLICT DO NOTHING;

INSERT INTO "parent_life_statuses" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Masih hidup', 1),
  (gen_random_uuid(), 'Meninggal', 2),
  (gen_random_uuid(), 'Tidak diketahui', 3)
ON CONFLICT DO NOTHING;

INSERT INTO "domiciles" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Dalam negeri', 1),
  (gen_random_uuid(), 'Luar negeri', 2)
ON CONFLICT DO NOTHING;

INSERT INTO "scholarship_categories" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Prestasi', 1),
  (gen_random_uuid(), 'Kurang mampu', 2),
  (gen_random_uuid(), 'Yatim/piatu', 3),
  (gen_random_uuid(), 'Lainnya', 4)
ON CONFLICT DO NOTHING;

INSERT INTO "scholarship_provider_types" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Pemerintah pusat', 1),
  (gen_random_uuid(), 'Pemerintah daerah', 2),
  (gen_random_uuid(), 'Swasta/perusahaan', 3),
  (gen_random_uuid(), 'Yayasan', 4),
  (gen_random_uuid(), 'Perorangan', 5),
  (gen_random_uuid(), 'Lainnya', 6)
ON CONFLICT DO NOTHING;

INSERT INTO "competition_fields" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Akademik', 1),
  (gen_random_uuid(), 'Keagamaan', 2),
  (gen_random_uuid(), 'Seni', 3),
  (gen_random_uuid(), 'Olahraga', 4),
  (gen_random_uuid(), 'Lainnya', 5)
ON CONFLICT DO NOTHING;

INSERT INTO "competition_levels" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Madrasah/Sekolah', 1),
  (gen_random_uuid(), 'Kecamatan', 2),
  (gen_random_uuid(), 'Kabupaten/Kota', 3),
  (gen_random_uuid(), 'Provinsi', 4),
  (gen_random_uuid(), 'Nasional', 5),
  (gen_random_uuid(), 'Internasional', 6)
ON CONFLICT DO NOTHING;

INSERT INTO "occupations" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Tidak bekerja', 1),
  (gen_random_uuid(), 'Ibu rumah tangga', 2),
  (gen_random_uuid(), 'PNS', 3),
  (gen_random_uuid(), 'PPPK', 4),
  (gen_random_uuid(), 'TNI/Polri', 5),
  (gen_random_uuid(), 'Guru/Dosen', 6),
  (gen_random_uuid(), 'Karyawan swasta', 7),
  (gen_random_uuid(), 'Wiraswasta', 8),
  (gen_random_uuid(), 'Pedagang', 9),
  (gen_random_uuid(), 'Petani', 10),
  (gen_random_uuid(), 'Nelayan', 11),
  (gen_random_uuid(), 'Buruh', 12),
  (gen_random_uuid(), 'Lainnya', 13)
ON CONFLICT DO NOTHING;

INSERT INTO "educations" ("id", "name", "sort_order") VALUES
  (gen_random_uuid(), 'Tidak sekolah', 1),
  (gen_random_uuid(), 'SD/MI', 2),
  (gen_random_uuid(), 'SMP/MTs', 3),
  (gen_random_uuid(), 'SMA/SMK/MA', 4),
  (gen_random_uuid(), 'D1', 5),
  (gen_random_uuid(), 'D2', 6),
  (gen_random_uuid(), 'D3', 7),
  (gen_random_uuid(), 'D4/S1', 8),
  (gen_random_uuid(), 'S2', 9),
  (gen_random_uuid(), 'S3', 10)
ON CONFLICT DO NOTHING;

INSERT INTO "scholarship_categories" ("id", "name", "sort_order")
SELECT gen_random_uuid(), 'KIP/PIP', 0
WHERE NOT EXISTS (
  SELECT 1 FROM "scholarship_categories"
  WHERE "name" = 'KIP/PIP' AND "deleted_at" IS NULL
);
