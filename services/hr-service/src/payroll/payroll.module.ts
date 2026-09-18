import { Module } from '@nestjs/common'
import { SalaryAssignmentModule } from './assignment/assignment.module.js'
import { SalaryComponentModule } from './component/component.module.js'
import { PayslipModule } from './payslip/payslip.module.js'
import { PayrollRunModule } from './run/run.module.js'

@Module({
  imports: [
    SalaryComponentModule,
    SalaryAssignmentModule,
    PayrollRunModule,
    PayslipModule,
  ],
  exports: [
    SalaryComponentModule,
    SalaryAssignmentModule,
    PayrollRunModule,
    PayslipModule,
  ],
})
export class PayrollModule {}
