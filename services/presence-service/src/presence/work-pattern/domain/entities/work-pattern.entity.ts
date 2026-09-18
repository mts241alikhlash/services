export interface WorkPatternDayEntity {
  id: string
  workPatternId: string
  weekday: number
  isWorkingDay: boolean
  startTime: string
  endTime: string
}

export interface WorkPatternEntity {
  id: string
  name: string
  isDefault: boolean
  graceMinutes: number
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface WorkPatternWithDays extends WorkPatternEntity {
  days: WorkPatternDayEntity[]
}

export interface WorkPatternAssignmentEntity {
  id: string
  userId: string
  workPatternId: string
  effectiveFrom: Date
  effectiveTo?: Date | null
  deletedAt?: Date | null
}

export interface AssignmentHolderRef {
  id: string
  identifier: string
  displayName: string | null
}

export interface WorkPatternAssignmentWithDetails extends WorkPatternAssignmentEntity {
  holder: AssignmentHolderRef
  patternName: string
}

export interface NonWorkingDayEntity {
  id: string
  date: Date
  name: string
  sourceCalendarId?: string | null
  deletedAt?: Date | null
}
