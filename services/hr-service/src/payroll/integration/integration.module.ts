import { Module } from '@nestjs/common'
import { EmployeeModule } from '../../employee/employee.module.js'
import { IPayrollRosterPort } from './roster.port.js'
import { LocalPayrollRosterAdapter } from './local-payroll-roster.adapter.js'

@Module({
  imports: [EmployeeModule],
  providers: [
    { provide: IPayrollRosterPort, useClass: LocalPayrollRosterAdapter },
  ],
  exports: [IPayrollRosterPort],
})
export class IntegrationModule {}
