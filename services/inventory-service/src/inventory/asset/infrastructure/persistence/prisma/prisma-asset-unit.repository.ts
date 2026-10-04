import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'
import { IAssetConditionLookupPort } from '../../../domain/repositories/condition-lookup.port.js'
import { IAssetLocationLookupPort } from '../../../domain/repositories/location-lookup.port.js'
import { IAssetStatusLookupPort } from '../../../domain/repositories/status-lookup.port.js'
import {
  IAssetUnitCapabilityPort,
  IAssetUnitMutationPort,
  IAssetUnitRepository,
} from '../../../domain/repositories/asset-unit.repository.js'
import type {
  AssetUnitCapabilityOutput,
  AssetUnitDetailsCapabilityOutput,
  AssetUnitQueryInput,
  AssetUnitRecordOutput,
  AssetUnitRepositoryOutput,
  CreateAssetUnitRepositoryInput,
  UpdateAssetUnitConditionRepositoryInput,
  UpdateAssetUnitRepositoryInput,
  UpdateAssetUnitStatusesRepositoryInput,
} from '../../../domain/repositories/asset-unit.repository.js'
import {
  findAll as findAllUnits,
  findByAsset as findUnitsByAsset,
  findByBarcode as findUnitByBarcode,
  findById as findUnitById,
  findByIds as findUnitsByIds,
  findByUnitCode as findUnitByUnitCode,
  findDetailsByIds as findUnitDetailsByIds,
  findLatestUnit as findLatestAssetUnit,
  findLiveIds as findLiveAssetUnitIds,
  type AssetUnitRepositoryDependencies,
} from './prisma-asset-unit.reader.js'
import {
  create as createUnit,
  createMany as createUnits,
  remove as removeUnit,
  softDelete as softDeleteUnit,
  update as updateUnit,
  updateCondition as updateUnitCondition,
  updateStatuses as updateUnitStatuses,
} from './prisma-asset-unit.writer.js'

@Injectable()
export class PrismaAssetUnitRepository
  extends IAssetUnitRepository
  implements IAssetUnitCapabilityPort, IAssetUnitMutationPort
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetRepository: IAssetRepository,
    private readonly conditionLookup: IAssetConditionLookupPort,
    private readonly statusLookup: IAssetStatusLookupPort,
    private readonly locationLookup: IAssetLocationLookupPort,
  ) {
    super()
  }

  private dependencies(): AssetUnitRepositoryDependencies {
    return {
      prisma: this.prisma,
      assetRepository: this.assetRepository,
      conditionLookup: this.conditionLookup,
      statusLookup: this.statusLookup,
      locationLookup: this.locationLookup,
    }
  }

  findAll(
    query: AssetUnitQueryInput,
  ): Promise<
    import('../../../../../shared/domain/interfaces/repository.interface.js').PaginatedResult<AssetUnitRepositoryOutput>
  > {
    return findAllUnits(this.dependencies(), query)
  }

  findById(id: string): Promise<AssetUnitRepositoryOutput | null> {
    return findUnitById(this.dependencies(), id)
  }

  findByUnitCode(
    unitCode: string,
    excludeId?: string,
  ): Promise<AssetUnitRecordOutput | null> {
    return findUnitByUnitCode(this.dependencies(), unitCode, excludeId)
  }

  findByBarcode(
    barcode: string,
    excludeId?: string,
  ): Promise<AssetUnitRecordOutput | null> {
    return findUnitByBarcode(this.dependencies(), barcode, excludeId)
  }

  findByAsset(assetId: string): Promise<AssetUnitRepositoryOutput[]> {
    return findUnitsByAsset(this.dependencies(), assetId)
  }

  findByIds(ids: string[]): Promise<AssetUnitCapabilityOutput[]> {
    return findUnitsByIds(this.dependencies(), ids)
  }

  findLatestUnit(assetId: string): Promise<AssetUnitRecordOutput | null> {
    return findLatestAssetUnit(this.dependencies(), assetId)
  }

  findDetailsByIds(ids: string[]): Promise<AssetUnitDetailsCapabilityOutput[]> {
    return findUnitDetailsByIds(this.dependencies(), ids)
  }

  findLiveIds(ids?: string[]): Promise<string[]> {
    return findLiveAssetUnitIds(this.dependencies(), ids)
  }

  create(
    input: CreateAssetUnitRepositoryInput,
  ): Promise<AssetUnitRepositoryOutput> {
    return createUnit(this.dependencies(), input)
  }

  createMany(inputs: CreateAssetUnitRepositoryInput[]): Promise<number> {
    return createUnits(this.dependencies(), inputs)
  }

  update(
    id: string,
    input: UpdateAssetUnitRepositoryInput,
  ): Promise<AssetUnitRepositoryOutput> {
    return updateUnit(this.dependencies(), id, input)
  }

  remove(id: string): Promise<AssetUnitRecordOutput> {
    return removeUnit(this.dependencies(), id)
  }

  softDelete(id: string): Promise<AssetUnitRecordOutput> {
    return softDeleteUnit(this.dependencies(), id)
  }

  updateStatuses(input: UpdateAssetUnitStatusesRepositoryInput): Promise<void> {
    return updateUnitStatuses(this.dependencies(), input)
  }

  updateCondition(
    input: UpdateAssetUnitConditionRepositoryInput,
  ): Promise<void> {
    return updateUnitCondition(this.dependencies(), input)
  }
}
