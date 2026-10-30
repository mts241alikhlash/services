import type { PaginatedResult } from '../../../shared/domain/interfaces/repository.interface.js'
import type {
  ExamSchedule,
  ExamScheduleStatus,
  ExamType,
} from '../entities/exam-schedule.entity.js'
import type {
  NewParticipant,
  ScheduleParticipant,
} from '../entities/schedule-participant.entity.js'

export interface ExamScheduleListQuery {
  page: number
  limit: number
  classroomId?: string
  packageId?: string
  status?: ExamScheduleStatus
  from?: Date
  to?: Date
}

export interface ExamScheduleGradingQuery {
  semesterId: string
  pairs: { subjectId: string; classroomId: string }[] | null
  now: Date
  page: number
  limit: number
}

export interface NewExamSchedule {
  packageId: string
  classroomId: string
  semesterId: string
  startsAt: Date
  endsAt: Date
  durationMinutes: number
  type: ExamType
  createdById: string
}

export interface NewMakeupSchedule extends NewExamSchedule {
  makeupOfId: string
  participants: NewParticipant[]
}

export interface ScheduleWindowFields {
  startsAt: Date
  endsAt: Date
  durationMinutes: number
  type: ExamType
}

export abstract class IExamScheduleRepository {
  abstract findAll(
    query: ExamScheduleListQuery,
  ): Promise<PaginatedResult<ExamSchedule>>
  abstract findById(id: string): Promise<ExamSchedule | null>
  abstract findForGrading(
    query: ExamScheduleGradingQuery,
  ): Promise<PaginatedResult<ExamSchedule>>
  abstract findForClassroom(
    classroomId: string,
    semesterId: string,
  ): Promise<ExamSchedule[]>
  abstract createAndLockPackage(
    input: NewExamSchedule,
  ): Promise<ExamSchedule | null>
  abstract createMakeup(input: NewMakeupSchedule): Promise<ExamSchedule | null>
  abstract listParticipants(scheduleId: string): Promise<ScheduleParticipant[]>
  abstract addParticipants(
    scheduleId: string,
    rows: NewParticipant[],
    addedById: string,
  ): Promise<void>
  abstract removeParticipant(
    scheduleId: string,
    studentId: string,
  ): Promise<boolean>
  abstract findParticipation(
    scheduleId: string,
    studentId: string,
  ): Promise<ScheduleParticipant | null>
  abstract findMakeupsOf(originalId: string): Promise<ExamSchedule[]>
  abstract findMakeupsForStudent(
    studentId: string,
    semesterId: string,
  ): Promise<ExamSchedule[]>
  abstract updateWindow(
    id: string,
    fields: ScheduleWindowFields,
  ): Promise<ExamSchedule | null>
  abstract cancel(id: string): Promise<boolean>
  abstract rotateToken(id: string): Promise<ExamSchedule | null>
}
