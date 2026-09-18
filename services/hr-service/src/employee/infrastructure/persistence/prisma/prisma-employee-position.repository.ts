import { Injectable } from '@nestjs/common'
import { Position, EmployeePosition } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IEmployeePositionRepository } from '../../../domain/repositories/employee-position.repository.js'
import type {
  CreateEmployeePositionRepositoryInput,
  UpdateEmployeePositionRepositoryInput,
} from '../../../domain/repositories/employee-position.repository.js'
import {
  EMPLOYEE_POSITION_INCLUDE,
  EmployeePositionWithDetails,
} from './prisma-employee.includes.js'

@Injectable()
export class PrismaEmployeePositionRepository extends IEmployeePositionRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findByEmployeeId(
    employeeId: string,
  ): Promise<EmployeePositionWithDetails[]> {
    return this.prisma.employeePosition.findMany({
      where: { employeeId, position: { isActive: true } },
      include: EMPLOYEE_POSITION_INCLUDE,
      orderBy: [{ isPrimary: 'desc' }, { hireDate: 'desc' }],
    })
  }

  async findById(
    employeeId: string,
    positionId: string,
  ): Promise<EmployeePositionWithDetails | null> {
    return this.prisma.employeePosition.findFirst({
      where: { id: positionId, employeeId },
      include: EMPLOYEE_POSITION_INCLUDE,
    })
  }

  async findByEmployeeAndPosition(
    employeeId: string,
    positionId: string,
  ): Promise<EmployeePositionWithDetails | null> {
    return this.prisma.employeePosition.findFirst({
      where: { employeeId, positionId },
      include: EMPLOYEE_POSITION_INCLUDE,
    })
  }

  async findPositionById(positionId: string): Promise<Position | null> {
    return this.prisma.position.findUnique({ where: { id: positionId } })
  }

  async create(
    employeeId: string,
    dto: CreateEmployeePositionRepositoryInput,
  ): Promise<EmployeePositionWithDetails> {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.employeePosition.updateMany({
          where: { employeeId, isPrimary: true },
          data: { isPrimary: false },
        })
      }
      return tx.employeePosition.create({
        data: {
          employeeId,
          positionId: dto.positionId,
          hireDate: dto.hireDate,
          isPrimary: dto.isPrimary ?? false,
        },
        include: EMPLOYEE_POSITION_INCLUDE,
      })
    })
  }

  async update(
    employeeId: string,
    positionId: string,
    dto: UpdateEmployeePositionRepositoryInput,
  ): Promise<EmployeePositionWithDetails> {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.employeePosition.updateMany({
          where: { employeeId, isPrimary: true, NOT: { id: positionId } },
          data: { isPrimary: false },
        })
      }
      return tx.employeePosition.update({
        where: { id: positionId },
        data: {
          ...(dto.hireDate && { hireDate: dto.hireDate }),
          ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
        },
        include: EMPLOYEE_POSITION_INCLUDE,
      })
    })
  }

  async softDelete(
    employeeId: string,
    positionId: string,
  ): Promise<EmployeePosition> {
    return this.prisma.employeePosition.update({
      where: { id: positionId },
      data: { deletedAt: new Date() },
    })
  }
}
