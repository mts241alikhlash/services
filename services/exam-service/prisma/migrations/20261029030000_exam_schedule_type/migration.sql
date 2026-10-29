-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('UH', 'QUIZ', 'TUGAS', 'UTS', 'UAS');

-- AlterTable
ALTER TABLE "exam_schedules" ADD COLUMN     "type" "ExamType" NOT NULL DEFAULT 'UH';
