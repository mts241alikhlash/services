import { Injectable } from '@nestjs/common'
import { Employee } from '@prisma/client'
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
import type {
  ProfileEntity,
  ProfileUpdateInput,
} from '../../../../platform/profile/domain/entities/profile.entity.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import type { EmployeeExportProfileRef } from '../../../domain/entities/employee.entity.js'
import {
  EMPLOYEE_EXPORT_INCLUDE,
  EMPLOYEE_LIST_INCLUDE,
  EMPLOYEE_DETAIL_INCLUDE,
  EmployeeRow,
  EmployeeExportRow,
  EmployeeListRow,
} from './prisma-employee.includes.js'
import type {
  EmployeeQueryInput,
  ExportEmployeeQueryInput,
  CreateEmployeeRepositoryInput,
  UpdateEmployeeRepositoryInput,
} from '../../../domain/repositories/employee.repository.js'
import {
  buildEmployeeListWhere,
  buildEmployeeExportWhere,
} from './prisma-employee.where.js'
import { createEmployeeInTx } from './prisma-employee.writer.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'

type EmployeeRowWithUser = EmployeeRow & { user: UserRef }
type EmployeeListRowWithUser = EmployeeListRow & {
  user: UserRef<ProfileRosterRef>
}
type EmployeeExportRowWithUser = EmployeeExportRow & {
  user: UserRef<EmployeeExportProfileRef>
}

@Injectable()
export class PrismaEmployeeRepository extends IEmployeeRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountProvisioning: IAccountProvisioningPort,
    private readonly profileLookupPort: IProfileLookupPort,
    private readonly academicLookup: IAcademicLookupPort,
  ) {
    super()
  }

  private async attachUserRefs<T extends { userId: string }>(
    rows: T[],
  ): Promise<(T & { user: UserRef<ProfileRosterRef> })[]> {
    const userRefs = await resolveUserRefs(
      rows.map((row) => row.userId),
      this.profileLookupPort,
    )

    return rows.map((row) => ({
      ...row,
      user: userRefs.get(row.userId)!,
    }))
  }

  private filterAndSort<
    T extends {
      nip: string | null
      nuptk: string | null
      user: UserRef | undefined
    },
  >(rows: T[], search?: string, isActive?: boolean): T[] {
    const needle = search?.trim().toLowerCase()

    return rows
      .filter((row) => {
        if (isActive !== undefined && row.user?.isActive !== isActive) {
          return false
        }
        if (!needle) return true
        const nipMatch = row.nip?.toLowerCase().includes(needle) ?? false
        const nuptkMatch = row.nuptk?.toLowerCase().includes(needle) ?? false
        const nameMatch =
          row.user?.profile?.name.toLowerCase().includes(needle) ?? false
        return nipMatch || nuptkMatch || nameMatch
      })
      .sort((a, b) =>
        (a.user?.profile?.name ?? '').localeCompare(
          b.user?.profile?.name ?? '',
        ),
      )
  }

  private async attachExportUserRefs(
    rows: EmployeeExportRow[],
  ): Promise<EmployeeExportRowWithUser[]> {
    const profiles = await this.profileLookupPort.findByUserIds(
      rows.map((row) => row.userId),
    )
    const byUserId = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    )

    return rows.map((row) => {
      const profile = byUserId.get(row.userId)
      const user: UserRef<EmployeeExportProfileRef> = {
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
          : undefined,
      }
      return { ...row, user }
    })
  }

  async toggleUserActive(
    userId: string,
    isActive: boolean,
  ): Promise<UserEntity> {
    return this.accountProvisioning.setActive(userId, isActive)
  }

  async findAll(
    query: EmployeeQueryInput,
  ): Promise<PaginatedResult<EmployeeListRowWithUser>> {
    const { page = 1, limit = 10, academicYearId, search, isActive } = query

    const employeeIdsInAcademicYear = academicYearId
      ? await this.academicLookup.listEmployeeIdsForAcademicYear(academicYearId)
      : null

    const rows = await this.prisma.employee.findMany({
      where: buildEmployeeListWhere(query, employeeIdsInAcademicYear),
      include: EMPLOYEE_LIST_INCLUDE,
    })

    const withUser = await this.attachUserRefs(rows)
    const filtered = this.filterAndSort(withUser, search, isActive)
    const skip = (page - 1) * limit

    return {
      data: filtered.slice(skip, skip + limit),
      total: filtered.length,
      page,
      limit,
    }
  }

  async findAllForExport(
    filters: ExportEmployeeQueryInput,
  ): Promise<EmployeeExportRowWithUser[]> {
    const rows = await this.prisma.employee.findMany({
      where: buildEmployeeExportWhere(filters),
      include: EMPLOYEE_EXPORT_INCLUDE,
    })
    const withUser = await this.attachExportUserRefs(rows)
    return this.filterAndSort(withUser, filters.search, filters.isActive)
  }

  async findById(id: string): Promise<EmployeeRowWithUser | null> {
    const row = await this.prisma.employee.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: EMPLOYEE_DETAIL_INCLUDE,
    })
    if (!row) return null
    const [withUser] = await this.attachUserRefs([row])
    return withUser
  }

  async findUserByIdentifier(
    identifier: string,
  ): Promise<{ id: string } | null> {
    const { identifierTaken } = await this.accountProvisioning.lookup({
      identifier,
    })
    return identifierTaken ? { id: identifier } : null
  }

  async findProfileByNik(nik: string): Promise<{ userId: string } | null> {
    const { nikOwnerId } = await this.accountProvisioning.lookup({ nik })
    return nikOwnerId ? { userId: nikOwnerId } : null
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { userId } })
  }

  async findByNip(nip: string, excludeId?: string): Promise<Employee | null> {
    return this.prisma.employee.findFirst({
      where: { nip, ...(excludeId && { NOT: { id: excludeId } }) },
    })
  }

  async findByNuptk(
    nuptk: string,
    excludeId?: string,
  ): Promise<Employee | null> {
    return this.prisma.employee.findFirst({
      where: { nuptk, ...(excludeId && { NOT: { id: excludeId } }) },
    })
  }

  async findProfileByUserId(
    userId: string,
    nik: string,
  ): Promise<{ userId: string } | null> {
    const { nikOwnerId } = await this.accountProvisioning.lookup({ nik })
    return nikOwnerId && nikOwnerId !== userId ? { userId: nikOwnerId } : null
  }

  async updateProfile(
    userId: string,
    data: ProfileUpdateInput,
  ): Promise<ProfileEntity> {
    const { name, nik, gender, birthPlace, birthDate, email, phone } = data
    return this.accountProvisioning.updateProfile(userId, {
      name,
      nik,
      gender: gender as UserGender | undefined,
      birthPlace,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      email: email ?? undefined,
      phone: phone ?? undefined,
    })
  }

  async create(
    dto: CreateEmployeeRepositoryInput,
    hashedPassword: string,
  ): Promise<EmployeeRowWithUser> {
    const user = await this.accountProvisioning.provision({
      identifier: dto.identifier ?? dto.nip ?? dto.nuptk ?? dto.nik,
      passwordHash: hashedPassword,
      roleCode: 'EMPLOYEE',
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
        createEmployeeInTx(tx, user.id, dto),
      )
      const [withUser] = await this.attachUserRefs([row])
      return withUser
    } catch (error) {
      await this.accountProvisioning.deprovision(user.id)
      throw error
    }
  }

  async update(
    id: string,
    dto: UpdateEmployeeRepositoryInput,
  ): Promise<EmployeeRowWithUser> {
    const row = await this.prisma.employee.update({
      where: { id },
      data: {
        nip: dto.nip,
        nuptk: dto.nuptk,
        employmentTypeId: dto.employmentTypeId,
      },
      include: EMPLOYEE_DETAIL_INCLUDE,
    })
    const [withUser] = await this.attachUserRefs([row])
    return withUser
  }

  async resolveEmploymentTypeId(code: string): Promise<string> {
    let empType = await this.prisma.employmentType.findFirst({
      where: { code },
    })
    empType ??= await this.prisma.employmentType.create({
      data: {
        code,
        name: code,
      },
    })
    return empType.id
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    await this.accountProvisioning.deprovision(userId)
  }

  async getActiveEmploymentTypeCodes(): Promise<string[]> {
    const empTypes = await this.prisma.employmentType.findMany({
      where: { deletedAt: null },
      select: { code: true },
    })
    return empTypes.map((et) => et.code)
  }
}
