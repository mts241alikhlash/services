-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'MULTIPLE_RESPONSE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'RETURNED');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('SUBMITTED', 'APPROVED', 'RETURNED');

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "author_employee_id" UUID NOT NULL,
    "type" "QuestionType" NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'DRAFT',
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "approved_version" INTEGER,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_versions" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "body_html" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_reviews" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "note" TEXT,
    "by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_files" (
    "id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questions_subject_id_grade_id_status_idx" ON "questions"("subject_id", "grade_id", "status");

-- CreateIndex
CREATE INDEX "questions_author_employee_id_idx" ON "questions"("author_employee_id");

-- CreateIndex
CREATE INDEX "questions_status_idx" ON "questions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "question_versions_question_id_number_key" ON "question_versions"("question_id", "number");

-- CreateIndex
CREATE INDEX "question_reviews_question_id_idx" ON "question_reviews"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_files_storage_key_key" ON "exam_files"("storage_key");

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_reviews" ADD CONSTRAINT "question_reviews_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 7.10.0 -> 8.0.0-rc.27                 │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

