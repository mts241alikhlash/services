-- CreateEnum
CREATE TYPE "ExamSessionStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'GRADED');

-- CreateTable
CREATE TABLE "exam_sessions" (
    "id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_id" VARCHAR(100),
    "shuffle_seed" VARCHAR(32) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "finalize_at" TIMESTAMP(3) NOT NULL,
    "status" "ExamSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "submitted_at" TIMESTAMP(3),
    "raw_score" DOUBLE PRECISION,
    "max_score" DOUBLE PRECISION,
    "released_at" TIMESTAMP(3),
    "released_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_answers" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer" JSONB NOT NULL,
    "client_id" VARCHAR(64) NOT NULL,
    "received_after_deadline" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_access_attempts" (
    "id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_access_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_sessions_status_finalize_at_idx" ON "exam_sessions"("status", "finalize_at");

-- CreateIndex
CREATE UNIQUE INDEX "exam_sessions_schedule_id_student_id_key" ON "exam_sessions"("schedule_id", "student_id");

-- CreateIndex
CREATE INDEX "exam_answers_question_id_idx" ON "exam_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_answers_session_id_question_id_key" ON "exam_answers"("session_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_answers_session_id_client_id_key" ON "exam_answers"("session_id", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_access_attempts_schedule_id_student_id_key" ON "exam_access_attempts"("schedule_id", "student_id");

-- AddForeignKey
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "exam_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exam_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
