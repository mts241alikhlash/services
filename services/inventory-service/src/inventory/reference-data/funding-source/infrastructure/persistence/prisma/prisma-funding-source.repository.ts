import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../../core/database/prisma.service.js'
import {
  FundingSourceCreateRepositoryInput,
  FundingSourceRepositoryOutput,
  FundingSourceUpdateRepositoryInput,
  IFundingSourceRepository,
} from '../../../domain/repositories/funding-source.repository.js'

type FundingSourceOutput = FundingSourceRepositoryOutput & {
  description: string | null
  createdAt: Date
}

function mapFundingSource(fundingSource: {
  id: string
  code: string
  name: string
  description: string | null
  createdAt: Date
}): FundingSourceOutput {
  return {
    id: fundingSource.id,
    code: fundingSource.code,
    name: fundingSource.name,
    description: fundingSource.description,
    createdAt: fundingSource.createdAt,
  }
}

@Injectable()
export class PrismaFundingSourceRepository extends IFundingSourceRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findMany(search?: string): Promise<FundingSourceRepositoryOutput[]> {
    const where: Prisma.InventoryFundingSourceWhereInput = {}
    if (search && search.trim() !== '') {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }
    const fundingSources = await this.prisma.inventoryFundingSource.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    return fundingSources.map(mapFundingSource)
  }

  async findById(id: string): Promise<FundingSourceRepositoryOutput | null> {
    const fundingSource = await this.prisma.inventoryFundingSource.findUnique({
      where: { id },
    })
    return fundingSource ? mapFundingSource(fundingSource) : null
  }

  async create(
    data: FundingSourceCreateRepositoryInput,
  ): Promise<FundingSourceRepositoryOutput> {
    const prismaData: Prisma.InventoryFundingSourceCreateInput = {
      code: data.code,
      name: data.name,
      description: data.description,
    }
    const fundingSource = await this.prisma.inventoryFundingSource.create({
      data: prismaData,
    })
    return mapFundingSource(fundingSource)
  }

  async update(
    id: string,
    data: FundingSourceUpdateRepositoryInput,
  ): Promise<FundingSourceRepositoryOutput> {
    const prismaData: Prisma.InventoryFundingSourceUpdateInput = {
      code: data.code,
      name: data.name,
      description: data.description,
    }
    const fundingSource = await this.prisma.inventoryFundingSource.update({
      where: { id },
      data: prismaData,
    })
    return mapFundingSource(fundingSource)
  }

  async delete(id: string): Promise<FundingSourceRepositoryOutput> {
    const fundingSource = await this.prisma.inventoryFundingSource.delete({
      where: { id },
    })
    return mapFundingSource(fundingSource)
  }
}
