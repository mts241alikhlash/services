import { Injectable } from '@nestjs/common'
import { Religion, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  CreateReligionRepositoryInput,
  UpdateReligionRepositoryInput,
  ReligionQueryInput,
  IReligionRepository,
} from '../../../domain/repositories/religion.repository.js'
import { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'

@Injectable()
export class PrismaReligionRepository extends IReligionRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(query: ReligionQueryInput): Promise<PaginatedResult<Religion>> {
    const { page = 1, limit = 10, search, isActive } = query
    const skip = (page - 1) * limit

    const where: Prisma.ReligionWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    }

    const [data, total] = await Promise.all([
      this.prisma.religion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.religion.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string): Promise<Religion | null> {
    return this.prisma.religion.findFirst({ where: { id, deletedAt: null } })
  }

  async findManyByIds(ids: string[]): Promise<Religion[]> {
    if (ids.length === 0) return []
    return this.prisma.religion.findMany({
      where: { id: { in: ids }, deletedAt: null },
    })
  }

  async findByName(name: string): Promise<Religion | null> {
    return this.prisma.religion.findFirst({ where: { name, deletedAt: null } })
  }

  async create(input: CreateReligionRepositoryInput): Promise<Religion> {
    return this.prisma.religion.create({
      data: { name: input.name, isActive: input.isActive ?? true },
    })
  }

  async update(
    id: string,
    input: UpdateReligionRepositoryInput,
  ): Promise<Religion> {
    return this.prisma.religion.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    })
  }

  async softDelete(id: string): Promise<Religion> {
    return this.prisma.religion.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    })
  }

  async countProfilesUsing(id: string): Promise<number> {
    return this.prisma.profile.count({ where: { religionId: id } })
  }
}
