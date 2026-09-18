-- CreateEnum
CREATE TYPE "ApprovalConsequenceType" AS ENUM ('NONE', 'FINAL_APPROVAL', 'REJECTION');

-- CreateEnum
CREATE TYPE "ApprovalConsequenceStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "inventory_histories" ADD COLUMN "operation_key" VARCHAR(100);

-- AlterTable
ALTER TABLE "approval_logs"
ADD COLUMN "consequence_type" "ApprovalConsequenceType" NOT NULL DEFAULT 'NONE',
ADD COLUMN "consequence_status" "ApprovalConsequenceStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN "consequence_error" TEXT,
ADD COLUMN "consequence_updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "inventory_histories_operation_key_key" ON "inventory_histories"("operation_key");

-- CreateIndex
CREATE UNIQUE INDEX "approval_logs_instance_id_step_sequence_key" ON "approval_logs"("instance_id", "step_sequence");
