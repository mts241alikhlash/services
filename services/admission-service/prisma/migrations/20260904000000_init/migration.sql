-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVISION_NEEDED', 'VERIFIED', 'ACCEPTED', 'REJECTED', 'ENROLLED');

-- CreateEnum
CREATE TYPE "AdmissionDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdmissionPaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdmissionNotificationType" AS ENUM ('STATUS_CHANGE', 'DOCUMENT', 'PAYMENT', 'ANNOUNCEMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "ParentRelation" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "IncomeRange" AS ENUM ('BELOW_500K', 'BETWEEN_500K_1M', 'BETWEEN_1M_2M', 'BETWEEN_2M_3M', 'ABOVE_3M');

-- CreateTable
CREATE TABLE "admission_waves" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "quota" INTEGER NOT NULL,
    "registration_fee" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_registration_seq" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "admission_waves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wave_id" UUID NOT NULL,
    "registration_number" VARCHAR(30) NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "full_name" VARCHAR(100) NOT NULL,
    "nickname" VARCHAR(50),
    "gender" "UserGender",
    "birth_place" VARCHAR(100),
    "birth_date" DATE,
    "nik" VARCHAR(16),
    "nisn" VARCHAR(20),
    "religion_id" UUID,
    "phone" VARCHAR(15),
    "email" VARCHAR(255),
    "child_order" INTEGER,
    "sibling_count" INTEGER,
    "street" VARCHAR(255),
    "rt" VARCHAR(5),
    "rw" VARCHAR(5),
    "village" VARCHAR(100),
    "district" VARCHAR(100),
    "city" VARCHAR(100),
    "province" VARCHAR(100),
    "postal_code" VARCHAR(10),
    "previous_school_name" VARCHAR(200),
    "previous_school_npsn" VARCHAR(20),
    "previous_school_address" VARCHAR(255),
    "graduation_year" INTEGER,
    "submitted_at" TIMESTAMP(3),
    "revision_note" TEXT,
    "verified_by_id" UUID,
    "verified_at" TIMESTAMP(3),
    "decided_by_id" UUID,
    "decided_at" TIMESTAMP(3),
    "decision_note" TEXT,
    "enrolled_student_id" UUID,
    "enrolled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "admission_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_application_parents" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "relation" "ParentRelation" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nik" VARCHAR(16),
    "birth_place" VARCHAR(100),
    "birth_date" DATE,
    "phone" VARCHAR(15),
    "occupation_id" UUID,
    "education_id" UUID,
    "income" "IncomeRange",
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_application_parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_document_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "admission_document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_documents" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "document_type_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "status" "AdmissionDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "verified_by_id" UUID,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_payments" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "bank_name" VARCHAR(100),
    "sender_account_name" VARCHAR(100),
    "transfer_date" DATE,
    "proof_file_id" UUID,
    "status" "AdmissionPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "note" TEXT,
    "verified_by_id" UUID,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_announcements" (
    "id" UUID NOT NULL,
    "wave_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "admission_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_notifications" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "type" "AdmissionNotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "uploaded_by" UUID,
    "filename" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admission_waves_code_key" ON "admission_waves"("code");

-- CreateIndex
CREATE INDEX "admission_waves_academic_year_id_idx" ON "admission_waves"("academic_year_id");

-- CreateIndex
CREATE INDEX "admission_waves_is_active_idx" ON "admission_waves"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "admission_applications_user_id_key" ON "admission_applications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admission_applications_registration_number_key" ON "admission_applications"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "admission_applications_enrolled_student_id_key" ON "admission_applications"("enrolled_student_id");

-- CreateIndex
CREATE INDEX "admission_applications_status_idx" ON "admission_applications"("status");

-- CreateIndex
CREATE INDEX "admission_applications_wave_id_idx" ON "admission_applications"("wave_id");

-- CreateIndex
CREATE UNIQUE INDEX "admission_application_parents_application_id_relation_key" ON "admission_application_parents"("application_id", "relation");

-- CreateIndex
CREATE UNIQUE INDEX "admission_document_types_code_key" ON "admission_document_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "admission_documents_application_id_document_type_id_key" ON "admission_documents"("application_id", "document_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "admission_payments_application_id_key" ON "admission_payments"("application_id");

-- CreateIndex
CREATE INDEX "admission_announcements_is_published_idx" ON "admission_announcements"("is_published");

-- CreateIndex
CREATE INDEX "admission_notifications_application_id_read_at_idx" ON "admission_notifications"("application_id", "read_at");

-- CreateIndex
CREATE INDEX "files_category_id_idx" ON "files"("category_id");

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_wave_id_fkey" FOREIGN KEY ("wave_id") REFERENCES "admission_waves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_application_parents" ADD CONSTRAINT "admission_application_parents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "admission_document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_payments" ADD CONSTRAINT "admission_payments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_payments" ADD CONSTRAINT "admission_payments_proof_file_id_fkey" FOREIGN KEY ("proof_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_announcements" ADD CONSTRAINT "admission_announcements_wave_id_fkey" FOREIGN KEY ("wave_id") REFERENCES "admission_waves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_notifications" ADD CONSTRAINT "admission_notifications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
