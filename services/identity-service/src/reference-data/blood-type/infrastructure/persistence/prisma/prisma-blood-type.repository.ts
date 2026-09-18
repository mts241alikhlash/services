import { Injectable } from '@nestjs/common'
import { BloodType, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  CreateBloodTypeRepositoryInput,
  UpdateBloodTypeRepositoryInput,
  BloodTypeQueryInput,
  IBloodTypeRepository,
} from '../../../domain/repositories/blood-type.repository.js'
import { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'

@Injectable()
export class PrismaBloodTypeRepository extends IBloodTypeRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(
    query: BloodTypeQueryInput,
  ): Promise<PaginatedResult<BloodType>> {
    const { page = 1, limit = 10, search, isActive } = query
    const skip = (page - 1) * limit

    const where: Prisma.BloodTypeWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    }

    const [data, total] = await Promise.all([
      this.prisma.bloodType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.bloodType.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string): Promise<BloodType | null> {
    return this.prisma.bloodType.findFirst({ where: { id, deletedAt: null } })
  }

  async findManyByIds(ids: string[]): Promise<BloodType[]> {
    if (ids.length === 0) return []
    return this.prisma.bloodType.findMany({
      where: { id: { in: ids }, deletedAt: null },
    })
  }

  async findByName(name: string): Promise<BloodType | null> {
    return this.prisma.bloodType.findFirst({ where: { name, deletedAt: null } })
  }

  async create(input: CreateBloodTypeRepositoryInput): Promise<BloodType> {
    return this.prisma.bloodType.create({
      data: { name: input.name, isActive: input.isActive ?? true },
    })
  }

  async update(
    id: string,
    input: UpdateBloodTypeRepositoryInput,
  ): Promise<BloodType> {
    return this.prisma.bloodType.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    })
  }

  async softDelete(id: string): Promise<BloodType> {
    return this.prisma.bloodType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    })
  }

  async countProfilesUsing(id: string): Promise<number> {
    return this.prisma.profile.count({ where: { bloodTypeId: id } })
  }
}
