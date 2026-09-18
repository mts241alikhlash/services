import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../../core/database/prisma.service.js'
import {
  CategoryCreateRepositoryInput,
  CategoryRepositoryOutput,
  CategoryUpdateRepositoryInput,
  ICategoryRepository,
} from '../../../domain/repositories/category.repository.js'

function mapCategory(category: {
  id: string
  code: string
  name: string
  parentId: string | null
  depreciationRatePercent: { toString(): string }
  createdAt: Date
}): CategoryRepositoryOutput {
  return {
    id: category.id,
    code: category.code,
    name: category.name,
    parentId: category.parentId,
    depreciationRatePercent: category.depreciationRatePercent.toString(),
    createdAt: category.createdAt,
  }
}

@Injectable()
export class PrismaCategoryRepository extends ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findMany(search?: string): Promise<CategoryRepositoryOutput[]> {
    const where: Prisma.InventoryCategoryWhereInput = {}
    if (search && search.trim() !== '') {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }
    const categories = await this.prisma.inventoryCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    return categories.map(mapCategory)
  }

  async findById(id: string): Promise<CategoryRepositoryOutput | null> {
    const category = await this.prisma.inventoryCategory.findUnique({
      where: { id },
    })
    return category ? mapCategory(category) : null
  }

  async create(
    data: CategoryCreateRepositoryInput,
  ): Promise<CategoryRepositoryOutput> {
    const prismaData: Prisma.InventoryCategoryCreateInput = {
      code: data.code,
      name: data.name,
      depreciationRatePercent: data.depreciationRatePercent,
    }
    const category = await this.prisma.inventoryCategory.create({
      data: prismaData,
    })
    return mapCategory(category)
  }

  async update(
    id: string,
    data: CategoryUpdateRepositoryInput,
  ): Promise<CategoryRepositoryOutput> {
    const prismaData: Prisma.InventoryCategoryUpdateInput = {
      code: data.code,
      name: data.name,
      depreciationRatePercent: data.depreciationRatePercent,
    }
    const category = await this.prisma.inventoryCategory.update({
      where: { id },
      data: prismaData,
    })
    return mapCategory(category)
  }

  async delete(id: string): Promise<CategoryRepositoryOutput> {
    const category = await this.prisma.inventoryCategory.delete({
      where: { id },
    })
    return mapCategory(category)
  }
}
