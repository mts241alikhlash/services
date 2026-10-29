DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "questions") THEN
    RAISE EXCEPTION 'questions already exist; reset the exam database before moving questions into packages';
  END IF;
END $$;

-- AlterEnum
ALTER TYPE "ExamPackageStatus" ADD VALUE 'SUBMITTED';
ALTER TYPE "ExamPackageStatus" ADD VALUE 'RETURNED';
ALTER TYPE "ExamPackageStatus" ADD VALUE 'APPROVED';

-- CreateEnum
CREATE TYPE "PackageReviewAction" AS ENUM ('SUBMIT', 'APPROVE', 'RETURN');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "package_id" UUID NOT NULL,
ADD COLUMN     "copied_from_question_id" UUID,
ADD COLUMN     "copied_from_version" INTEGER;

-- CreateTable
CREATE TABLE "exam_package_reviews" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "action" "PackageReviewAction" NOT NULL,
    "by_user_id" UUID NOT NULL,
    "note" TEXT,
    "question_notes" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_package_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questions_package_id_idx" ON "questions"("package_id");

-- CreateIndex
CREATE INDEX "exam_package_reviews_package_id_created_at_idx" ON "exam_package_reviews"("package_id", "created_at");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "exam_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_package_reviews" ADD CONSTRAINT "exam_package_reviews_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "exam_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
