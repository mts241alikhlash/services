import { Prisma } from '@prisma/client'
import type {
  EmployeeQueryInput,
  ExportEmployeeQueryInput,
} from '../../../domain/repositories/employee.repository.js'

export function buildEmployeeListWhere(
  query: EmployeeQueryInput,
  employeeIdsInAcademicYear?: string[] | null,
): Prisma.EmployeeWhereInput {
  const { employmentTypeId, positionCategoryId } = query

  return {
    deletedAt: null,
    ...(employmentTypeId && { employmentTypeId }),
    ...(positionCategoryId && {
      positions: {
        some: {
          isPrimary: true,
          deletedAt: null,
          position: { categoryId: positionCategoryId },
        },
      },
    }),
    ...(employeeIdsInAcademicYear !== null &&
      employeeIdsInAcademicYear !== undefined && {
        id: { in: employeeIdsInAcademicYear },
      }),
  }
}

export function buildEmployeeExportWhere(
  filters: ExportEmployeeQueryInput,
): Prisma.EmployeeWhereInput {
  const { employmentTypeId } = filters

  return {
    deletedAt: null,
    ...(employmentTypeId && { employmentTypeId }),
  }
}
