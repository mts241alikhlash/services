import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../shared/domain/interfaces/repository.interface.js'
import { UserGender } from '../../../shared/domain/enums/user-gender.enum.js'
import { StudentStatusEnum } from '../../../shared/domain/enums/student-status.enum.js'
import { ParentRelation } from '../../../shared/domain/enums/parent-relation.enum.js'
import { IncomeRange } from '../../../shared/domain/enums/income-range.enum.js'
import { UserEntity } from '../../../shared/domain/entities/user.entity.js'
import {
  ProfileEntity,
  ProfileUpdateInput,
} from '../../../platform/profile/domain/entities/profile.entity.js'
import { StudentEntity } from '../entities/student.entity.js'
import {
  StudentExportWithDetails,
  StudentWithDetails,
} from '../entities/student.entity.js'
import { CreateAddressRepositoryInput } from '../../../shared/domain/entities/address.entity.js'

export type { StudentExportWithDetails, StudentWithDetails }
export interface CreateStudentResult {
  student: StudentWithDetails | null
}

export interface StudentQueryInput extends PaginationQueryInput {
  search?: string
  semesterId?: string
  classroomId?: string
  status?: StudentStatusEnum
  isActive?: boolean
}

export interface ExportStudentQueryInput {
  search?: string
  classroomId?: string
  isActive?: boolean
}

export interface CreateStudentRepositoryInput {
  identifier?: string
  name: string
  nik: string
  gender: UserGender
  birthPlace: string
  birthDate: Date
  email?: string
  phone?: string
  gradeId?: string
  classroomId?: string
  nis?: string
  nisn?: string
}

export interface UpdateStudentRepositoryInput {
  nis?: string
  nisn?: string
  gradeId?: string
  status?: StudentStatusEnum
}

export interface StudentParentSeedInput {
  name: string
  nik: string
  birthPlace: string
  birthDate: Date
  email?: string
  phone?: string
  occupationId: string
  income?: IncomeRange
  relation: ParentRelation
  isPrimary?: boolean
}

export interface CreateStudentWithRelationsRepositoryInput extends CreateStudentRepositoryInput {
  address?: CreateAddressRepositoryInput
  parents?: StudentParentSeedInput[]
}

export interface EnrolExistingAccountRepositoryInput {
  applicationId?: string
  userId: string
  nis: string
  nisn: string
  gradeId?: string
  classroomId?: string
  parents?: StudentParentSeedInput[]
  address?: CreateAddressRepositoryInput
}

export interface EnrolExistingAccountResult {
  studentId: string
  parentsLinked: number
  enrollmentCreated: boolean
  alreadyEnrolled: boolean
}

export abstract class IStudentRepository {
  abstract enrolExistingAccount(
    input: EnrolExistingAccountRepositoryInput,
  ): Promise<EnrolExistingAccountResult>
  abstract toggleUserActive(
    userId: string,
    isActive: boolean,
  ): Promise<UserEntity>
  abstract findAll(
    query: StudentQueryInput,
  ): Promise<PaginatedResult<StudentWithDetails>>
  abstract findAllForExport(
    filters: ExportStudentQueryInput,
  ): Promise<StudentExportWithDetails[]>
  abstract findById(id: string): Promise<StudentWithDetails | null>
  abstract findByUserId(userId: string): Promise<{ id: string } | null>
  abstract findByNis(nis: string): Promise<StudentEntity | null>
  abstract findByNisn(nisn: string): Promise<StudentEntity | null>
  abstract create(
    input: CreateStudentRepositoryInput,
    passwordHash: string,
  ): Promise<CreateStudentResult>
  abstract createWithRelations(
    input: CreateStudentWithRelationsRepositoryInput,
    passwordHash: string,
  ): Promise<StudentWithDetails>
  abstract update(
    id: string,
    input: UpdateStudentRepositoryInput,
  ): Promise<StudentWithDetails>
  abstract updateStatus(
    id: string,
    status: StudentStatusEnum,
  ): Promise<StudentWithDetails>
  abstract updateProfile(
    id: string,
    data: ProfileUpdateInput,
  ): Promise<{ id: string; name: string } | null>
  abstract softDelete(id: string, userId: string): Promise<void>
  abstract getActiveGradeLevels(): Promise<number[]>
  abstract getActiveClassroomCodes(): Promise<string[]>
}
