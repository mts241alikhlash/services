-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PresenceSubjectType" AS ENUM ('STUDENT', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('ACTIVE', 'REVOKED', 'REPLACED');

-- CreateEnum
CREATE TYPE "ScanOutcome" AS ENUM ('ACCEPTED', 'DUPLICATE', 'REJECTED_UNKNOWN', 'REJECTED_REVOKED', 'REJECTED_INACTIVE', 'REJECTED_STALE');

-- CreateEnum
CREATE TYPE "PresenceDayStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE', 'OFFICIAL_DUTY', 'NOT_EXPECTED');

-- CreateEnum
CREATE TYPE "PresenceValueSource" AS ENUM ('SCAN', 'MANUAL');

-- CreateEnum
CREATE TYPE "LeaveTreatment" AS ENUM ('ON_LEAVE', 'OFFICIAL_DUTY');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AttendancePeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "presence_credentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_type" "PresenceSubjectType" NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issued_by" UUID,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" VARCHAR(255),
    "replaced_by_id" UUID,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presence_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presence_devices" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "location" VARCHAR(150),
    "token_hash" VARCHAR(255) NOT NULL,
    "token_issued_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presence_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presence_scans" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "credential_id" UUID,
    "presented_code" VARCHAR(64) NOT NULL,
    "client_event_id" UUID NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "ScanOutcome" NOT NULL,
    "rejection_reason" VARCHAR(255),

    CONSTRAINT "presence_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_presences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_type" "PresenceSubjectType" NOT NULL,
    "date" DATE NOT NULL,
    "check_in_at" TIMESTAMP(3),
    "check_out_at" TIMESTAMP(3),
    "check_in_source" "PresenceValueSource",
    "check_out_source" "PresenceValueSource",
    "status" "PresenceDayStatus" NOT NULL,
    "status_source" "PresenceValueSource" NOT NULL DEFAULT 'SCAN',
    "late_minutes" INTEGER NOT NULL DEFAULT 0,
    "early_leave_minutes" INTEGER NOT NULL DEFAULT 0,
    "work_pattern_id" UUID,
    "leave_request_id" UUID,
    "note" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_presences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presence_corrections" (
    "id" UUID NOT NULL,
    "daily_presence_id" UUID NOT NULL,
    "field" VARCHAR(40) NOT NULL,
    "previous_value" VARCHAR(255),
    "new_value" VARCHAR(255),
    "reason" VARCHAR(255) NOT NULL,
    "actor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presence_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_patterns" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "grace_minutes" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_pattern_days" (
    "id" UUID NOT NULL,
    "work_pattern_id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "is_working_day" BOOLEAN NOT NULL DEFAULT true,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,

    CONSTRAINT "work_pattern_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_pattern_assignments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "work_pattern_id" UUID NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_pattern_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_working_days" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "source_calendar_id" UUID,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "non_working_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "treatment" "LeaveTreatment" NOT NULL,
    "consumes_quota" BOOLEAN NOT NULL DEFAULT false,
    "annual_quota" INTEGER,
    "requires_document" BOOLEAN NOT NULL DEFAULT false,
    "applies_to" "PresenceSubjectType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "leave_type_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "document_file_id" UUID,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approver_id" UUID,
    "decided_at" TIMESTAMP(3),
    "decision_reason" VARCHAR(255),
    "working_day_count" INTEGER NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_days" (
    "id" UUID NOT NULL,
    "leave_request_id" UUID NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "leave_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "leave_type_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "quota" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_periods" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "AttendancePeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closed_at" TIMESTAMP(3),
    "closed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "presence_credentials_code_key" ON "presence_credentials"("code");

-- CreateIndex
CREATE INDEX "presence_credentials_user_id_idx" ON "presence_credentials"("user_id");

-- CreateIndex
CREATE INDEX "presence_credentials_status_idx" ON "presence_credentials"("status");

-- CreateIndex
CREATE UNIQUE INDEX "presence_credentials_active_user_key" ON "presence_credentials"("user_id") WHERE ("status" = 'ACTIVE' AND "deleted_at" IS NULL);

-- CreateIndex
CREATE INDEX "presence_scans_credential_id_occurred_at_idx" ON "presence_scans"("credential_id", "occurred_at");

-- CreateIndex
CREATE INDEX "presence_scans_occurred_at_idx" ON "presence_scans"("occurred_at");

-- CreateIndex
CREATE INDEX "presence_scans_outcome_idx" ON "presence_scans"("outcome");

-- CreateIndex
CREATE UNIQUE INDEX "presence_scans_device_id_client_event_id_key" ON "presence_scans"("device_id", "client_event_id");

-- CreateIndex
CREATE INDEX "daily_presences_date_subject_type_idx" ON "daily_presences"("date", "subject_type");

-- CreateIndex
CREATE INDEX "daily_presences_user_id_date_idx" ON "daily_presences"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_presences_user_date_key" ON "daily_presences"("user_id", "date") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE INDEX "presence_corrections_daily_presence_id_idx" ON "presence_corrections"("daily_presence_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_patterns_single_default_key" ON "work_patterns"("is_default") WHERE ("is_default" = true AND "deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "work_pattern_days_work_pattern_id_weekday_key" ON "work_pattern_days"("work_pattern_id", "weekday");

-- CreateIndex
CREATE INDEX "work_pattern_assignments_user_id_effective_from_idx" ON "work_pattern_assignments"("user_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "non_working_days_date_key" ON "non_working_days"("date") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_code_key" ON "leave_types"("code");

-- CreateIndex
CREATE INDEX "leave_requests_requester_id_status_idx" ON "leave_requests"("requester_id", "status");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE INDEX "leave_days_date_idx" ON "leave_days"("date");

-- CreateIndex
CREATE UNIQUE INDEX "leave_days_leave_request_id_date_key" ON "leave_days"("leave_request_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_user_id_leave_type_id_year_key" ON "leave_balances"("user_id", "leave_type_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_periods_year_month_key" ON "attendance_periods"("year", "month");

-- AddForeignKey
ALTER TABLE "presence_credentials" ADD CONSTRAINT "presence_credentials_replaced_by_id_fkey" FOREIGN KEY ("replaced_by_id") REFERENCES "presence_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presence_scans" ADD CONSTRAINT "presence_scans_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "presence_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presence_scans" ADD CONSTRAINT "presence_scans_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "presence_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_presences" ADD CONSTRAINT "daily_presences_work_pattern_id_fkey" FOREIGN KEY ("work_pattern_id") REFERENCES "work_patterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_presences" ADD CONSTRAINT "daily_presences_leave_request_id_fkey" FOREIGN KEY ("leave_request_id") REFERENCES "leave_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presence_corrections" ADD CONSTRAINT "presence_corrections_daily_presence_id_fkey" FOREIGN KEY ("daily_presence_id") REFERENCES "daily_presences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_pattern_days" ADD CONSTRAINT "work_pattern_days_work_pattern_id_fkey" FOREIGN KEY ("work_pattern_id") REFERENCES "work_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_pattern_assignments" ADD CONSTRAINT "work_pattern_assignments_work_pattern_id_fkey" FOREIGN KEY ("work_pattern_id") REFERENCES "work_patterns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_days" ADD CONSTRAINT "leave_days_leave_request_id_fkey" FOREIGN KEY ("leave_request_id") REFERENCES "leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

