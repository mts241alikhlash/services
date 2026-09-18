import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../shared/domain/interfaces/repository.interface.js'
import { DayEnum } from '../../../shared/domain/enums/day.enum.js'
import {
  ScheduleWithDetails,
  ScheduleEntity,
} from '../entities/schedule.entity.js'

export type { ScheduleWithDetails }

export interface ScheduleQueryInput extends PaginationQueryInput {
  teachingAssignmentId?: string
  timeSlotId?: string
  day?: DayEnum
  employeeId?: string
}

export interface CreateScheduleRepositoryInput {
  teachingAssignmentId: string
  timeSlotId: string
  day?: DayEnum
  room?: string
}

export interface UpdateScheduleRepositoryInput {
  teachingAssignmentId?: string
  timeSlotId?: string
  day?: DayEnum | string
  room?: string | null
}

export interface CreateTeachingAssignmentFromScheduleInput {
  employeeId: string
  classroomId: string
  subjectId: string
  semesterId: string
}

export interface ClassroomIdRef {
  id: string
}

export interface ActiveSemesterIdRef {
  id: string
}

export interface TeachingAssignmentIdRef {
  id: string
  employeeId: string
  classroomId: string
  semesterId: string
}

export interface ScheduleRefRow {
  id: string
  teachingAssignmentId: string
  timeSlotId: string
}

export interface TimetableLessonRow {
  id: string
  startTime: Date
  endTime: Date
  order: number
  subjectName: string
  classroomCode: string

  employeeUserId: string | null
  room: string | null
}

export abstract class IScheduleRepository {
  abstract findAll(
    query: ScheduleQueryInput,
  ): Promise<PaginatedResult<ScheduleWithDetails>>
  abstract findById(id: string): Promise<ScheduleWithDetails | null>
  abstract findConflictingSchedule(
    teachingAssignmentId: string,
    timeSlotId: string,
    day: DayEnum,
    excludeId?: string,
  ): Promise<ScheduleWithDetails | null>
  abstract findEmployeeConflictingSchedule(
    employeeId: string,
    semesterId: string,
    timeSlotId: string,
    day: DayEnum,
    excludeId?: string,
  ): Promise<ScheduleWithDetails | null>
  abstract findClassroomConflictingSchedule(
    classroomId: string,
    semesterId: string,
    timeSlotId: string,
    day: DayEnum,
    excludeId?: string,
  ): Promise<ScheduleWithDetails | null>
  abstract create(
    input: CreateScheduleRepositoryInput,
  ): Promise<ScheduleWithDetails>
  abstract update(
    id: string,
    input: UpdateScheduleRepositoryInput,
  ): Promise<ScheduleWithDetails>
  abstract remove(id: string): Promise<ScheduleEntity>
  abstract softDelete(id: string): Promise<ScheduleEntity>

  abstract softDeleteByClassroomAndDay(
    classroomId: string,
    day: DayEnum,
  ): Promise<{ count: number }>
  abstract findSoftDeleted(
    teachingAssignmentId: string,
    day: DayEnum,
    timeSlotId: string,
  ): Promise<ScheduleEntity | null>
  abstract restore(
    id: string,
    input?: UpdateScheduleRepositoryInput,
  ): Promise<ScheduleWithDetails>
  abstract findDuplicate(
    taId: string,
    slotId: string,
    day: string,
    excludeId?: string,
  ): Promise<ScheduleEntity | null>
  abstract findByClassroom(
    classroomId: string,
    semesterId?: string,
  ): Promise<ScheduleWithDetails[]>
  abstract findLessons(
    scope: { classroomId?: string; employeeId?: string },
    day: DayEnum,
  ): Promise<TimetableLessonRow[]>
  abstract findRefsByIds(ids: string[]): Promise<ScheduleRefRow[]>
}
