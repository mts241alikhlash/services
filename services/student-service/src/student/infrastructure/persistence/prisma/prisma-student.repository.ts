import { Injectable } from '@nestjs/common'
import { Prisma, Student, StudentStatus } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IAccountProvisioningPort } from '../../../../platform/user/index.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { UserEntity } from '../../../../shared/domain/entities/user.entity.js'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'
import { resolveUserRefs } from '../../../../shared/utils/resolve-user-refs.helper.js'
import {
  ProfileRosterRef,
  UserRef,
} from '../../../../shared/domain/entities/reference.entity.js'
import type { ProfileUpdateInput } from '../../../../platform/profile/domain/entities/profile.entity.js'
import {
  IStudentRepository,
  CreateStudentResult,
} from '../../../domain/repositories/student.repository.js'
import type {
  StudentQueryInput,
  ExportStudentQueryInput,
  CreateStudentRepositoryInput,
  UpdateStudentRepositoryInput,
  CreateStudentWithRelationsRepositoryInput,
  EnrolExistingAccountRepositoryInput,
  EnrolExistingAccountResult,
  StudentExportWithDetails,
  StudentWithDetails,
} from '../../../domain/repositories/student.repository.js'
import {
  STUDENT_DETAIL_INCLUDE,
  STUDENT_EXPORT_INCLUDE,
  STUDENT_LIST_INCLUDE,
  StudentRow,
} from './prisma-student.includes.js'
import {
  buildStudentListWhere,
  buildStudentExportWhere,
} from './prisma-student.where.js'
import {
  createStudentInTx,
  createStudentWithRelationsInTx,
  enrolExistingAccountInTx,
} from './prisma-student.writer.js'
import { resolveStudentAcademicRefs } from './prisma-student.refs.js'
import {
  findActiveGradeLevels,
  findActiveClassroomCodes,
} from './prisma-student.lookups.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'

type StudentExportProfileRef = ProfileRosterRef & {
  birthPlace: string
  birthDate: Date
  email: string | null
  phone: string | null
}

@Injectable()
export class PrismaStudentRepository extends IStudentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountProvisioning: IAccountProvisioningPort,
    private readonly profileLookupPort: IProfileLookupPort,
    private readonly academicLookup: IAcademicLookupPort,
  ) {
    super()
  }

  private async attachUserRefs(
    rows: StudentRow[],
  ): Promise<StudentWithDetails[]> {
    const [userRefs, academic] = await Promise.all([
      resolveUserRefs(
        rows.map((row) => row.userId),
        this.profileLookupPort,
      ),
      resolveStudentAcademicRefs(this.academicLookup, rows),
    ])

    return rows.map((row) => ({
      ...row,
      user: userRefs.get(row.userId)!,
      grade: academic.grade(row.gradeId),
      enrollments: row.enrollments.map((enrollment) => ({
        ...enrollment,
        classroom: { code: academic.classroomCode(enrollment.classroomId) },
      })),
    }))
  }

  private filterRows<
    T extends {
      nis: string
      nisn: string
      user: { isActive: boolean; profile?: { name?: string | null } | null }
    },
  >(rows: T[], search?: string, isActive?: boolean): T[] {
    const needle = search?.trim().toLowerCase()

    return rows.filter((row) => {
      if (isActive !== undefined && row.user?.isActive !== isActive) {
        return false
      }
      if (!needle) return true
      const nisMatch = row.nis.toLowerCase().includes(needle)
      const nisnMatch = row.nisn.toLowerCase().includes(needle)
      const nameMatch =
        row.user.profile?.name?.toLowerCase().includes(needle) ?? false
      return nisMatch || nisnMatch || nameMatch
    })
  }

  private byName<
    T extends { user: { profile?: { name?: string | null } | null } },
  >(a: T, b: T): number {
    return (a.user.profile?.name ?? '').localeCompare(
      b.user.profile?.name ?? '',
    )
  }

  private async attachExportUserRefs(
    rows: StudentRow[],
  ): Promise<StudentExportWithDetails[]> {
    const [profiles, academic] = await Promise.all([
      this.profileLookupPort.findByUserIds(rows.map((row) => row.userId)),
      resolveStudentAcademicRefs(this.academicLookup, rows),
    ])
    const byUserId = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    )

    return rows.map((row) => {
      const profile = byUserId.get(row.userId)
      const user: UserRef<StudentExportProfileRef> = {
        id: row.userId,
        identifier: profile?.identifier ?? '',
        isActive: profile?.isActive ?? false,
        profile: profile
          ? {
              name: profile.name,
              gender: profile.gender,
              nik: profile.nik,
              birthPlace: profile.birthPlace,
              birthDate: new Date(profile.birthDate),
              email: profile.email,
              phone: profile.phone,
            }
          : {
              name: '',
              gender: 'MALE',
              nik: '',
              birthPlace: '',
              birthDate: new Date(0),
              email: null,
              phone: null,
            },
      }
      return {
        ...row,
        user,
        grade: academic.grade(row.gradeId),
        enrollments: row.enrollments.map((enrollment) => ({
          ...enrollment,
          classroom: { code: academic.classroomCode(enrollment.classroomId) },
        })),
      } as unknown as StudentExportWithDetails
    })
  }

  async toggleUserActive(
    userId: string,
    isActive: boolean,
  ): Promise<UserEntity> {
    return this.accountProvisioning.setActive(userId, isActive)
  }

  async findAll(
    query: StudentQueryInput,
  ): Promise<PaginatedResult<StudentWithDetails>> {
    const { page = 1, limit = 10, search, isActive } = query

    const rows = await this.prisma.student.findMany({
      where: buildStudentListWhere(query),
      include: STUDENT_LIST_INCLUDE,
    })

    const withUser = await this.attachUserRefs(rows)
    const filtered = this.filterRows(withUser, search, isActive)
    filtered.sort((a, b) => {
      const gradeDiff = (a.grade?.level ?? 0) - (b.grade?.level ?? 0)
      return gradeDiff !== 0 ? gradeDiff : this.byName(a, b)
    })

    const skip = (page - 1) * limit
    return {
      data: filtered.slice(skip, skip + limit),
      total: filtered.length,
      page,
      limit,
    }
  }

  async findAllForExport(
    filters: ExportStudentQueryInput,
  ): Promise<StudentExportWithDetails[]> {
    const rows = await this.prisma.student.findMany({
      where: buildStudentExportWhere(filters),
      include: STUDENT_EXPORT_INCLUDE,
    })
    const withUser = await this.attachExportUserRefs(rows)
    return this.filterRows(withUser, filters.search, filters.isActive).sort(
      (a, b) => this.byName(a, b),
    )
  }

  async findById(id: string): Promise<StudentWithDetails | null> {
    const row = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: STUDENT_DETAIL_INCLUDE,
    })
    if (!row) return null
    const [withUser] = await this.attachUserRefs([row])
    return withUser
  }

  async findByUserId(userId: string): Promise<{ id: string } | null> {
    return this.prisma.student.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    })
  }

  async findByNis(nis: string): Promise<Student | null> {
    return this.prisma.student.findFirst({
      where: { nis, deletedAt: null },
    })
  }

  async findByNisn(nisn: string): Promise<Student | null> {
    return this.prisma.student.findFirst({
      where: { nisn, deletedAt: null },
    })
  }

  async create(
    dto: CreateStudentRepositoryInput,
    passwordHash: string,
  ): Promise<CreateStudentResult> {
    const user = await this.accountProvisioning.provision({
      identifier: dto.identifier!,
      passwordHash,
      roleCode: 'STUDENT',
      profile: {
        name: dto.name,
        nik: dto.nik,
        gender: dto.gender,
        birthPlace: dto.birthPlace,
        birthDate: new Date(dto.birthDate),
        email: dto.email,
        phone: dto.phone,
      },
    })

    try {
      const row = await this.prisma.$transaction((tx) =>
        createStudentInTx(tx, user.id, dto),
      )
      const [withUser] = await this.attachUserRefs([row])
      return { student: withUser }
    } catch (error) {
      await this.accountProvisioning.deprovision(user.id)
      throw error
    }
  }

  async createWithRelations(
    dto: CreateStudentWithRelationsRepositoryInput,
    passwordHash: string,
  ): Promise<StudentWithDetails> {
    const user = await this.accountProvisioning.provision({
      identifier: dto.identifier!,
      passwordHash,
      roleCode: 'STUDENT',
      profile: {
        name: dto.name,
        nik: dto.nik,
        gender: dto.gender,
        birthPlace: dto.birthPlace,
        birthDate: new Date(dto.birthDate),
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
      },
    })

    try {
      const row = await this.prisma.$transaction((tx) =>
        createStudentWithRelationsInTx(tx, user.id, dto),
      )
      const [withUser] = await this.attachUserRefs([row])
      return withUser
    } catch (error) {
      await this.accountProvisioning.deprovision(user.id)
      throw error
    }
  }

  async enrolExistingAccount(
    input: EnrolExistingAccountRepositoryInput,
  ): Promise<EnrolExistingAccountResult> {
    const activeSemester = input.classroomId
      ? await this.academicLookup.findActiveSemester()
      : null

    let result: EnrolExistingAccountResult
    try {
      result = await this.prisma.$transaction((tx) =>
        enrolExistingAccountInTx(tx, input, activeSemester?.id ?? null),
      )
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        this.isUserIdUniqueViolation(error)
      ) {
        const winner = await this.findByUserId(input.userId)
        if (winner) {
          return {
            studentId: winner.id,
            parentsLinked: 0,
            enrollmentCreated: false,
            alreadyEnrolled: true,
          }
        }
      }
      throw error
    }

    if (input.address && !result.alreadyEnrolled) {
      await this.accountProvisioning.recordAddress(input.userId, input.address)
    }

    return result
  }

  private isUserIdUniqueViolation(
    error: Prisma.PrismaClientKnownRequestError,
  ): boolean {
    const target = error.meta?.target
    return (
      (Array.isArray(target) && target.includes('user_id')) ||
      target === 'students_user_id_key'
    )
  }

  async update(
    id: string,
    dto: UpdateStudentRepositoryInput,
  ): Promise<StudentWithDetails> {
    const row = await this.prisma.student.update({
      where: { id },
      data: dto,
      include: STUDENT_DETAIL_INCLUDE,
    })
    const [withUser] = await this.attachUserRefs([row])
    return withUser
  }

  async updateStatus(
    id: string,
    status: StudentStatus,
  ): Promise<StudentWithDetails> {
    const row = await this.prisma.student.update({
      where: { id },
      data: { status },
      include: STUDENT_DETAIL_INCLUDE,
    })
    const [withUser] = await this.attachUserRefs([row])
    return withUser
  }

  async updateProfile(
    id: string,
    data: ProfileUpdateInput,
  ): Promise<{ id: string; name: string } | null> {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      select: { userId: true },
    })
    if (!student) return null

    const { name, nik, gender, birthPlace, birthDate, email, phone } = data
    const profile = await this.accountProvisioning.updateProfile(
      student.userId,
      {
        name,
        nik,
        gender: gender as UserGender | undefined,
        birthPlace,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        email: email ?? undefined,
        phone: phone ?? undefined,
      },
    )
    return { id: profile.id, name: profile.name }
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    await this.accountProvisioning.deprovision(userId)
  }

  async getActiveGradeLevels(): Promise<number[]> {
    return findActiveGradeLevels(this.academicLookup)
  }

  async getActiveClassroomCodes(): Promise<string[]> {
    return findActiveClassroomCodes(this.academicLookup)
  }
}
