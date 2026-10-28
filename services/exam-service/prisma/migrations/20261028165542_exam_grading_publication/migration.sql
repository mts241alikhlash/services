-- CreateEnum
CREATE TYPE "ScorePublicationStatus" AS ENUM ('PENDING', 'SENT');

-- AlterTable
ALTER TABLE "exam_answers" ADD COLUMN     "grade_note" VARCHAR(500),
ADD COLUMN     "graded_at" TIMESTAMP(3),
ADD COLUMN     "graded_by_id" UUID;

-- AlterTable
ALTER TABLE "exam_sessions" ADD COLUMN     "graded_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "score_publications" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "status" "ScorePublicationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" VARCHAR(300),
    "last_attempt_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "score_publications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "score_publications_session_id_key" ON "score_publications"("session_id");

-- CreateIndex
CREATE INDEX "score_publications_status_last_attempt_at_idx" ON "score_publications"("status", "last_attempt_at");

-- AddForeignKey
ALTER TABLE "score_publications" ADD CONSTRAINT "score_publications_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exam_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
