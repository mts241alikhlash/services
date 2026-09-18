import { Injectable } from '@nestjs/common'
import { Occupation, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  OccupationQueryInput,
  CreateOccupationRepositoryInput,
  UpdateOccupationRepositoryInput,
} from '../../../domain/repositories/occupation.repository.js'
import { IOccupationRepository } from '../../../domain/repositories/occupation.repository.js'
import {
  OccupationEntity,
  OccupationWithCount,
} from '../../../domain/entities/occupation.entity.js'
import { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'
import { IParentLookupPort } from '../../../../../platform/parent-lookup/parent-lookup.port.js'

@Injectable()
export class PrismaOccupationRepository implements IOccupationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parentLookup: IParentLookupPort,
  ) {}

  async findAll(
    query: OccupationQueryInput,
  ): Promise<PaginatedResult<OccupationWithCount>> {
    const { page = 1, limit = 10, search, isActive } = query
    const skip = (page - 1) * limit

    const where: Prisma.OccupationWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.occupation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.occupation.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string): Promise<OccupationWithCount | null> {
    return this.prisma.occupation.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findManyByIds(ids: string[]): Promise<Occupation[]> {
    if (ids.length === 0) return []
    return this.prisma.occupation.findMany({
      where: { id: { in: ids }, deletedAt: null },
    })
  }

  async findByName(
    name: string,
    excludeId?: string,
  ): Promise<OccupationEntity | null> {
    return this.prisma.occupation.findFirst({
      where: {
        deletedAt: null,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async create(
    dto: CreateOccupationRepositoryInput,
  ): Promise<OccupationEntity> {
    return this.prisma.occupation.create({
      data: dto,
    })
  }

  async update(
    id: string,
    dto: UpdateOccupationRepositoryInput,
  ): Promise<OccupationEntity> {
    return this.prisma.occupation.update({
      where: { id },
      data: dto,
    })
  }

  async remove(id: string): Promise<OccupationEntity> {
    return this.prisma.occupation.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async countParentsWithOccupation(id: string): Promise<number> {
    return this.parentLookup.countByOccupation(id)
  }

  async countActiveParents(id: string): Promise<number> {
    return this.countParentsWithOccupation(id)
  }
}
