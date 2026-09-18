import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'
import type {
  AssetCategoryOutput,
  AssetLatestOutput,
  AssetQueryInput,
  AssetRecordOutput,
  AssetReferenceOutput,
  AssetRepositoryOutput,
  CreateAssetRepositoryInput,
  UpdateAssetRepositoryInput,
} from '../../../domain/repositories/asset.repository.js'
import { IAssetCategoryLookupPort } from '../../../domain/repositories/category-lookup.port.js'
import { IAssetConditionLookupPort } from '../../../domain/repositories/condition-lookup.port.js'
import { IAssetFundingSourceLookupPort } from '../../../domain/repositories/funding-source-lookup.port.js'
import { IAssetLocationLookupPort } from '../../../domain/repositories/location-lookup.port.js'
import { IAssetStatusLookupPort } from '../../../domain/repositories/status-lookup.port.js'
import {
  countAssetUnits,
  findAllAssets,
  findAssetByCode,
  findAssetById,
  findAssetCategoryById,
  findAssetReferenceById,
  findLatestAssetByPrefix,
  type AssetRepositoryDependencies,
} from './prisma-asset.reader.js'
import {
  createAsset,
  removeAsset,
  softDeleteAsset,
  updateAsset,
} from './prisma-asset.writer.js'

@Injectable()
export class PrismaAssetRepository extends IAssetRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryLookup: IAssetCategoryLookupPort,
    private readonly fundingSourceLookup: IAssetFundingSourceLookupPort,
    private readonly conditionLookup: IAssetConditionLookupPort,
    private readonly statusLookup: IAssetStatusLookupPort,
    private readonly locationLookup: IAssetLocationLookupPort,
  ) {
    super()
  }

  private dependencies(): AssetRepositoryDependencies {
    return {
      prisma: this.prisma,
      categoryLookup: this.categoryLookup,
      fundingSourceLookup: this.fundingSourceLookup,
      conditionLookup: this.conditionLookup,
      statusLookup: this.statusLookup,
      locationLookup: this.locationLookup,
    }
  }

  findAll(
    query: AssetQueryInput,
  ): Promise<PaginatedResult<AssetRepositoryOutput>> {
    return findAllAssets(this.dependencies(), query)
  }

  findById(id: string): Promise<AssetRepositoryOutput | null> {
    return findAssetById(this.dependencies(), id)
  }

  findReferenceById(id: string): Promise<AssetReferenceOutput | null> {
    return findAssetReferenceById(this.dependencies(), id)
  }

  findByCode(
    code: string,
    excludeId?: string,
  ): Promise<AssetRecordOutput | null> {
    return findAssetByCode(this.dependencies(), code, excludeId)
  }

  findCategoryById(id: string): Promise<AssetCategoryOutput | null> {
    return findAssetCategoryById(this.dependencies(), id)
  }

  findLatestAssetByPrefix(prefix: string): Promise<AssetLatestOutput | null> {
    return findLatestAssetByPrefix(this.dependencies(), prefix)
  }

  countUnits(id: string): Promise<number> {
    return countAssetUnits(this.dependencies(), id)
  }

  create(input: CreateAssetRepositoryInput): Promise<AssetRepositoryOutput> {
    return createAsset(this.dependencies(), input)
  }

  update(
    id: string,
    input: UpdateAssetRepositoryInput,
  ): Promise<AssetRepositoryOutput> {
    return updateAsset(this.dependencies(), id, input)
  }

  remove(id: string): Promise<AssetRecordOutput> {
    return removeAsset(this.dependencies(), id)
  }

  softDelete(id: string): Promise<AssetRecordOutput> {
    return softDeleteAsset(this.dependencies(), id)
  }
}
