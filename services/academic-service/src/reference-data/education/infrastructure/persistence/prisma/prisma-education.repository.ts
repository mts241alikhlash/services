import { Injectable } from '@nestjs/common'
import { Education, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  EducationQueryInput,
  IEducationRepository,
} from '../../../domain/repositories/education.repository.js'
import { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'

@Injectable()
export class PrismaEducationRepository extends IEducationRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(
    query: EducationQueryInput,
  ): Promise<PaginatedResult<Education>> {
    const { page = 1, limit = 10, search, isActive } = query
    const skip = (page - 1) * limit

    const where: Prisma.EducationWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    }

    const [data, total] = await Promise.all([
      this.prisma.education.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.education.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string): Promise<Education | null> {
    return this.prisma.education.findFirst({ where: { id, deletedAt: null } })
  }

  async findManyByIds(ids: string[]): Promise<Education[]> {
    if (ids.length === 0) return []
    return this.prisma.education.findMany({
      where: { id: { in: ids }, deletedAt: null },
    })
  }
}
