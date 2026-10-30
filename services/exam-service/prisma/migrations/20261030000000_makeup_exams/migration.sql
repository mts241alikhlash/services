CREATE TYPE "ExamScheduleKind" AS ENUM ('REGULAR', 'MAKEUP');
CREATE TYPE "MakeupReason" AS ENUM ('SICK', 'PERMITTED', 'ABSENT', 'OTHER');

ALTER TABLE "exam_schedules"
  ADD COLUMN "kind" "ExamScheduleKind" NOT NULL DEFAULT 'REGULAR',
  ADD COLUMN "makeup_of_id" UUID;

ALTER TABLE "exam_schedules"
  ADD CONSTRAINT "exam_schedules_makeup_of_id_fkey"
  FOREIGN KEY ("makeup_of_id") REFERENCES "exam_schedules"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "exam_schedules_makeup_of_id_idx" ON "exam_schedules"("makeup_of_id");

CREATE TABLE "exam_schedule_participants" (
  "id" UUID NOT NULL,
  "schedule_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "reason" "MakeupReason" NOT NULL,
  "note" VARCHAR(200),
  "added_by_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exam_schedule_participants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "exam_schedule_participants_schedule_id_student_id_key"
  ON "exam_schedule_participants"("schedule_id", "student_id");
CREATE INDEX "exam_schedule_participants_student_id_idx"
  ON "exam_schedule_participants"("student_id");

ALTER TABLE "exam_schedule_participants"
  ADD CONSTRAINT "exam_schedule_participants_schedule_id_fkey"
  FOREIGN KEY ("schedule_id") REFERENCES "exam_schedules"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
