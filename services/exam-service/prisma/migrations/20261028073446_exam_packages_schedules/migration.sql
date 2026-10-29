-- CreateEnum
CREATE TYPE "ExamPackageStatus" AS ENUM ('DRAFT', 'LOCKED');

-- CreateEnum
CREATE TYPE "ExamScheduleStatus" AS ENUM ('SCHEDULED', 'CANCELLED');

-- CreateTable
CREATE TABLE "exam_packages" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "subject_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "status" "ExamPackageStatus" NOT NULL DEFAULT 'DRAFT',
    "locked_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_package_items" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "question_version" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "exam_package_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_schedules" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "semester_id" UUID NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "token_rotation" INTEGER NOT NULL DEFAULT 0,
    "status" "ExamScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_packages_subject_id_grade_id_status_idx" ON "exam_packages"("subject_id", "grade_id", "status");

-- CreateIndex
CREATE INDEX "exam_packages_status_idx" ON "exam_packages"("status");

-- CreateIndex
CREATE INDEX "exam_package_items_question_id_idx" ON "exam_package_items"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_package_items_package_id_question_id_key" ON "exam_package_items"("package_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_package_items_package_id_position_key" ON "exam_package_items"("package_id", "position");

-- CreateIndex
CREATE INDEX "exam_schedules_classroom_id_starts_at_idx" ON "exam_schedules"("classroom_id", "starts_at");

-- CreateIndex
CREATE INDEX "exam_schedules_package_id_idx" ON "exam_schedules"("package_id");

-- AddForeignKey
ALTER TABLE "exam_package_items" ADD CONSTRAINT "exam_package_items_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "exam_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_package_items" ADD CONSTRAINT "exam_package_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "exam_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
