import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  EmploymentTypeQueryInput,
  CreateEmploymentTypeRepositoryInput,
  UpdateEmploymentTypeRepositoryInput,
} from '../../../domain/repositories/employment-type.repository.js'
import { IEmploymentTypeRepository } from '../../../domain/repositories/employment-type.repository.js'
import { EmploymentTypeEntity } from '../../../domain/entities/employment-type.entity.js'
import { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'

@Injectable()
export class PrismaEmploymentTypeRepository implements IEmploymentTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: EmploymentTypeQueryInput,
  ): Promise<PaginatedResult<EmploymentTypeEntity>> {
    const { page = 1, limit = 10, search } = query
    const skip = (page - 1) * limit

    const where: Prisma.EmploymentTypeWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.employmentType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      this.prisma.employmentType.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string): Promise<EmploymentTypeEntity | null> {
    return this.prisma.employmentType.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findByCode(
    code: string,
    excludeId?: string,
  ): Promise<EmploymentTypeEntity | null> {
    return this.prisma.employmentType.findFirst({
      where: {
        deletedAt: null,
        code: { equals: code, mode: 'insensitive' },
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async create(
    dto: CreateEmploymentTypeRepositoryInput,
  ): Promise<EmploymentTypeEntity> {
    return this.prisma.employmentType.create({
      data: dto,
    })
  }

  async update(
    id: string,
    dto: UpdateEmploymentTypeRepositoryInput,
  ): Promise<EmploymentTypeEntity> {
    return this.prisma.employmentType.update({
      where: { id },
      data: dto,
    })
  }

  async remove(id: string): Promise<EmploymentTypeEntity> {
    return this.prisma.employmentType.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async countEmployeesWithEmploymentType(id: string): Promise<number> {
    return this.prisma.employee.count({
      where: { employmentTypeId: id, deletedAt: null },
    })
  }
}
