import { Injectable } from '@nestjs/common'
import {
  InventoryStatusKey as PrismaInventoryStatusKey,
  Prisma,
} from '@prisma/client'
import { PrismaService } from '../../../../../../core/database/prisma.service.js'
import { InventoryStatusKey } from '../../../../../../shared/domain/enums/inventory-status-key.enum.js'
import {
  IStatusRepository,
  StatusCreateRepositoryInput,
  StatusRepositoryOutput,
  StatusUpdateRepositoryInput,
} from '../../../domain/repositories/status.repository.js'

const prismaStatusKeyByDomainKey: Record<
  `${InventoryStatusKey}`,
  PrismaInventoryStatusKey
> = {
  AVAILABLE: PrismaInventoryStatusKey.AVAILABLE,
  LOAN_PENDING: PrismaInventoryStatusKey.LOAN_PENDING,
  LOAN_APPROVED: PrismaInventoryStatusKey.LOAN_APPROVED,
  LOANED: PrismaInventoryStatusKey.LOANED,
  LOAN_RETURNED: PrismaInventoryStatusKey.LOAN_RETURNED,
  LOAN_REJECTED: PrismaInventoryStatusKey.LOAN_REJECTED,
}

const domainStatusKeyByPrismaKey: Record<
  PrismaInventoryStatusKey,
  InventoryStatusKey
> = {
  AVAILABLE: InventoryStatusKey.AVAILABLE,
  LOAN_PENDING: InventoryStatusKey.LOAN_PENDING,
  LOAN_APPROVED: InventoryStatusKey.LOAN_APPROVED,
  LOANED: InventoryStatusKey.LOANED,
  LOAN_RETURNED: InventoryStatusKey.LOAN_RETURNED,
  LOAN_REJECTED: InventoryStatusKey.LOAN_REJECTED,
}

function mapSystemKeyToPrisma(
  systemKey: `${InventoryStatusKey}` | null | undefined,
): PrismaInventoryStatusKey | null | undefined {
  return systemKey === null || systemKey === undefined
    ? systemKey
    : prismaStatusKeyByDomainKey[systemKey]
}

function mapSystemKeyToDomain(
  systemKey: PrismaInventoryStatusKey | null,
): InventoryStatusKey | null {
  return systemKey === null ? null : domainStatusKeyByPrismaKey[systemKey]
}

function mapStatus(status: {
  id: string
  code: string
  name: string
  allowTransactions: boolean
  systemKey: PrismaInventoryStatusKey | null
  createdAt: Date
}): StatusRepositoryOutput {
  return {
    id: status.id,
    code: status.code,
    name: status.name,
    allowTransactions: status.allowTransactions,
    systemKey: mapSystemKeyToDomain(status.systemKey),
    createdAt: status.createdAt,
  }
}

@Injectable()
export class PrismaStatusRepository extends IStatusRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findMany(search?: string): Promise<StatusRepositoryOutput[]> {
    const where: Prisma.InventoryStatusWhereInput = {}
    if (search && search.trim() !== '') {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }
    const statuses = await this.prisma.inventoryStatus.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    return statuses.map(mapStatus)
  }

  async findById(id: string): Promise<StatusRepositoryOutput | null> {
    const status = await this.prisma.inventoryStatus.findUnique({
      where: { id },
    })
    return status ? mapStatus(status) : null
  }

  async findBySystemKey(key: string): Promise<{ id: string } | null> {
    const status = await this.prisma.inventoryStatus.findUnique({
      where: { systemKey: key as PrismaInventoryStatusKey },
      select: { id: true },
    })
    return status
  }

  async findIdsAllowingTransactions(): Promise<string[]> {
    const statuses = await this.prisma.inventoryStatus.findMany({
      where: { allowTransactions: true },
      select: { id: true },
    })
    return statuses.map(({ id }) => id)
  }

  async create(
    data: StatusCreateRepositoryInput,
  ): Promise<StatusRepositoryOutput> {
    const prismaData: Prisma.InventoryStatusCreateInput = {
      code: data.code,
      name: data.name,
      allowTransactions: data.allowTransactions,
      systemKey: mapSystemKeyToPrisma(data.systemKey),
    }
    const status = await this.prisma.inventoryStatus.create({
      data: prismaData,
    })
    return mapStatus(status)
  }

  async update(
    id: string,
    data: StatusUpdateRepositoryInput,
  ): Promise<StatusRepositoryOutput> {
    const prismaData: Prisma.InventoryStatusUpdateInput = {
      code: data.code,
      name: data.name,
      allowTransactions: data.allowTransactions,
      systemKey: mapSystemKeyToPrisma(data.systemKey),
    }
    const status = await this.prisma.inventoryStatus.update({
      where: { id },
      data: prismaData,
    })
    return mapStatus(status)
  }

  async delete(id: string): Promise<StatusRepositoryOutput> {
    const status = await this.prisma.inventoryStatus.delete({
      where: { id },
    })
    return mapStatus(status)
  }
}
