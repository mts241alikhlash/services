import { Injectable } from '@nestjs/common'
import { Day, Prisma, Schedule } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type {
  ScheduleQueryInput,
  CreateScheduleRepositoryInput,
  ScheduleRefRow,
  TimetableLessonRow,
  UpdateScheduleRepositoryInput,
} from '../../../domain/repositories/schedule.repository.js'
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.js'
import {
  EmployeePersonRef,
  resolveEmployeeRefs,
} from '../../../../shared/utils/resolve-person-refs.helper.js'
import { IEmployeeLookupPort } from '../../../../platform/employee-lookup/employee-lookup.port.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import {
  SCHEDULE_WITH_DETAILS_INCLUDE,
  ScheduleRow,
} from './prisma-schedule.includes.js'
import {
  findSchedulePage,
  findScheduleById,
  findScheduleByClassroom,
  softDeleteClassroomDay,
} from './prisma-schedule.queries.js'
import {
  findAssignmentConflict,
  findClassroomConflict,
  findDuplicateRow,
  findSoftDeletedRow,
  findEmployeeConflict,
} from './prisma-schedule.conflicts.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'

type ScheduleRowWithEmployeeUser = Omit<ScheduleRow, 'teachingAssignment'> & {
  teachingAssignment: ScheduleRow['teachingAssignment'] & {
    employee?: EmployeePersonRef
  }
}

@Injectable()
export class PrismaScheduleRepository extends IScheduleRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
    private readonly employeeLookup: IEmployeeLookupPort,
  ) {
    super()
  }

  private async attachEmployeeProfiles(
    rows: ScheduleRow[],
  ): Promise<ScheduleRowWithEmployeeUser[]> {
    if (rows.length === 0) return []

    const employees = await resolveEmployeeRefs(
      rows.map((row) => row.teachingAssignment.employeeId),
      this.employeeLookup,
      this.profileLookupPort,
    )

    return rows.map((row) => ({
      ...row,
      teachingAssignment: {
        ...row.teachingAssignment,
        employee: employees.get(row.teachingAssignment.employeeId),
      },
    }))
  }

  async findAll(
    query: ScheduleQueryInput,
  ): Promise<PaginatedResult<ScheduleRowWithEmployeeUser>> {
    const { data, ...rest } = await findSchedulePage(this.prisma, query)
    return { data: await this.attachEmployeeProfiles(data), ...rest }
  }

  async findById(id: string): Promise<ScheduleRowWithEmployeeUser | null> {
    const row = await findScheduleById(this.prisma, id)
    if (!row) return null
    const [withUser] = await this.attachEmployeeProfiles([row])
    return withUser
  }

  async findRefsByIds(ids: string[]): Promise<ScheduleRefRow[]> {
    if (ids.length === 0) return []
    return this.prisma.schedule.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, teachingAssignmentId: true, timeSlotId: true },
    })
  }

  async findLessons(
    scope: { classroomId?: string; employeeId?: string },
    day: Day,
  ): Promise<TimetableLessonRow[]> {
    const assignment = {
      deletedAt: null,
      ...(scope.classroomId && { classroomId: scope.classroomId }),
      ...(scope.employeeId && { employeeId: scope.employeeId }),
    }

    const rows = await this.prisma.schedule.findMany({
      where: { day, deletedAt: null, teachingAssignment: assignment },
      select: {
        id: true,
        room: true,
        timeSlot: { select: { startTime: true, endTime: true, order: true } },
        teachingAssignment: {
          select: {
            employeeId: true,
            subject: { select: { name: true } },
            classroom: { select: { code: true } },
          },
        },
      },
      orderBy: { timeSlot: { order: 'asc' } },
    })
    if (rows.length === 0) return []

    const employees = await this.employeeLookup.listByIds(
      rows.map((row) => row.teachingAssignment.employeeId),
    )
    const userIdByEmployee = new Map(
      employees.map((employee) => [employee.id, employee.userId]),
    )

    return rows.map((row) => ({
      id: row.id,
      startTime: row.timeSlot.startTime,
      endTime: row.timeSlot.endTime,
      order: row.timeSlot.order,
      subjectName: row.teachingAssignment.subject.name,
      classroomCode: row.teachingAssignment.classroom.code,
      employeeUserId:
        userIdByEmployee.get(row.teachingAssignment.employeeId) ?? null,
      room: row.room,
    }))
  }

  async findByClassroom(
    classroomId: string,
  ): Promise<ScheduleRowWithEmployeeUser[]> {
    return this.attachEmployeeProfiles(
      await findScheduleByClassroom(this.prisma, classroomId),
    )
  }

  async findConflictingSchedule(
    teachingAssignmentId: string,
    timeSlotId: string,
    day: Day,
    excludeId?: string,
  ): Promise<ScheduleRowWithEmployeeUser | null> {
    const row = await findAssignmentConflict(
      this.prisma,
      teachingAssignmentId,
      timeSlotId,
      day,
      excludeId,
    )
    if (!row) return null
    const [withUser] = await this.attachEmployeeProfiles([row])
    return withUser
  }

  async findEmployeeConflictingSchedule(
    employeeId: string,
    semesterId: string,
    timeSlotId: string,
    day: Day,
    excludeId?: string,
  ): Promise<ScheduleRowWithEmployeeUser | null> {
    const row = await findEmployeeConflict(
      this.prisma,
      employeeId,
      semesterId,
      timeSlotId,
      day,
      excludeId,
    )
    if (!row) return null
    const [withUser] = await this.attachEmployeeProfiles([row])
    return withUser
  }

  async findClassroomConflictingSchedule(
    classroomId: string,
    semesterId: string,
    timeSlotId: string,
    day: Day,
    excludeId?: string,
  ): Promise<ScheduleRowWithEmployeeUser | null> {
    const row = await findClassroomConflict(
      this.prisma,
      classroomId,
      semesterId,
      timeSlotId,
      day,
      excludeId,
    )
    if (!row) return null
    const [withUser] = await this.attachEmployeeProfiles([row])
    return withUser
  }

  async findDuplicate(
    teachingAssignmentId: string,
    day: Day,
    timeSlotId: string,
    excludeId?: string,
  ): Promise<Schedule | null> {
    return findDuplicateRow(
      this.prisma,
      teachingAssignmentId,
      day,
      timeSlotId,
      excludeId,
    )
  }

  async findSoftDeleted(
    teachingAssignmentId: string,
    day: Day,
    timeSlotId: string,
  ): Promise<Schedule | null> {
    return findSoftDeletedRow(
      this.prisma,
      teachingAssignmentId,
      day,
      timeSlotId,
    )
  }

  async create(
    data: CreateScheduleRepositoryInput,
  ): Promise<ScheduleRowWithEmployeeUser> {
    const row = await this.prisma.schedule.create({
      data: {
        teachingAssignmentId: data.teachingAssignmentId,
        timeSlotId: data.timeSlotId,
        day: data.day as Day,
        room: data.room,
      },
      include: SCHEDULE_WITH_DETAILS_INCLUDE,
    })
    const [withUser] = await this.attachEmployeeProfiles([row])
    return withUser
  }

  async update(
    id: string,
    data: UpdateScheduleRepositoryInput,
  ): Promise<ScheduleRowWithEmployeeUser> {
    const row = await this.prisma.schedule.update({
      where: { id },
      data: toPrismaScheduleData(data),
      include: SCHEDULE_WITH_DETAILS_INCLUDE,
    })
    const [withUser] = await this.attachEmployeeProfiles([row])
    return withUser
  }

  async restore(
    id: string,
    data?: UpdateScheduleRepositoryInput,
  ): Promise<ScheduleRowWithEmployeeUser> {
    const row = await this.prisma.schedule.update({
      where: { id },
      data: { ...toPrismaScheduleData(data ?? {}), deletedAt: null },
      include: SCHEDULE_WITH_DETAILS_INCLUDE,
    })
    const [withUser] = await this.attachEmployeeProfiles([row])
    return withUser
  }

  async softDelete(id: string): Promise<Schedule> {
    return this.prisma.schedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async remove(id: string): Promise<Schedule> {
    return this.softDelete(id)
  }

  async softDeleteByClassroomAndDay(
    classroomId: string,
    day: Day,
  ): Promise<Prisma.BatchPayload> {
    return softDeleteClassroomDay(this.prisma, classroomId, day)
  }
}

function toPrismaScheduleData(
  data: UpdateScheduleRepositoryInput,
): Prisma.ScheduleUncheckedUpdateInput {
  const { day, ...rest } = data
  return { ...rest, ...(day !== undefined && { day: day as Day }) }
}
