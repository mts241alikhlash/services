import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  PositionQueryInput,
  CreatePositionRepositoryInput,
  UpdatePositionRepositoryInput,
} from '../../../domain/repositories/position.repository.js'
import { IPositionRepository } from '../../../domain/repositories/position.repository.js'
import { POSITION_WITH_CATEGORY_INCLUDE } from './prisma-position.includes.js'
import {
  PositionEntity,
  PositionWithCategory,
} from '../../../domain/entities/position.entity.js'
import { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'

@Injectable()
export class PrismaPositionRepository implements IPositionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: PositionQueryInput,
  ): Promise<PaginatedResult<PositionWithCategory>> {
    const { page = 1, limit = 10, search, categoryId, isActive } = query
    const skip = (page - 1) * limit

    const where: Prisma.PositionWhereInput = {
      deletedAt: null,
      ...(categoryId && { categoryId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        include: POSITION_WITH_CATEGORY_INCLUDE,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.position.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string): Promise<PositionWithCategory | null> {
    return this.prisma.position.findFirst({
      where: { id, deletedAt: null },
      include: POSITION_WITH_CATEGORY_INCLUDE,
    })
  }

  async findByName(
    name: string,
    excludeId?: string,
  ): Promise<PositionEntity | null> {
    return this.prisma.position.findFirst({
      where: {
        deletedAt: null,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async findByCode(
    code: string,
    excludeId?: string,
  ): Promise<PositionEntity | null> {
    return this.findByName(code, excludeId)
  }

  async create(
    dto: CreatePositionRepositoryInput,
  ): Promise<PositionWithCategory> {
    return this.prisma.position.create({
      data: dto,
      include: POSITION_WITH_CATEGORY_INCLUDE,
    })
  }

  async update(
    id: string,
    dto: UpdatePositionRepositoryInput,
  ): Promise<PositionWithCategory> {
    return this.prisma.position.update({
      where: { id },
      data: dto,
      include: POSITION_WITH_CATEGORY_INCLUDE,
    })
  }

  async remove(id: string): Promise<PositionEntity> {
    return this.prisma.position.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async countEmployeesWithPosition(id: string): Promise<number> {
    return this.prisma.employeePosition.count({
      where: { positionId: id, deletedAt: null },
    })
  }

  async countActiveAssignments(id: string): Promise<number> {
    return this.countEmployeesWithPosition(id)
  }
}
