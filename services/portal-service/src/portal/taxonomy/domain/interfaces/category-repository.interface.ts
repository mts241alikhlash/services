export interface PostCategoryEntity {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  displayOrder: number
}

export interface PostCategoryWithCount extends PostCategoryEntity {
  publishedCount: number
}

export interface CreateCategoryInput {
  name: string
  slug: string
  description?: string | null
  isActive?: boolean
  displayOrder?: number
}

export interface UpdateCategoryInput {
  name?: string
  slug?: string
  description?: string | null
  isActive?: boolean
  displayOrder?: number
}

export interface CategoryUsage {
  count: number
  sampleTitles: string[]
}

export abstract class ICategoryRepository {
  abstract findAllActive(): Promise<PostCategoryEntity[]>

  abstract findAll(): Promise<PostCategoryEntity[]>

  abstract findById(id: string): Promise<PostCategoryEntity | null>

  abstract findBySlug(slug: string): Promise<PostCategoryEntity | null>

  abstract findActiveWithPublishedCounts(
    now?: Date,
  ): Promise<PostCategoryWithCount[]>

  abstract create(data: CreateCategoryInput): Promise<PostCategoryEntity>

  abstract update(
    id: string,
    data: UpdateCategoryInput,
  ): Promise<PostCategoryEntity>

  abstract findUsage(id: string): Promise<CategoryUsage>

  abstract softDelete(id: string): Promise<void>
}
