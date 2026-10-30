ALTER TABLE "exam_schedules"
  ADD CONSTRAINT "exam_schedules_makeup_pairing_check"
  CHECK (("kind" = 'MAKEUP') = ("makeup_of_id" IS NOT NULL));
