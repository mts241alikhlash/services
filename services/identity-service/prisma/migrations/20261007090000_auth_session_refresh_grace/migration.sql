-- AlterTable
ALTER TABLE "auth_sessions" ADD COLUMN     "previous_rotated_at" TIMESTAMP(3),
ADD COLUMN     "previous_token_hash" VARCHAR(255);
