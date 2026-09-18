import { Injectable } from '@nestjs/common'
import { ClassroomSupervisor, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { resolveSemesterId } from '../../../../shared/utils/active-academic-year.helper.js'
import { ClassroomSupervisorEntity } from '../../../domain/entities/classroom-supervisor.entity.js'
import {
  IClassroomSupervisorRepository,
  SupervisorWithDetails,
} from '../../../domain/repositories/classroom-supervisor.repository.js'
import { CLASSROOM_SUPERVISOR_WITH_DETAILS_INCLUDE as CLASS_SUPERVISOR_INCLUDE } from './prisma-classroom.includes.js'
import type {
  ClassroomSupervisorQueryInput,
  CreateClassroomSupervisorRepositoryInput,
  SupervisedClassroomRow,
  UpdateClassroomSupervisorRepositoryInput,
} from '../../../domain/repositories/classroom-supervisor.repository.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import { IEmployeeLookupPort } from '../../../../platform/employee-lookup/employee-lookup.port.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { resolveEmployeeRefs } from '../../../../shared/utils/resolve-person-refs.helper.js'
import { SupervisorRow } from './prisma-classroom.includes.js'

@Injectable()
export class PrismaClassroomSupervisorRepository extends IClassroomSupervisorRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeeIdentity: IEmployeeIdentityReadPort,
    private readonly employeeLookup: IEmployeeLookupPort,
    private readonly profileLookupPort: IProfileLookupPort,
  ) {
    super()
  }

  private async attachEmployees(
    rows: SupervisorRow[],
  ): Promise<SupervisorWithDetails[]> {
    if (rows.length === 0) return []

    const employees = await resolveEmployeeRefs(
      rows.map((row) => row.employeeId),
      this.employeeLookup,
      this.profileLookupPort,
    )

    return rows.map((row) => ({
      ...row,
      employee: employees.get(row.employeeId),
    }))
  }

  async findAll(
    query: ClassroomSupervisorQueryInput,
  ): Promise<PaginatedResult<SupervisorWithDetails>> {
    const { page = 1, limit = 10, classroomId, employeeId, semesterId } = query
    const skip = (page - 1) * limit

    const resolvedSemesterId = await resolveSemesterId(this.prisma, semesterId)

    const where: Prisma.ClassroomSupervisorWhereInput = {
      deletedAt: null,
      ...(classroomId && { classroomId }),
      ...(employeeId && { employeeId }),
      ...(resolvedSemesterId && { semesterId: resolvedSemesterId }),
    }

    const [data, total] = await Promise.all([
      this.prisma.classroomSupervisor.findMany({
        where,
        include: CLASS_SUPERVISOR_INCLUDE,
        skip,
        take: limit,
        orderBy: [{ semester: { academicYear: { name: 'desc' } } }],
      }),
      this.prisma.classroomSupervisor.count({ where }),
    ])

    return { data: await this.attachEmployees(data), total, page, limit }
  }

  async findById(id: string): Promise<SupervisorWithDetails | null> {
    const row = await this.prisma.classroomSupervisor.findFirst({
      where: { id, deletedAt: null },
      include: CLASS_SUPERVISOR_INCLUDE,
    })
    if (!row) return null
    const [withEmployee] = await this.attachEmployees([row])
    return withEmployee
  }

  async findAssignment(
    classroomId: string,
    semesterId: string,
    excludeId?: string,
  ): Promise<ClassroomSupervisorEntity | null> {
    return this.prisma.classroomSupervisor.findFirst({
      where: {
        classroomId,
        semesterId,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async supervises(
    employeeId: string,
    classroomId: string,
    semesterId: string,
  ): Promise<boolean> {
    const found = await this.prisma.classroomSupervisor.findFirst({
      where: { employeeId, classroomId, semesterId, deletedAt: null },
      select: { id: true },
    })
    return found !== null
  }

  async listSupervisedClassrooms(
    employeeId: string,
    semesterId: string,
  ): Promise<SupervisedClassroomRow[]> {
    const rows = await this.prisma.classroomSupervisor.findMany({
      where: { employeeId, semesterId, deletedAt: null },
      select: {
        classroom: { select: { id: true, code: true, name: true } },
      },
    })
    return rows.map((row) => row.classroom)
  }

  async findEmployeeAssignment(
    employeeId: string,
    semesterId: string,
    excludeId?: string,
  ): Promise<ClassroomSupervisorEntity | null> {
    return this.prisma.classroomSupervisor.findFirst({
      where: {
        employeeId,
        semesterId,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async findEmployeeById(id: string): Promise<{ id: string } | null> {
    return (await this.employeeIdentity.employeeExists(id)) ? { id } : null
  }

  async create(
    data: CreateClassroomSupervisorRepositoryInput,
  ): Promise<SupervisorWithDetails> {
    const row = await this.prisma.classroomSupervisor.create({
      data,
      include: CLASS_SUPERVISOR_INCLUDE,
    })
    const [withEmployee] = await this.attachEmployees([row])
    return withEmployee
  }

  async update(
    id: string,
    data: UpdateClassroomSupervisorRepositoryInput,
  ): Promise<SupervisorWithDetails> {
    const row = await this.prisma.classroomSupervisor.update({
      where: { id },
      data,
      include: CLASS_SUPERVISOR_INCLUDE,
    })
    const [withEmployee] = await this.attachEmployees([row])
    return withEmployee
  }

  async remove(id: string): Promise<ClassroomSupervisorEntity> {
    return this.prisma.classroomSupervisor.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
