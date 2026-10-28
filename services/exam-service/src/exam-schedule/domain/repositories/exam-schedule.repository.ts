import type { PaginatedResult } from '../../../shared/domain/interfaces/repository.interface.js'
import type {
  ExamSchedule,
  ExamScheduleStatus,
} from '../entities/exam-schedule.entity.js'

export interface ExamScheduleListQuery {
  page: number
  limit: number
  classroomId?: string
  packageId?: string
  status?: ExamScheduleStatus
  from?: Date
  to?: Date
}

export interface NewExamSchedule {
  packageId: string
  classroomId: string
  semesterId: string
  startsAt: Date
  endsAt: Date
  durationMinutes: number
  createdById: string
}

export interface ScheduleWindowFields {
  startsAt: Date
  endsAt: Date
  durationMinutes: number
}

export abstract class IExamScheduleRepository {
  abstract findAll(
    query: ExamScheduleListQuery,
  ): Promise<PaginatedResult<ExamSchedule>>
  abstract findById(id: string): Promise<ExamSchedule | null>
  abstract findForClassroom(
    classroomId: string,
    semesterId: string,
  ): Promise<ExamSchedule[]>
  abstract createAndLockPackage(
    input: NewExamSchedule,
  ): Promise<ExamSchedule | null>
  abstract updateWindow(
    id: string,
    fields: ScheduleWindowFields,
  ): Promise<ExamSchedule | null>
  abstract cancel(id: string): Promise<boolean>
  abstract rotateToken(id: string): Promise<ExamSchedule | null>
}
