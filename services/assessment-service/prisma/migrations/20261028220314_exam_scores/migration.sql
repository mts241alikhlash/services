-- CreateTable
CREATE TABLE "exam_scores" (
    "id" UUID NOT NULL,
    "exam_session_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "student_name" VARCHAR(200),
    "student_nis" VARCHAR(50),
    "subject_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "semester_id" UUID NOT NULL,
    "exam_title" VARCHAR(200) NOT NULL,
    "raw_score" DOUBLE PRECISION NOT NULL,
    "max_score" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "graded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_scores_exam_session_id_key" ON "exam_scores"("exam_session_id");

-- CreateIndex
CREATE INDEX "exam_scores_classroom_id_subject_id_semester_id_idx" ON "exam_scores"("classroom_id", "subject_id", "semester_id");

-- CreateIndex
CREATE INDEX "exam_scores_student_id_idx" ON "exam_scores"("student_id");
