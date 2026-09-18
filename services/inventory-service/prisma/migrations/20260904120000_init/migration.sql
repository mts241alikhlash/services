-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InventoryStatusKey" AS ENUM ('AVAILABLE', 'LOAN_PENDING', 'LOAN_APPROVED', 'LOANED', 'LOAN_RETURNED', 'LOAN_REJECTED');

-- CreateTable
CREATE TABLE "inventory_assets" (
    "id" UUID NOT NULL,
    "asset_number" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category_id" UUID NOT NULL,
    "brand" VARCHAR(100),
    "model" VARCHAR(100),
    "purchase_date" DATE NOT NULL,
    "purchase_price" DECIMAL(15,2) NOT NULL,
    "useful_life_months" INTEGER NOT NULL DEFAULT 0,
    "funding_source_id" UUID,
    "image_url" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "inventory_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_asset_units" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "unit_number" VARCHAR(50) NOT NULL,
    "barcode" VARCHAR(100),
    "current_book_value" DECIMAL(15,2) NOT NULL,
    "condition_id" UUID NOT NULL,
    "status_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "custodian_id" UUID,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "inventory_asset_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "parent_id" UUID,
    "depreciation_rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_locations" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "building" VARCHAR(100),
    "room" VARCHAR(100),
    "rack" VARCHAR(50),
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_conditions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "is_usable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_statuses" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "allow_transactions" BOOLEAN NOT NULL DEFAULT true,
    "system_key" "InventoryStatusKey",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_funding_sources" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_funding_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_histories" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "transaction_type_id" UUID NOT NULL,
    "previous_condition_id" UUID,
    "new_condition_id" UUID,
    "previous_status_id" UUID,
    "new_status_id" UUID,
    "previous_location_id" UUID,
    "new_location_id" UUID,
    "previous_custodian_id" UUID,
    "new_custodian_id" UUID,
    "note" TEXT,
    "changed_by_id" UUID NOT NULL,
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transaction_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "direction" VARCHAR(10) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transaction_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_loans" (
    "id" UUID NOT NULL,
    "loan_number" VARCHAR(50) NOT NULL,
    "requester_id" UUID NOT NULL,
    "expected_return_date" DATE NOT NULL,
    "actual_return_date" DATE,
    "purpose" TEXT NOT NULL,
    "status_id" UUID NOT NULL,
    "workflow_instance_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "inventory_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_loan_items" (
    "id" UUID NOT NULL,
    "loan_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "returned_condition_id" UUID,
    "notes" TEXT,

    CONSTRAINT "inventory_loan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "target_entity" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_steps" (
    "id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "step_sequence" INTEGER NOT NULL,
    "approver_role_code" VARCHAR(50) NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_instances" (
    "id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "reference_id" UUID NOT NULL,
    "current_step_sequence" INTEGER NOT NULL DEFAULT 1,
    "status_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "approval_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_logs" (
    "id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "step_sequence" INTEGER NOT NULL,
    "approver_id" UUID NOT NULL,
    "action_id" UUID NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_assets_asset_number_key" ON "inventory_assets"("asset_number");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_asset_units_unit_number_key" ON "inventory_asset_units"("unit_number");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_asset_units_barcode_key" ON "inventory_asset_units"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_categories_code_key" ON "inventory_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_locations_code_key" ON "inventory_locations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_conditions_code_key" ON "inventory_conditions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_statuses_code_key" ON "inventory_statuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_statuses_system_key_key" ON "inventory_statuses"("system_key");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_funding_sources_code_key" ON "inventory_funding_sources"("code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transaction_types_code_key" ON "inventory_transaction_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_loans_loan_number_key" ON "inventory_loans"("loan_number");

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflows_name_key" ON "approval_workflows"("name");

-- CreateIndex
CREATE UNIQUE INDEX "approval_steps_workflow_id_step_sequence_key" ON "approval_steps"("workflow_id", "step_sequence");

-- AddForeignKey
ALTER TABLE "inventory_assets" ADD CONSTRAINT "inventory_assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "inventory_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_assets" ADD CONSTRAINT "inventory_assets_funding_source_id_fkey" FOREIGN KEY ("funding_source_id") REFERENCES "inventory_funding_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_asset_units" ADD CONSTRAINT "inventory_asset_units_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "inventory_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_asset_units" ADD CONSTRAINT "inventory_asset_units_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "inventory_conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_asset_units" ADD CONSTRAINT "inventory_asset_units_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "inventory_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_asset_units" ADD CONSTRAINT "inventory_asset_units_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "inventory_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_categories" ADD CONSTRAINT "inventory_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "inventory_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_histories" ADD CONSTRAINT "inventory_histories_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "inventory_asset_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_histories" ADD CONSTRAINT "inventory_histories_transaction_type_id_fkey" FOREIGN KEY ("transaction_type_id") REFERENCES "inventory_transaction_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loan_items" ADD CONSTRAINT "inventory_loan_items_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "inventory_loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loan_items" ADD CONSTRAINT "inventory_loan_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "inventory_asset_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_instances" ADD CONSTRAINT "approval_instances_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "approval_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed reference data
--
-- The loan lifecycle looks these up by role, not by id: `findStatusBySystemKey`/
-- `findTransactionTypeByCode` across create-loan/process-approval/return-loan.
-- Every status role and transaction code those use cases ask for is inserted
-- here, so the tables above never start out with rows for none of them — the
-- exact incident `inventory-reference-data.spec.ts` exists to catch.
--
-- `allow_transactions` is true only for AVAILABLE: every other status is a
-- unit already mid-loan-lifecycle (pending, approved, out) or one that just
-- left it (returned, rejected), and none of those should be re-borrowable
-- until the unit cycles back to AVAILABLE.
INSERT INTO "inventory_statuses" ("id", "code", "name", "allow_transactions", "system_key") VALUES
  ('10000000-0000-0000-0000-000000000001', 'AVAILABLE', 'Available', true, 'AVAILABLE'),
  ('10000000-0000-0000-0000-000000000002', 'LOAN_PENDING', 'Loan Pending', false, 'LOAN_PENDING'),
  ('10000000-0000-0000-0000-000000000003', 'LOAN_APPROVED', 'Loan Approved', false, 'LOAN_APPROVED'),
  ('10000000-0000-0000-0000-000000000004', 'LOANED', 'Loaned', false, 'LOANED'),
  ('10000000-0000-0000-0000-000000000005', 'LOAN_RETURNED', 'Loan Returned', false, 'LOAN_RETURNED'),
  ('10000000-0000-0000-0000-000000000006', 'LOAN_REJECTED', 'Loan Rejected', false, 'LOAN_REJECTED');

INSERT INTO "inventory_transaction_types" ("id", "code", "name", "direction", "description") VALUES
  ('20000000-0000-0000-0000-000000000001', 'TX-LOAN-OUT', 'Loan Out', 'OUT', 'A unit leaves custody: a loan was approved and handed to the requester.'),
  ('20000000-0000-0000-0000-000000000002', 'TX-LOAN-IN', 'Loan In', 'IN', 'A unit returns from a loan.'),
  ('20000000-0000-0000-0000-000000000003', 'TX-LOAN-CANCEL', 'Loan Cancelled', 'NONE', 'A pending loan was rejected before the unit ever left.');

