-- DropForeignKey
ALTER TABLE "question_reviews" DROP CONSTRAINT "question_reviews_question_id_fkey";

-- DropIndex
DROP INDEX "questions_subject_id_grade_id_status_idx";

-- DropIndex
DROP INDEX "questions_status_idx";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "status",
DROP COLUMN "approved_version";

-- DropTable
DROP TABLE "question_reviews";

-- DropEnum
DROP TYPE "QuestionStatus";

-- DropEnum
DROP TYPE "ReviewAction";

-- CreateIndex
CREATE INDEX "questions_subject_id_grade_id_idx" ON "questions"("subject_id", "grade_id");
