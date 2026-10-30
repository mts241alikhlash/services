ALTER TABLE "exam_sessions"
  ADD COLUMN "stream_nonce" VARCHAR(64),
  ADD COLUMN "last_seen_at" TIMESTAMP(3),
  ADD COLUMN "camera_blocked" VARCHAR(32);
