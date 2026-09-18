import { Injectable } from '@nestjs/common'
import { Prisma, SemesterType } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  CreateSemesterTypeRepositoryInput,
  ISemesterTypeRepository,
  SemesterTypeQueryInput,
  UpdateSemesterTypeRepositoryInput,
} from '../../../domain/repositories/semester-type.repository.js'
import { SemesterTypeEntity } from '../../../domain/entities/semester-type.entity.js'
import { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'

@Injectable()
export class PrismaSemesterTypeRepository extends ISemesterTypeRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(
    query: SemesterTypeQueryInput,
  ): Promise<PaginatedResult<SemesterTypeEntity>> {
    const { page = 1, limit = 10, search, isActive } = query
    const skip = (page - 1) * limit

    const where: Prisma.SemesterTypeWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    }

    const [data, total] = await Promise.all([
      this.prisma.semesterType.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sequence: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.semesterType.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string): Promise<SemesterType | null> {
    return this.prisma.semesterType.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findByName(name: string): Promise<SemesterType | null> {
    return this.prisma.semesterType.findFirst({
      where: { name, deletedAt: null },
    })
  }

  async create(
    data: CreateSemesterTypeRepositoryInput,
  ): Promise<SemesterTypeEntity> {
    return this.prisma.semesterType.create({
      data: {
        name: data.name,
        ...(data.sequence !== undefined && { sequence: data.sequence }),
        isActive: data.isActive ?? true,
      },
    })
  }

  async update(
    id: string,
    data: UpdateSemesterTypeRepositoryInput,
  ): Promise<SemesterTypeEntity> {
    return this.prisma.semesterType.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sequence !== undefined && { sequence: data.sequence }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })
  }

  async softDelete(id: string): Promise<SemesterTypeEntity> {
    return this.prisma.semesterType.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async remove(id: string): Promise<SemesterTypeEntity> {
    return this.softDelete(id)
  }

  async delete(id: string): Promise<SemesterTypeEntity> {
    return this.softDelete(id)
  }

  async hasRelatedData(id: string): Promise<boolean> {
    const count = await this.prisma.semester.count({
      where: { typeId: id, deletedAt: null },
      take: 1,
    })
    return count > 0
  }
}
