import { Module } from '@nestjs/common'
import { AcademicYearModule } from '../academic-year/academic-year.module.js'
import { SemesterModule } from '../semester/semester.module.js'
import { ClassroomModule } from '../classroom/classroom.module.js'
import { AcademicCalendarController } from './presentation/http/academic-calendar.controller.js'
import { PrismaAcademicCalendarRepository } from './infrastructure/persistence/prisma/prisma-academic-calendar.repository.js'
import { IAcademicCalendarRepository } from './domain/repositories/academic-calendar.repository.js'
import { AssertClassroomsExistService } from './application/services/assert-classrooms-exist.service.js'

import { BulkDeleteAcademicCalendarsUseCase } from './application/use-cases/bulk-delete-academic-calendars/bulk-delete-academic-calendars.use-case.js'
import { CreateAcademicCalendarUseCase } from './application/use-cases/create-academic-calendar/create-academic-calendar.use-case.js'
import { DeleteAcademicCalendarUseCase } from './application/use-cases/delete-academic-calendar/delete-academic-calendar.use-case.js'
import { GetAcademicCalendarByIdUseCase } from './application/use-cases/get-academic-calendar-by-id/get-academic-calendar-by-id.use-case.js'
import { GetAcademicCalendarsUseCase } from './application/use-cases/get-academic-calendars/get-academic-calendars.use-case.js'
import { UpdateAcademicCalendarUseCase } from './application/use-cases/update-academic-calendar/update-academic-calendar.use-case.js'

@Module({
  imports: [AcademicYearModule, SemesterModule, ClassroomModule],
  controllers: [AcademicCalendarController],
  providers: [
    {
      provide: IAcademicCalendarRepository,
      useClass: PrismaAcademicCalendarRepository,
    },
    AssertClassroomsExistService,
    GetAcademicCalendarsUseCase,
    GetAcademicCalendarByIdUseCase,
    CreateAcademicCalendarUseCase,
    UpdateAcademicCalendarUseCase,
    DeleteAcademicCalendarUseCase,
    BulkDeleteAcademicCalendarsUseCase,
  ],
})
export class CalendarModule {}
