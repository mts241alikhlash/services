import { Prisma } from '@prisma/client'
import type { CreateEmployeeRepositoryInput } from '../../../domain/repositories/employee.repository.js'
import {
  EMPLOYEE_DETAIL_INCLUDE,
  EmployeeRow,
} from './prisma-employee.includes.js'

export async function createEmployeeInTx(
  tx: Prisma.TransactionClient,
  userId: string,
  dto: CreateEmployeeRepositoryInput,
): Promise<EmployeeRow> {
  return tx.employee.create({
    data: {
      userId,
      nip: dto.nip,
      nuptk: dto.nuptk,
      employmentTypeId: dto.employmentTypeId,
      ...(dto.positionId
        ? {
            positions: {
              create: {
                positionId: dto.positionId,
                hireDate: new Date(),
                isPrimary: true,
              },
            },
          }
        : {}),
    },
    include: EMPLOYEE_DETAIL_INCLUDE,
  })
}
