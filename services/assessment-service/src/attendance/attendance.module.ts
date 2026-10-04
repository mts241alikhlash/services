import { Module } from '@nestjs/common'
import { AttendanceController } from './presentation/http/attendance.controller.js'
import { PrismaAttendanceRepository } from './infrastructure/persistence/prisma/prisma-attendance.repository.js'
import { GetAttendancesUseCase } from './application/use-cases/get-attendances/get-attendances.use-case.js'
import { GetMyAttendancesUseCase } from './application/use-cases/get-my-attendances/get-my-attendances.use-case.js'
import { StudentIdentityModule } from '../platform/student-identity/student-identity.module.js'
import { GetAttendanceByIdUseCase } from './application/use-cases/get-attendance-by-id/get-attendance-by-id.use-case.js'
import { CreateAttendanceUseCase } from './application/use-cases/create-attendance/create-attendance.use-case.js'
import { UpdateAttendanceUseCase } from './application/use-cases/update-attendance/update-attendance.use-case.js'
import { DeleteAttendanceUseCase } from './application/use-cases/delete-attendance/delete-attendance.use-case.js'
import { BulkUpsertAttendanceUseCase } from './application/use-cases/bulk-upsert-attendance/bulk-upsert-attendance.use-case.js'
import { GetAttendanceRecapUseCase } from './application/use-cases/get-attendance-recap/get-attendance-recap.use-case.js'
import { GetAttendanceTrendUseCase } from './application/use-cases/get-attendance-trend/get-attendance-trend.use-case.js'
import { GetAttendanceSuggestionsUseCase } from './application/use-cases/get-attendance-suggestions/get-attendance-suggestions.use-case.js'
import { IAttendanceRepository } from './domain/repositories/attendance.repository.js'

@Module({
  imports: [StudentIdentityModule],
  controllers: [AttendanceController],
  providers: [
    {
      provide: IAttendanceRepository,
      useClass: PrismaAttendanceRepository,
    },
    GetAttendancesUseCase,
    GetMyAttendancesUseCase,
    GetAttendanceByIdUseCase,
    CreateAttendanceUseCase,
    UpdateAttendanceUseCase,
    DeleteAttendanceUseCase,
    BulkUpsertAttendanceUseCase,
    GetAttendanceRecapUseCase,
    GetAttendanceTrendUseCase,
    GetAttendanceSuggestionsUseCase,
  ],
  exports: [IAttendanceRepository],
})
export class AttendanceModule {}
