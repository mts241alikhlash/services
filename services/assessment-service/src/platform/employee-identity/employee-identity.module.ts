import { Global, Module } from '@nestjs/common'
import { IEmployeeIdentityReadPort } from './employee-identity.port.js'
import { HttpEmployeeIdentityAdapter } from './http-employee-identity.adapter.js'

@Global()
@Module({
  providers: [
    {
      provide: IEmployeeIdentityReadPort,
      useClass: HttpEmployeeIdentityAdapter,
    },
  ],
  exports: [IEmployeeIdentityReadPort],
})
export class EmployeeIdentityModule {}
