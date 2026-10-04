import { InventoryConditionEntity } from '../entities/condition.entity.js'

export interface ConditionCreateRepositoryInput {
  code: string
  name: string
  isUsable?: boolean
}

export interface ConditionUpdateRepositoryInput {
  code?: string
  name?: string
  isUsable?: boolean
}

export type ConditionRepositoryOutput = InventoryConditionEntity

export abstract class IConditionRepository {
  abstract findMany(search?: string): Promise<ConditionRepositoryOutput[]>
  abstract findById(id: string): Promise<ConditionRepositoryOutput | null>
  abstract create(
    data: ConditionCreateRepositoryInput,
  ): Promise<ConditionRepositoryOutput>
  abstract update(
    id: string,
    data: ConditionUpdateRepositoryInput,
  ): Promise<ConditionRepositoryOutput>
  abstract delete(id: string): Promise<ConditionRepositoryOutput>
}
