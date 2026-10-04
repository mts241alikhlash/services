import { Module } from '@nestjs/common'
import { StudentIdentityModule } from '../platform/student-identity/student-identity.module.js'
import { EmployeeIdentityModule } from '../platform/employee-identity/employee-identity.module.js'
import { IMyDashboardRepository } from './domain/repositories/my-dashboard.repository.js'
import { PrismaMyDashboardRepository } from './infrastructure/persistence/prisma/prisma-my-dashboard.repository.js'
import { MyDashboardController } from './presentation/http/my-dashboard.controller.js'
import { GetMyDashboardUseCase } from './application/use-cases/get-my-dashboard/get-my-dashboard.use-case.js'

@Module({
  imports: [StudentIdentityModule, EmployeeIdentityModule],
  controllers: [MyDashboardController],
  providers: [
    {
      provide: IMyDashboardRepository,
      useClass: PrismaMyDashboardRepository,
    },
    GetMyDashboardUseCase,
  ],
})
export class MyDashboardModule {}
