import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../../core/database/prisma.service.js'
import {
  ConditionCreateRepositoryInput,
  ConditionRepositoryOutput,
  ConditionUpdateRepositoryInput,
  IConditionRepository,
} from '../../../domain/repositories/condition.repository.js'

function mapCondition(condition: {
  id: string
  code: string
  name: string
  isUsable: boolean
  createdAt: Date
}): ConditionRepositoryOutput {
  return {
    id: condition.id,
    code: condition.code,
    name: condition.name,
    isUsable: condition.isUsable,
    createdAt: condition.createdAt,
  }
}

@Injectable()
export class PrismaConditionRepository extends IConditionRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findMany(search?: string): Promise<ConditionRepositoryOutput[]> {
    const where: Prisma.InventoryConditionWhereInput = {}
    if (search && search.trim() !== '') {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }
    const conditions = await this.prisma.inventoryCondition.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    return conditions.map(mapCondition)
  }

  async findById(id: string): Promise<ConditionRepositoryOutput | null> {
    const condition = await this.prisma.inventoryCondition.findUnique({
      where: { id },
    })
    return condition ? mapCondition(condition) : null
  }

  async create(
    data: ConditionCreateRepositoryInput,
  ): Promise<ConditionRepositoryOutput> {
    const prismaData: Prisma.InventoryConditionCreateInput = {
      code: data.code,
      name: data.name,
      isUsable: data.isUsable,
    }
    const condition = await this.prisma.inventoryCondition.create({
      data: prismaData,
    })
    return mapCondition(condition)
  }

  async update(
    id: string,
    data: ConditionUpdateRepositoryInput,
  ): Promise<ConditionRepositoryOutput> {
    const prismaData: Prisma.InventoryConditionUpdateInput = {
      code: data.code,
      name: data.name,
      isUsable: data.isUsable,
    }
    const condition = await this.prisma.inventoryCondition.update({
      where: { id },
      data: prismaData,
    })
    return mapCondition(condition)
  }

  async delete(id: string): Promise<ConditionRepositoryOutput> {
    const condition = await this.prisma.inventoryCondition.delete({
      where: { id },
    })
    return mapCondition(condition)
  }
}
