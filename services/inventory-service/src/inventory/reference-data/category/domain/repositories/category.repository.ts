import { InventoryCategoryEntity } from '../entities/category.entity.js'

export interface CategoryCreateRepositoryInput {
  code: string
  name: string
  depreciationRatePercent?: number
}

export type CategoryUpdateRepositoryInput =
  Partial<CategoryCreateRepositoryInput>

export type CategoryRepositoryOutput = InventoryCategoryEntity

export abstract class ICategoryRepository {
  abstract findMany(search?: string): Promise<CategoryRepositoryOutput[]>
  abstract findById(id: string): Promise<CategoryRepositoryOutput | null>
  abstract create(
    data: CategoryCreateRepositoryInput,
  ): Promise<CategoryRepositoryOutput>
  abstract update(
    id: string,
    data: CategoryUpdateRepositoryInput,
  ): Promise<CategoryRepositoryOutput>
  abstract delete(id: string): Promise<CategoryRepositoryOutput>
}
