import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../shared/domain/interfaces/repository.interface.js'
import { UserGender } from '../../../shared/domain/enums/user-gender.enum.js'
import { UserEntity } from '../../../shared/domain/entities/user.entity.js'
import {
  ProfileEntity,
  ProfileUpdateInput,
} from '../../../platform/profile/domain/entities/profile.entity.js'
import { EmployeeEntity } from '../entities/employee.entity.js'
import {
  EmployeeWithDetails,
  EmployeeExportWithDetails,
  EmployeeListWithDetails,
} from '../entities/employee.entity.js'

export type {
  EmployeeWithDetails,
  EmployeeListWithDetails,
  EmployeeExportWithDetails,
}

export interface EmployeeQueryInput extends PaginationQueryInput {
  search?: string
  employmentTypeId?: string
  academicYearId?: string
  positionCategoryId?: string
  isActive?: boolean
}

export interface ExportEmployeeQueryInput {
  search?: string
  employmentTypeId?: string
  isActive?: boolean
}

export interface CreateEmployeeRepositoryInput {
  identifier?: string
  name: string
  nik: string
  gender: UserGender
  birthPlace: string
  birthDate: Date
  email?: string
  phone?: string
  nip?: string
  nuptk?: string
  employmentTypeId: string
  positionId?: string
}

export interface UpdateEmployeeRepositoryInput {
  nip?: string
  nuptk?: string
  employmentTypeId?: string
}

export abstract class IEmployeeRepository {
  abstract toggleUserActive(
    userId: string,
    isActive: boolean,
  ): Promise<UserEntity>
  abstract findAll(
    query: EmployeeQueryInput,
  ): Promise<PaginatedResult<EmployeeListWithDetails>>
  abstract findAllForExport(
    filters: ExportEmployeeQueryInput,
  ): Promise<EmployeeExportWithDetails[]>
  abstract findById(id: string): Promise<EmployeeWithDetails | null>
  abstract findUserByIdentifier(
    identifier: string,
  ): Promise<{ id: string } | null>
  abstract findProfileByNik(nik: string): Promise<{ userId: string } | null>
  abstract findByUserId(userId: string): Promise<EmployeeEntity | null>
  abstract findByNip(
    nip: string,
    excludeId?: string,
  ): Promise<EmployeeEntity | null>
  abstract findByNuptk(
    nuptk: string,
    excludeId?: string,
  ): Promise<EmployeeEntity | null>
  abstract findProfileByUserId(
    userId: string,
    nik: string,
  ): Promise<{ userId: string } | null>
  abstract updateProfile(
    userId: string,
    data: ProfileUpdateInput,
  ): Promise<ProfileEntity>
  abstract create(
    input: CreateEmployeeRepositoryInput,
    hashedPassword: string,
  ): Promise<EmployeeWithDetails>
  abstract update(
    id: string,
    input: UpdateEmployeeRepositoryInput,
  ): Promise<EmployeeWithDetails>
  abstract resolveEmploymentTypeId(code: string): Promise<string>
  abstract softDelete(id: string, userId: string): Promise<void>
  abstract getActiveEmploymentTypeCodes(): Promise<string[]>
}
