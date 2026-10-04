import { InventoryLocationEntity } from '../entities/location.entity.js'

export interface LocationCreateRepositoryInput {
  code: string
  name: string
  building?: string | null
  room?: string | null
  rack?: string | null
  description?: string | null
}

export interface LocationUpdateRepositoryInput {
  code?: string
  name?: string
  building?: string | null
  room?: string | null
  rack?: string | null
  description?: string | null
}

export type LocationRepositoryOutput = InventoryLocationEntity

export abstract class ILocationRepository {
  abstract findMany(search?: string): Promise<LocationRepositoryOutput[]>
  abstract findById(id: string): Promise<LocationRepositoryOutput | null>
  abstract create(
    data: LocationCreateRepositoryInput,
  ): Promise<LocationRepositoryOutput>
  abstract update(
    id: string,
    data: LocationUpdateRepositoryInput,
  ): Promise<LocationRepositoryOutput>
  abstract delete(id: string): Promise<LocationRepositoryOutput>
}
