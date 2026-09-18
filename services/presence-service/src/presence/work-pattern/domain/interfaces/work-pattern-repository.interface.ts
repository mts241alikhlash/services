import {
  NonWorkingDayEntity,
  WorkPatternAssignmentWithDetails,
  WorkPatternDayEntity,
  WorkPatternEntity,
  WorkPatternWithDays,
} from '../entities/work-pattern.entity.js'

export type {
  NonWorkingDayEntity,
  WorkPatternAssignmentWithDetails,
  WorkPatternWithDays,
}

export interface CreateWorkPatternInput {
  name: string
  graceMinutes: number
  isDefault?: boolean
}

export type UpdateWorkPatternInput = Partial<CreateWorkPatternInput>

export type WorkPatternDayInput = Omit<
  WorkPatternDayEntity,
  'id' | 'workPatternId'
>

export interface AssignWorkPatternInput {
  userId: string
  workPatternId: string
  effectiveFrom: Date
}

export interface NonWorkingDayInput {
  date: Date
  name: string
  sourceCalendarId?: string | null
}

export interface NonWorkingDayQueryInput {
  from?: Date
  to?: Date
}

export interface ResolvedPattern {
  workPatternId: string | null
  patternName: string | null
  isWorkingDay: boolean
  startTime: string | null
  endTime: string | null
  graceMinutes: number
}

export abstract class IWorkPatternRepository {
  abstract resolveForUserAndDate(
    userId: string,
    date: Date,
  ): Promise<ResolvedPattern>

  abstract isNonWorkingDay(date: Date): Promise<boolean>

  abstract findAll(): Promise<WorkPatternWithDays[]>
  abstract findById(id: string): Promise<WorkPatternWithDays | null>
  abstract create(input: CreateWorkPatternInput): Promise<WorkPatternEntity>
  abstract update(
    id: string,
    input: UpdateWorkPatternInput,
  ): Promise<WorkPatternEntity>
  abstract softDelete(id: string): Promise<WorkPatternEntity>
  abstract replaceDays(
    workPatternId: string,
    days: WorkPatternDayInput[],
  ): Promise<WorkPatternDayEntity[]>
  abstract countAssignments(workPatternId: string): Promise<number>

  abstract findAssignments(
    userId?: string,
  ): Promise<WorkPatternAssignmentWithDetails[]>
  abstract assign(
    input: AssignWorkPatternInput,
  ): Promise<WorkPatternAssignmentWithDetails>
  abstract removeAssignment(id: string): Promise<void>

  abstract findNonWorkingDays(
    query: NonWorkingDayQueryInput,
  ): Promise<NonWorkingDayEntity[]>
  abstract bulkUpsertNonWorkingDays(
    days: NonWorkingDayInput[],
  ): Promise<{ imported: number; skipped: number }>
  abstract updateNonWorkingDay(
    id: string,
    name: string,
  ): Promise<NonWorkingDayEntity>
  abstract deleteNonWorkingDay(id: string): Promise<void>
}
