import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  PositionCategoryQueryInput,
  CreatePositionCategoryRepositoryInput,
  UpdatePositionCategoryRepositoryInput,
} from '../../../domain/repositories/position-category.repository.js'
import { IPositionCategoryRepository } from '../../../domain/repositories/position-category.repository.js'
import { PositionCategoryEntity } from '../../../domain/entities/position-category.entity.js'
import { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'

@Injectable()
export class PrismaPositionCategoryRepository implements IPositionCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query?: PositionCategoryQueryInput,
  ): Promise<PaginatedResult<PositionCategoryEntity>> {
    const page = query?.page ?? 1
    const limit = query?.limit ?? 10
    const skip = (page - 1) * limit
    const search = query?.search

    const where: Prisma.PositionCategoryWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.positionCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      this.prisma.positionCategory.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string): Promise<PositionCategoryEntity | null> {
    return this.prisma.positionCategory.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findByCode(
    code: string,
    excludeId?: string,
  ): Promise<PositionCategoryEntity | null> {
    return this.prisma.positionCategory.findFirst({
      where: {
        deletedAt: null,
        code: { equals: code, mode: 'insensitive' },
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async create(
    dto: CreatePositionCategoryRepositoryInput,
  ): Promise<PositionCategoryEntity> {
    return this.prisma.positionCategory.create({
      data: dto,
    })
  }

  async update(
    id: string,
    dto: UpdatePositionCategoryRepositoryInput,
  ): Promise<PositionCategoryEntity> {
    return this.prisma.positionCategory.update({
      where: { id },
      data: dto,
    })
  }

  async remove(id: string): Promise<PositionCategoryEntity> {
    return this.prisma.positionCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async countPositionsWithCategory(id: string): Promise<number> {
    return this.prisma.position.count({
      where: { categoryId: id, deletedAt: null },
    })
  }
}
