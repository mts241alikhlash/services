import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../../core/database/prisma.service.js'
import {
  ILocationRepository,
  LocationCreateRepositoryInput,
  LocationRepositoryOutput,
  LocationUpdateRepositoryInput,
} from '../../../domain/repositories/location.repository.js'

function mapLocation(location: {
  id: string
  code: string
  name: string
  building: string | null
  room: string | null
  rack: string | null
  description: string | null
  createdAt: Date
}): LocationRepositoryOutput {
  return {
    id: location.id,
    code: location.code,
    name: location.name,
    building: location.building,
    room: location.room,
    rack: location.rack,
    description: location.description,
    createdAt: location.createdAt,
  }
}

@Injectable()
export class PrismaLocationRepository extends ILocationRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findMany(search?: string): Promise<LocationRepositoryOutput[]> {
    const where: Prisma.InventoryLocationWhereInput = {}
    if (search && search.trim() !== '') {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }
    const locations = await this.prisma.inventoryLocation.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    return locations.map(mapLocation)
  }

  async findById(id: string): Promise<LocationRepositoryOutput | null> {
    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id },
    })
    return location ? mapLocation(location) : null
  }

  async create(
    data: LocationCreateRepositoryInput,
  ): Promise<LocationRepositoryOutput> {
    const prismaData: Prisma.InventoryLocationCreateInput = {
      code: data.code,
      name: data.name,
      building: data.building,
      room: data.room,
      rack: data.rack,
      description: data.description,
    }
    const location = await this.prisma.inventoryLocation.create({
      data: prismaData,
    })
    return mapLocation(location)
  }

  async update(
    id: string,
    data: LocationUpdateRepositoryInput,
  ): Promise<LocationRepositoryOutput> {
    const prismaData: Prisma.InventoryLocationUpdateInput = {
      code: data.code,
      name: data.name,
      building: data.building,
      room: data.room,
      rack: data.rack,
      description: data.description,
    }
    const location = await this.prisma.inventoryLocation.update({
      where: { id },
      data: prismaData,
    })
    return mapLocation(location)
  }

  async delete(id: string): Promise<LocationRepositoryOutput> {
    const location = await this.prisma.inventoryLocation.delete({
      where: { id },
    })
    return mapLocation(location)
  }
}
