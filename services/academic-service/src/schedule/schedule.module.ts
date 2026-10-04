import { Module } from '@nestjs/common'
import { SemesterModule } from '../semester/semester.module.js'
import { TeachingAssignmentModule } from '../teaching-assignment/teaching-assignment.module.js'
import { ClassroomModule } from '../classroom/classroom.module.js'
import { StudentIdentityModule } from '../platform/student-identity/student-identity.module.js'
import { EmployeeIdentityModule } from '../platform/employee-identity/employee-identity.module.js'
import { ScheduleInternalController } from './presentation/http/schedule-internal.controller.js'
import { ScheduleController } from './presentation/http/schedule.controller.js'
import { TimeSlotController } from './presentation/http/time-slot.controller.js'
import { PrismaScheduleRepository } from './infrastructure/persistence/prisma/prisma-schedule.repository.js'
import { PrismaScheduleLookupRepository } from './infrastructure/persistence/prisma/prisma-schedule-lookup.repository.js'
import { PrismaTimeSlotRepository } from './infrastructure/persistence/prisma/prisma-time-slot.repository.js'
import { IScheduleRepository } from './domain/repositories/schedule.repository.js'
import { IScheduleLookupRepository } from './domain/repositories/schedule-lookup.repository.js'
import { ITimeSlotRepository } from './domain/repositories/time-slot.repository.js'
import { GetSchedulesUseCase } from './application/use-cases/get-schedules/get-schedules.use-case.js'
import { GetMyScheduleUseCase } from './application/use-cases/get-my-schedule/get-my-schedule.use-case.js'
import { GetScheduleByIdUseCase } from './application/use-cases/get-schedule-by-id/get-schedule-by-id.use-case.js'
import { GetSchedulesByClassroomUseCase } from './application/use-cases/get-schedules-by-classroom/get-schedules-by-classroom.use-case.js'
import { CreateScheduleUseCase } from './application/use-cases/create-schedule/create-schedule.use-case.js'
import { UpdateScheduleUseCase } from './application/use-cases/update-schedule/update-schedule.use-case.js'
import { DeleteScheduleUseCase } from './application/use-cases/delete-schedule/delete-schedule.use-case.js'
import { BatchUpsertScheduleUseCase } from './application/use-cases/batch-upsert-schedule/batch-upsert-schedule.use-case.js'
import { CreateTimeSlotUseCase } from './application/use-cases/create-time-slot/create-time-slot.use-case.js'
import { DeleteTimeSlotUseCase } from './application/use-cases/delete-time-slot/delete-time-slot.use-case.js'
import { GetTimeSlotByIdUseCase } from './application/use-cases/get-time-slot-by-id/get-time-slot-by-id.use-case.js'
import { GetTimeSlotsUseCase } from './application/use-cases/get-time-slots/get-time-slots.use-case.js'
import { GetTimeSlotTypesUseCase } from './application/use-cases/get-time-slot-types/get-time-slot-types.use-case.js'
import { UpdateTimeSlotUseCase } from './application/use-cases/update-time-slot/update-time-slot.use-case.js'
import { CreateTimeSlotTypeUseCase } from './application/use-cases/create-time-slot-type/create-time-slot-type.use-case.js'
import { UpdateTimeSlotTypeUseCase } from './application/use-cases/update-time-slot-type/update-time-slot-type.use-case.js'
import { DeleteTimeSlotTypeUseCase } from './application/use-cases/delete-time-slot-type/delete-time-slot-type.use-case.js'

@Module({
  imports: [
    SemesterModule,
    TeachingAssignmentModule,
    ClassroomModule,
    StudentIdentityModule,
    EmployeeIdentityModule,
  ],
  controllers: [
    ScheduleInternalController,
    ScheduleController,
    TimeSlotController,
  ],
  providers: [
    {
      provide: IScheduleRepository,
      useClass: PrismaScheduleRepository,
    },
    {
      provide: IScheduleLookupRepository,
      useClass: PrismaScheduleLookupRepository,
    },
    {
      provide: ITimeSlotRepository,
      useClass: PrismaTimeSlotRepository,
    },

    GetSchedulesUseCase,
    GetMyScheduleUseCase,
    GetScheduleByIdUseCase,
    GetSchedulesByClassroomUseCase,
    CreateScheduleUseCase,
    UpdateScheduleUseCase,
    DeleteScheduleUseCase,
    BatchUpsertScheduleUseCase,

    GetTimeSlotsUseCase,
    GetTimeSlotTypesUseCase,
    GetTimeSlotByIdUseCase,
    CreateTimeSlotUseCase,
    UpdateTimeSlotUseCase,
    DeleteTimeSlotUseCase,
    CreateTimeSlotTypeUseCase,
    UpdateTimeSlotTypeUseCase,
    DeleteTimeSlotTypeUseCase,
  ],
  exports: [
    IScheduleRepository,
    IScheduleLookupRepository,
    ITimeSlotRepository,
  ],
})
export class ScheduleModule {}
