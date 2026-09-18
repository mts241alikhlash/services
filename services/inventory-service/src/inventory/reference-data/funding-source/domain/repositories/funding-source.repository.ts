import { InventoryFundingSourceEntity } from '../entities/funding-source.entity.js'

export interface FundingSourceCreateRepositoryInput {
  code: string
  name: string
  description?: string | null
}

export interface FundingSourceUpdateRepositoryInput {
  code?: string
  name?: string
  description?: string | null
}

export type FundingSourceRepositoryOutput = InventoryFundingSourceEntity

export abstract class IFundingSourceRepository {
  abstract findMany(search?: string): Promise<FundingSourceRepositoryOutput[]>
  abstract findById(id: string): Promise<FundingSourceRepositoryOutput | null>
  abstract create(
    data: FundingSourceCreateRepositoryInput,
  ): Promise<FundingSourceRepositoryOutput>
  abstract update(
    id: string,
    data: FundingSourceUpdateRepositoryInput,
  ): Promise<FundingSourceRepositoryOutput>
  abstract delete(id: string): Promise<FundingSourceRepositoryOutput>
}
