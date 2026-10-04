import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  CreateSchoolUnitTypeRepositoryInput,
  ISchoolUnitTypeRepository,
  UpdateSchoolUnitTypeRepositoryInput,
} from '../../../domain/repositories/school-unit-type.repository.js'

@Injectable()
export class PrismaSchoolUnitTypeRepository extends ISchoolUnitTypeRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll() {
    return this.prisma.schoolUnitType.findMany({
      orderBy: { code: 'asc' },
    })
  }

  async findById(id: string) {
    return this.prisma.schoolUnitType.findUnique({
      where: { id },
    })
  }

  async findByCode(code: string, excludeId?: string) {
    return this.prisma.schoolUnitType.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async create(input: CreateSchoolUnitTypeRepositoryInput) {
    return this.prisma.schoolUnitType.create({
      data: input,
    })
  }

  async update(id: string, input: UpdateSchoolUnitTypeRepositoryInput) {
    return this.prisma.schoolUnitType.update({
      where: { id },
      data: input,
    })
  }

  async remove(id: string) {
    return this.prisma.schoolUnitType.delete({
      where: { id },
    })
  }

  async countSchoolUnitsWithType(id: string) {
    return this.prisma.schoolUnit.count({
      where: { typeId: id, deletedAt: null },
    })
  }
}
