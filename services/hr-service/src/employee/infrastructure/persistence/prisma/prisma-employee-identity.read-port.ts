import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  IEmployeeIdentityReadPort,
  EmployeeRefRow,
} from '../../../domain/repositories/employee-identity-read.port.js'

@Injectable()
export class PrismaEmployeeIdentityReadPort extends IEmployeeIdentityReadPort {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findEmployeeIdByUserId(userId: string): Promise<string | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    })
    return employee?.id ?? null
  }

  async listRefsByIds(ids: string[]): Promise<EmployeeRefRow[]> {
    if (ids.length === 0) return []
    return this.prisma.employee.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, userId: true, nip: true },
    })
  }

  async employeeExists(id: string): Promise<boolean> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    return employee !== null
  }

  async listRosterUserIds(): Promise<string[]> {
    const employees = await this.prisma.employee.findMany({
      where: { deletedAt: null },
      select: { userId: true },
    })
    return employees.map((employee) => employee.userId)
  }
}
