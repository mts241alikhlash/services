-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('BERITA', 'ARTIKEL', 'PENGUMUMAN');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaUsageKind" AS ENUM ('COVER', 'BODY', 'ATTACHMENT', 'ALBUM_PHOTO');

-- CreateTable
CREATE TABLE "file_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "file_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "uploaded_by" UUID,
    "filename" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_posts" (
    "id" UUID NOT NULL,
    "type" "PostType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "cover_file_id" UUID,
    "cover_alt_text" VARCHAR(300),
    "category_id" UUID,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ,
    "scheduled_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "attachment_file_id" UUID,
    "pinned_at" TIMESTAMPTZ,
    "meta_title" VARCHAR(200),
    "meta_description" VARCHAR(300),
    "author_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "portal_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_post_slug_history" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "type" "PostType" NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_post_slug_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_post_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "portal_post_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_post_tags" (
    "post_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "portal_post_tags_pkey" PRIMARY KEY ("post_id","tag_id")
);

-- CreateTable
CREATE TABLE "portal_gallery_albums" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "event_date" DATE NOT NULL,
    "cover_file_id" UUID,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ,
    "scheduled_at" TIMESTAMPTZ,
    "author_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "portal_gallery_albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_gallery_photos" (
    "id" UUID NOT NULL,
    "album_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "caption" VARCHAR(300),
    "alt_text" VARCHAR(300) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_gallery_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_agenda_entries" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "location" VARCHAR(200) NOT NULL,
    "cover_file_id" UUID,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ,
    "scheduled_at" TIMESTAMPTZ,
    "author_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "portal_agenda_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_pages" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "body" TEXT NOT NULL,
    "meta_title" VARCHAR(200),
    "meta_description" VARCHAR(300),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ,
    "author_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "portal_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_page_slug_history" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_page_slug_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_nav_items" (
    "id" UUID NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "page_id" UUID,
    "route_key" VARCHAR(60),
    "external_url" VARCHAR(500),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_nav_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_media_usages" (
    "id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "kind" "MediaUsageKind" NOT NULL,
    "post_id" UUID,
    "agenda_id" UUID,
    "album_id" UUID,
    "page_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_media_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_homepage_sections" (
    "id" UUID NOT NULL,
    "key" VARCHAR(40) NOT NULL,
    "item_count" INTEGER NOT NULL DEFAULT 3,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_homepage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_categories_code_key" ON "file_categories"("code");

-- CreateIndex
CREATE INDEX "files_category_id_idx" ON "files"("category_id");

-- CreateIndex
CREATE INDEX "portal_posts_type_status_published_at_idx" ON "portal_posts"("type", "status", "published_at");

-- CreateIndex
CREATE INDEX "portal_posts_type_pinned_at_published_at_idx" ON "portal_posts"("type", "pinned_at", "published_at");

-- CreateIndex
CREATE INDEX "portal_posts_deleted_at_idx" ON "portal_posts"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "portal_posts_type_slug_key" ON "portal_posts"("type", "slug");

-- CreateIndex
CREATE INDEX "portal_post_slug_history_post_id_idx" ON "portal_post_slug_history"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "portal_post_slug_history_type_slug_key" ON "portal_post_slug_history"("type", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "portal_post_categories_slug_key" ON "portal_post_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "portal_tags_slug_key" ON "portal_tags"("slug");

-- CreateIndex
CREATE INDEX "portal_post_tags_tag_id_idx" ON "portal_post_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "portal_gallery_albums_slug_key" ON "portal_gallery_albums"("slug");

-- CreateIndex
CREATE INDEX "portal_gallery_albums_status_published_at_idx" ON "portal_gallery_albums"("status", "published_at");

-- CreateIndex
CREATE INDEX "portal_gallery_albums_status_event_date_idx" ON "portal_gallery_albums"("status", "event_date");

-- CreateIndex
CREATE INDEX "portal_gallery_albums_deleted_at_idx" ON "portal_gallery_albums"("deleted_at");

-- CreateIndex
CREATE INDEX "portal_gallery_photos_album_id_display_order_idx" ON "portal_gallery_photos"("album_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "portal_agenda_entries_slug_key" ON "portal_agenda_entries"("slug");

-- CreateIndex
CREATE INDEX "portal_agenda_entries_status_start_time_idx" ON "portal_agenda_entries"("status", "start_time");

-- CreateIndex
CREATE INDEX "portal_agenda_entries_status_end_time_idx" ON "portal_agenda_entries"("status", "end_time");

-- CreateIndex
CREATE INDEX "portal_agenda_entries_deleted_at_idx" ON "portal_agenda_entries"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "portal_pages_slug_key" ON "portal_pages"("slug");

-- CreateIndex
CREATE INDEX "portal_pages_status_published_at_idx" ON "portal_pages"("status", "published_at");

-- CreateIndex
CREATE INDEX "portal_pages_deleted_at_idx" ON "portal_pages"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "portal_page_slug_history_slug_key" ON "portal_page_slug_history"("slug");

-- CreateIndex
CREATE INDEX "portal_page_slug_history_page_id_idx" ON "portal_page_slug_history"("page_id");

-- CreateIndex
CREATE INDEX "portal_nav_items_is_active_display_order_idx" ON "portal_nav_items"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "portal_media_usages_file_id_idx" ON "portal_media_usages"("file_id");

-- CreateIndex
CREATE INDEX "portal_media_usages_post_id_idx" ON "portal_media_usages"("post_id");

-- CreateIndex
CREATE INDEX "portal_media_usages_agenda_id_idx" ON "portal_media_usages"("agenda_id");

-- CreateIndex
CREATE INDEX "portal_media_usages_album_id_idx" ON "portal_media_usages"("album_id");

-- CreateIndex
CREATE INDEX "portal_media_usages_page_id_idx" ON "portal_media_usages"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "portal_homepage_sections_key_key" ON "portal_homepage_sections"("key");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "file_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_posts" ADD CONSTRAINT "portal_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "portal_post_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_posts" ADD CONSTRAINT "portal_posts_cover_file_id_fkey" FOREIGN KEY ("cover_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_posts" ADD CONSTRAINT "portal_posts_attachment_file_id_fkey" FOREIGN KEY ("attachment_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_post_slug_history" ADD CONSTRAINT "portal_post_slug_history_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "portal_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_post_tags" ADD CONSTRAINT "portal_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "portal_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_post_tags" ADD CONSTRAINT "portal_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "portal_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_gallery_albums" ADD CONSTRAINT "portal_gallery_albums_cover_file_id_fkey" FOREIGN KEY ("cover_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_gallery_photos" ADD CONSTRAINT "portal_gallery_photos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "portal_gallery_albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_gallery_photos" ADD CONSTRAINT "portal_gallery_photos_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_agenda_entries" ADD CONSTRAINT "portal_agenda_entries_cover_file_id_fkey" FOREIGN KEY ("cover_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_page_slug_history" ADD CONSTRAINT "portal_page_slug_history_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "portal_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_nav_items" ADD CONSTRAINT "portal_nav_items_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "portal_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_media_usages" ADD CONSTRAINT "portal_media_usages_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_media_usages" ADD CONSTRAINT "portal_media_usages_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "portal_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

