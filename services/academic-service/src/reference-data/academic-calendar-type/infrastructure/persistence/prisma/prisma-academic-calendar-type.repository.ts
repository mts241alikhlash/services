import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  AcademicCalendarTypeQueryInput,
  CreateAcademicCalendarTypeRepositoryInput,
  IAcademicCalendarTypeRepository,
  UpdateAcademicCalendarTypeRepositoryInput,
} from '../../../domain/repositories/academic-calendar-type.repository.js'
import { AcademicCalendarTypeEntity } from '../../../domain/entities/academic-calendar-type.entity.js'
import { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'

@Injectable()
export class PrismaAcademicCalendarTypeRepository implements IAcademicCalendarTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: AcademicCalendarTypeQueryInput,
  ): Promise<PaginatedResult<AcademicCalendarTypeEntity>> {
    const { page = 1, limit = 10, search, isActive } = query
    const skip = (page - 1) * limit

    const where: Prisma.AcademicCalendarTypeWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    }

    const [data, total] = await Promise.all([
      this.prisma.academicCalendarType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.academicCalendarType.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string): Promise<AcademicCalendarTypeEntity | null> {
    return this.prisma.academicCalendarType.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findByName(
    name: string,
    excludeId?: string,
  ): Promise<AcademicCalendarTypeEntity | null> {
    return this.prisma.academicCalendarType.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
  }

  async create(
    data: CreateAcademicCalendarTypeRepositoryInput,
  ): Promise<AcademicCalendarTypeEntity> {
    return this.prisma.academicCalendarType.create({
      data: {
        name: data.name,
        isActive: data.isActive ?? true,
      },
    })
  }

  async update(
    id: string,
    data: UpdateAcademicCalendarTypeRepositoryInput,
  ): Promise<AcademicCalendarTypeEntity> {
    return this.prisma.academicCalendarType.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })
  }

  async softDelete(id: string): Promise<AcademicCalendarTypeEntity> {
    return this.prisma.academicCalendarType.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
