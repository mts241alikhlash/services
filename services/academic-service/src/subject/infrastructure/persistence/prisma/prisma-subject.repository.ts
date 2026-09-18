import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, Subject } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type {
  SubjectQueryInput,
  CreateSubjectRepositoryInput,
  UpdateSubjectRepositoryInput,
  SubjectWithEmployees,
} from '../../../domain/repositories/subject.repository.js'
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import { resolveEmployeeRefs } from '../../../../shared/utils/resolve-person-refs.helper.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { IEmployeeLookupPort } from '../../../../platform/employee-lookup/employee-lookup.port.js'
import { buildSubjectInclude, SubjectRow } from './prisma-subject.includes.js'

@Injectable()
export class PrismaSubjectRepository extends ISubjectRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
    private readonly employeeLookup: IEmployeeLookupPort,
  ) {
    super()
  }

  private async activeSemesterId(): Promise<string | null> {
    const semester = await this.prisma.semester.findFirst({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    })
    return semester?.id ?? null
  }

  private async attachEmployeeProfiles(
    subjects: SubjectRow[],
  ): Promise<SubjectWithEmployees[]> {
    const employees = await resolveEmployeeRefs(
      subjects.flatMap(
        (subject) =>
          subject.teachingAssignments?.map(
            (assignment) => assignment.employeeId,
          ) ?? [],
      ),
      this.employeeLookup,
      this.profileLookupPort,
    )

    return subjects.map((subject) => ({
      ...subject,
      teachingAssignments: subject.teachingAssignments?.map((assignment) => {
        const employee = employees.get(assignment.employeeId)
        return {
          ...assignment,
          employee: {
            nip: employee?.nip ?? null,
            user: employee?.user?.profile
              ? { profile: { name: employee.user.profile.name } }
              : null,
          },
        }
      }),
    }))
  }

  async findAll(
    query: SubjectQueryInput,
  ): Promise<PaginatedResult<SubjectWithEmployees>> {
    const { page = 1, limit = 10, search } = query
    const skip = (page - 1) * limit

    const where: Prisma.SubjectWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const include = buildSubjectInclude(await this.activeSemesterId())

    const [data, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include,
      }),
      this.prisma.subject.count({ where }),
    ])

    return { data: await this.attachEmployeeProfiles(data), total, page, limit }
  }

  async findById(id: string): Promise<SubjectWithEmployees | null> {
    const include = buildSubjectInclude(await this.activeSemesterId())
    const row = await this.prisma.subject.findFirst({
      where: { id, deletedAt: null },
      include,
    })
    if (!row) return null
    const [withEmployees] = await this.attachEmployeeProfiles([row])
    return withEmployees
  }

  async findByCode(code: string, excludeId?: string): Promise<Subject | null> {
    return this.prisma.subject.findFirst({
      where: {
        code,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async findByName(name: string, excludeId?: string): Promise<Subject | null> {
    return this.prisma.subject.findFirst({
      where: {
        name,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async countActiveAssignments(id: string): Promise<number> {
    return this.prisma.teachingAssignment.count({
      where: { subjectId: id, deletedAt: null },
    })
  }

  async create(input: CreateSubjectRepositoryInput): Promise<Subject> {
    return this.prisma.subject.create({
      data: {
        code: input.code,
        name: input.name,
      },
    })
  }

  async update(
    id: string,
    input: UpdateSubjectRepositoryInput,
  ): Promise<SubjectWithEmployees> {
    await this.prisma.subject.updateMany({
      where: { id },
      data: {
        ...(input.code !== undefined && { code: input.code }),
        ...(input.name && { name: input.name }),
      },
    })

    const updated = await this.findById(id)
    if (!updated) {
      throw new NotFoundException(
        `Subject with ID ${id} not found after update`,
      )
    }
    return updated
  }

  async remove(id: string): Promise<Subject> {
    await this.prisma.subject.updateMany({
      where: { id },
      data: { deletedAt: new Date() },
    })
    const deleted = await this.prisma.subject.findFirst({ where: { id } })
    if (!deleted) {
      throw new NotFoundException(
        `Subject with ID ${id} not found after deletion`,
      )
    }
    return deleted
  }
}
