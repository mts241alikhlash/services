CREATE TABLE "admission_landing_sections" (
    "key" VARCHAR(20) NOT NULL,
    "published" JSONB,
    "draft" JSONB,
    "published_at" TIMESTAMP(3),
    "published_by_id" UUID,
    "draft_updated_at" TIMESTAMP(3),
    "draft_updated_by_id" UUID,

    CONSTRAINT "admission_landing_sections_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "admission_landing_images" (
    "id" UUID NOT NULL,
    "file_key" VARCHAR(255) NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "admission_landing_images_pkey" PRIMARY KEY ("id")
);
