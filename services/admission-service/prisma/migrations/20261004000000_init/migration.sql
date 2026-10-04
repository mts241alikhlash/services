CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "UserGender" AS ENUM ('MALE', 'FEMALE');

CREATE TYPE "AdmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVISION_NEEDED', 'VERIFIED', 'ACCEPTED', 'ENROLLING', 'REJECTED', 'ENROLLED');

CREATE TYPE "AdmissionDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE "AdmissionPaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'VERIFIED', 'REJECTED');

CREATE TYPE "AdmissionNotificationType" AS ENUM ('STATUS_CHANGE', 'DOCUMENT', 'PAYMENT', 'ANNOUNCEMENT', 'GENERAL');

CREATE TYPE "ParentRelation" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');

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
    "province_code" VARCHAR(13),
    "regency_code" VARCHAR(13),
    "district_code" VARCHAR(13),
    "village_code" VARCHAR(13),
    "hobby" VARCHAR(100),
    "aspiration" VARCHAR(100),
    "financing_source_id" UUID,
    "disability_type_id" UUID,
    "special_need_id" UUID,
    "student_residence_id" UUID,
    "travel_distance_id" UUID,
    "travel_time_id" UUID,
    "transportation_id" UUID,
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
    "income_range_id" UUID,
    "life_status_id" UUID,
    "domicile_id" UUID,
    "residence_id" UUID,
    "same_address_as_student" BOOLEAN NOT NULL DEFAULT true,
    "street" VARCHAR(255),
    "rt" VARCHAR(5),
    "rw" VARCHAR(5),
    "village" VARCHAR(100),
    "district" VARCHAR(100),
    "city" VARCHAR(100),
    "province" VARCHAR(100),
    "postal_code" VARCHAR(10),
    "province_code" VARCHAR(13),
    "regency_code" VARCHAR(13),
    "district_code" VARCHAR(13),
    "village_code" VARCHAR(13),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_application_parents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admission_achievements" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,
    "competition_name" VARCHAR(150) NOT NULL,
    "competition_field_id" UUID,
    "organizer" VARCHAR(150),
    "competition_level_id" UUID,
    "rank" VARCHAR(50),
    "file_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_achievements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admission_scholarships" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,
    "category_id" UUID,
    "scholarship_name" VARCHAR(150) NOT NULL,
    "provider_name" VARCHAR(150),
    "provider_type_id" UUID,
    "duration" VARCHAR(50),
    "kip_number" VARCHAR(30),
    "amount" DECIMAL(14,2),
    "file_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_scholarships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admission_document_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "admission_document_types_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "admission_payments" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "bank_name" VARCHAR(100),
    "sender_account_name" VARCHAR(100),
    "transfer_date" DATE,
    "proof_file_id" UUID,
    "bank_account_id" UUID,
    "status" "AdmissionPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "note" TEXT,
    "verified_by_id" UUID,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_payments_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "admission_bank_accounts" (
    "id" UUID NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "account_number" VARCHAR(30) NOT NULL,
    "account_holder" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "admission_bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "uploaded_by" UUID,
    "application_id" UUID,
    "filename" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admission_waves_code_key" ON "admission_waves"("code");

CREATE INDEX "admission_waves_academic_year_id_idx" ON "admission_waves"("academic_year_id");

CREATE INDEX "admission_waves_is_active_idx" ON "admission_waves"("is_active");

CREATE UNIQUE INDEX "admission_applications_user_id_key" ON "admission_applications"("user_id");

CREATE UNIQUE INDEX "admission_applications_registration_number_key" ON "admission_applications"("registration_number");

CREATE UNIQUE INDEX "admission_applications_enrolled_student_id_key" ON "admission_applications"("enrolled_student_id");

CREATE INDEX "admission_applications_status_idx" ON "admission_applications"("status");

CREATE INDEX "admission_applications_wave_id_idx" ON "admission_applications"("wave_id");

CREATE UNIQUE INDEX "admission_application_parents_application_id_relation_key" ON "admission_application_parents"("application_id", "relation");

CREATE INDEX "admission_achievements_application_id_idx" ON "admission_achievements"("application_id");

CREATE INDEX "admission_scholarships_application_id_idx" ON "admission_scholarships"("application_id");

CREATE UNIQUE INDEX "admission_document_types_code_key" ON "admission_document_types"("code");

CREATE UNIQUE INDEX "admission_documents_application_id_document_type_id_key" ON "admission_documents"("application_id", "document_type_id");

CREATE UNIQUE INDEX "admission_payments_application_id_key" ON "admission_payments"("application_id");

CREATE INDEX "admission_announcements_is_published_idx" ON "admission_announcements"("is_published");

CREATE INDEX "admission_notifications_application_id_read_at_idx" ON "admission_notifications"("application_id", "read_at");

CREATE INDEX "files_category_id_idx" ON "files"("category_id");

ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_wave_id_fkey" FOREIGN KEY ("wave_id") REFERENCES "admission_waves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "admission_application_parents" ADD CONSTRAINT "admission_application_parents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admission_achievements" ADD CONSTRAINT "admission_achievements_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admission_achievements" ADD CONSTRAINT "admission_achievements_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admission_scholarships" ADD CONSTRAINT "admission_scholarships_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admission_scholarships" ADD CONSTRAINT "admission_scholarships_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "admission_document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "admission_payments" ADD CONSTRAINT "admission_payments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admission_payments" ADD CONSTRAINT "admission_payments_proof_file_id_fkey" FOREIGN KEY ("proof_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admission_payments" ADD CONSTRAINT "admission_payments_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "admission_bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admission_announcements" ADD CONSTRAINT "admission_announcements_wave_id_fkey" FOREIGN KEY ("wave_id") REFERENCES "admission_waves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admission_notifications" ADD CONSTRAINT "admission_notifications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "admission_document_types" ("id", "code", "name", "is_required", "sort_order") VALUES
  (gen_random_uuid(), 'FAMILY_CARD', 'Kartu Keluarga', true, 1),
  (gen_random_uuid(), 'BIRTH_CERTIFICATE', 'Akta Kelahiran', true, 2),
  (gen_random_uuid(), 'PHOTO', 'Pas Foto 3×4', true, 3),
  (gen_random_uuid(), 'GRADUATION_CERTIFICATE', 'Ijazah/SKL SD/MI', false, 4),
  (gen_random_uuid(), 'REPORT_CARD', 'Rapor Kelas 5–6', false, 5),
  (gen_random_uuid(), 'SOCIAL_AID_CARD', 'KIP/PKH/KKS', false, 6),
  (gen_random_uuid(), 'PARENT_ID_CARD', 'KTP Orang Tua/Wali', false, 7)
ON CONFLICT DO NOTHING;
