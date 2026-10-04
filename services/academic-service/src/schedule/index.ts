export { ScheduleModule } from './schedule.module.js'
export {
  IScheduleRepository,
  type ScheduleQueryInput,
  type CreateScheduleRepositoryInput,
  type UpdateScheduleRepositoryInput,
  type CreateTeachingAssignmentFromScheduleInput,
  type ClassroomIdRef,
  type ActiveSemesterIdRef,
  type TeachingAssignmentIdRef,
  type ScheduleWithDetails,
} from './domain/repositories/schedule.repository.js'
export { IScheduleLookupRepository } from './domain/repositories/schedule-lookup.repository.js'
export {
  ITimeSlotRepository,
  type TimeSlotQueryInput,
  type CreateTimeSlotRepositoryInput,
  type UpdateTimeSlotRepositoryInput,
  type CreateTimeSlotTypeRepositoryInput,
  type UpdateTimeSlotTypeRepositoryInput,
  type TimeSlotWithDetails,
  type TimeSlotWithType,
} from './domain/repositories/time-slot.repository.js'
