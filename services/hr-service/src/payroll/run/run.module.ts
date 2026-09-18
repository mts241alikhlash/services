import { Module } from '@nestjs/common'
import { IntegrationModule } from '../integration/integration.module.js'
import { SalaryAssignmentModule } from '../assignment/assignment.module.js'
import { PayrollSharedModule } from '../shared/payroll-shared.module.js'
import { PayrollAccessFilter } from '../shared/filters/payroll-access.filter.js'
import { IPayrollRunRepository } from './domain/interfaces/payroll-run-repository.interface.js'
import { PrismaPayrollRunRepository } from './infrastructure/persistence/prisma-payroll-run.repository.js'
import { PayrollRunController } from './presentation/payroll-run.controller.js'
import { AttendanceDriverService } from './services/attendance-driver.service.js'
import { PayrollRosterService } from './services/payroll-roster.service.js'
import { PayslipComposerService } from './services/payslip-composer.service.js'
import { RoundingService } from './services/rounding.service.js'
import { SalaryResolverService } from './services/salary-resolver.service.js'
import { ApprovePayrollRunUseCase } from './use-cases/approve-payroll-run.use-case.js'
import { CreatePayrollRunUseCase } from './use-cases/create-payroll-run.use-case.js'
import {
  GetPayrollRunByIdUseCase,
  GetPayrollRunsUseCase,
} from './use-cases/get-payroll-runs.use-case.js'
import { RecalculatePayrollRunUseCase } from './use-cases/recalculate-payroll-run.use-case.js'
import { SubmitPayrollRunUseCase } from './use-cases/submit-payroll-run.use-case.js'

@Module({
  imports: [SalaryAssignmentModule, IntegrationModule, PayrollSharedModule],
  controllers: [PayrollRunController],
  providers: [
    { provide: IPayrollRunRepository, useClass: PrismaPayrollRunRepository },
    PayrollAccessFilter,
    RoundingService,
    AttendanceDriverService,
    SalaryResolverService,
    PayrollRosterService,
    PayslipComposerService,
    CreatePayrollRunUseCase,
    RecalculatePayrollRunUseCase,
    SubmitPayrollRunUseCase,
    ApprovePayrollRunUseCase,
    GetPayrollRunsUseCase,
    GetPayrollRunByIdUseCase,
  ],
  exports: [IPayrollRunRepository],
})
export class PayrollRunModule {}
