CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "SalaryComponentType" AS ENUM ('BASE', 'ALLOWANCE', 'ATTENDANCE_DRIVEN', 'DEDUCTION');

CREATE TYPE "AttendanceDriver" AS ENUM ('PRESENT_DAYS', 'ABSENT_DAYS', 'LATE_COUNT', 'LATE_MINUTES', 'EARLY_LEAVE_COUNT', 'LEAVE_DAYS', 'OFFICIAL_DUTY_DAYS');

CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED');

CREATE TYPE "PayrollRunKind" AS ENUM ('ORIGINAL', 'ADJUSTMENT');

CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "nip" VARCHAR(20),
    "nuptk" VARCHAR(20),
    "employment_type_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employment_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employment_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salary_components" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "SalaryComponentType" NOT NULL,
    "driver" "AttendanceDriver",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salary_assignments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "component_id" UUID NOT NULL,
    "amount" DECIMAL(15,2),
    "rate" DECIMAL(15,2),
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_by" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_runs" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "kind" "PayrollRunKind" NOT NULL DEFAULT 'ORIGINAL',
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "rounding_rule" VARCHAR(20) NOT NULL DEFAULT 'HALF_UP_RUPIAH',
    "created_by" UUID NOT NULL,
    "submitted_by" UUID,
    "submitted_at" TIMESTAMP(3),
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "note" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payslips" (
    "id" UUID NOT NULL,
    "payroll_run_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "gross_amount" DECIMAL(15,2) NOT NULL,
    "deduction_amount" DECIMAL(15,2) NOT NULL,
    "net_amount" DECIMAL(15,2) NOT NULL,
    "present_days" INTEGER NOT NULL DEFAULT 0,
    "absent_days" INTEGER NOT NULL DEFAULT 0,
    "late_count" INTEGER NOT NULL DEFAULT 0,
    "late_minutes" INTEGER NOT NULL DEFAULT 0,
    "early_leave_count" INTEGER NOT NULL DEFAULT 0,
    "leave_days" INTEGER NOT NULL DEFAULT 0,
    "official_duty_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payslip_lines" (
    "id" UUID NOT NULL,
    "payslip_id" UUID NOT NULL,
    "component_id" UUID,
    "component_code" VARCHAR(30) NOT NULL,
    "component_name" VARCHAR(100) NOT NULL,
    "component_type" "SalaryComponentType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "driver" "AttendanceDriver",
    "driver_count" INTEGER,
    "rate" DECIMAL(15,2),

    CONSTRAINT "payslip_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "position_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "position_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "positions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_positions" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "hire_date" DATE NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employee_positions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

CREATE UNIQUE INDEX "employees_nip_key" ON "employees"("nip") WHERE ("deleted_at" IS NULL AND "nip" IS NOT NULL);

CREATE UNIQUE INDEX "employees_nuptk_key" ON "employees"("nuptk") WHERE ("deleted_at" IS NULL AND "nuptk" IS NOT NULL);

CREATE UNIQUE INDEX "employment_types_code_key" ON "employment_types"("code");

CREATE UNIQUE INDEX "salary_components_code_key" ON "salary_components"("code");

CREATE INDEX "salary_assignments_user_id_effective_from_idx" ON "salary_assignments"("user_id", "effective_from");

CREATE INDEX "payroll_runs_year_month_idx" ON "payroll_runs"("year", "month");

CREATE UNIQUE INDEX "payroll_runs_period_key" ON "payroll_runs"("year", "month", "kind", "sequence");

CREATE INDEX "payslips_user_id_idx" ON "payslips"("user_id");

CREATE UNIQUE INDEX "payslips_payroll_run_id_user_id_key" ON "payslips"("payroll_run_id", "user_id");

CREATE INDEX "payslip_lines_payslip_id_idx" ON "payslip_lines"("payslip_id");

CREATE UNIQUE INDEX "position_categories_code_key" ON "position_categories"("code");

CREATE UNIQUE INDEX "positions_name_key" ON "positions"("name");

CREATE UNIQUE INDEX "employee_positions_employee_id_position_id_hire_date_key" ON "employee_positions"("employee_id", "position_id", "hire_date");

ALTER TABLE "employees" ADD CONSTRAINT "employees_employment_type_id_fkey" FOREIGN KEY ("employment_type_id") REFERENCES "employment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "salary_assignments" ADD CONSTRAINT "salary_assignments_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "salary_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_payslip_id_fkey" FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "salary_components"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "positions" ADD CONSTRAINT "positions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "position_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employee_positions" ADD CONSTRAINT "employee_positions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employee_positions" ADD CONSTRAINT "employee_positions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "employment_types" ("id", "code", "name") VALUES
  (gen_random_uuid(), 'PNS', 'PNS'),
  (gen_random_uuid(), 'PPPK', 'PPPK'),
  (gen_random_uuid(), 'GTY', 'Guru Tetap Yayasan'),
  (gen_random_uuid(), 'GTT', 'Guru Tidak Tetap'),
  (gen_random_uuid(), 'PTY', 'Pegawai Tetap Yayasan'),
  (gen_random_uuid(), 'PTT', 'Pegawai Tidak Tetap')
ON CONFLICT DO NOTHING;

INSERT INTO "position_categories" ("id", "code", "name") VALUES
  (gen_random_uuid(), 'LEADERSHIP', 'Pimpinan'),
  (gen_random_uuid(), 'EDUCATOR', 'Pendidik'),
  (gen_random_uuid(), 'EDUCATION_STAFF', 'Tenaga Kependidikan')
ON CONFLICT DO NOTHING;

INSERT INTO "positions" ("id", "name", "category_id")
SELECT gen_random_uuid(), v.name, c.id
FROM (VALUES
  ('Kepala Madrasah', 'LEADERSHIP'),
  ('Wakamad Kurikulum', 'LEADERSHIP'),
  ('Wakamad Kesantrian', 'LEADERSHIP'),
  ('Guru', 'EDUCATOR'),
  ('Kepala TU', 'EDUCATION_STAFF'),
  ('Bendahara', 'EDUCATION_STAFF'),
  ('Operator', 'EDUCATION_STAFF'),
  ('TU Administrasi', 'EDUCATION_STAFF'),
  ('TU Kesantrian', 'EDUCATION_STAFF'),
  ('TU Keuangan', 'EDUCATION_STAFF'),
  ('Humas', 'EDUCATION_STAFF'),
  ('Pustakawan', 'EDUCATION_STAFF'),
  ('Laboran', 'EDUCATION_STAFF'),
  ('Satpam', 'EDUCATION_STAFF'),
  ('Petugas Kebersihan', 'EDUCATION_STAFF')
) AS v(name, category)
JOIN "position_categories" c ON c."code" = v.category
ON CONFLICT DO NOTHING;
