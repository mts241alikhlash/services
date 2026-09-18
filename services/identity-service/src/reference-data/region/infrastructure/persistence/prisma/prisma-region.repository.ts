import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  IRegionRepository,
  RegionEntity,
} from '../../../domain/repositories/region.repository.js'

const REGION_SELECT = {
  code: true,
  name: true,
  level: true,
  parentCode: true,
} satisfies Prisma.RegionSelect

type RegionRow = Prisma.RegionGetPayload<{ select: typeof REGION_SELECT }>

function toRegion(row: RegionRow): RegionEntity {
  return row
}

@Injectable()
export class PrismaRegionRepository extends IRegionRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findProvinces(): Promise<RegionEntity[]> {
    const rows = await this.prisma.region.findMany({
      where: { level: 'PROVINCE' },
      select: REGION_SELECT,
      orderBy: { name: 'asc' },
    })
    return rows.map(toRegion)
  }

  async findChildren(parentCode: string): Promise<RegionEntity[]> {
    const rows = await this.prisma.region.findMany({
      where: { parentCode },
      select: REGION_SELECT,
      orderBy: { name: 'asc' },
    })
    return rows.map(toRegion)
  }

  async findByCodes(codes: string[]): Promise<RegionEntity[]> {
    if (codes.length === 0) return []
    const rows = await this.prisma.region.findMany({
      where: { code: { in: codes } },
      select: REGION_SELECT,
    })
    return rows.map(toRegion)
  }
}
