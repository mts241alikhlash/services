import { Global, Module } from '@nestjs/common'
import { IEmployeeLookupPort } from './employee-lookup.port.js'
import { HttpEmployeeLookupAdapter } from './http-employee-lookup.adapter.js'

@Global()
@Module({
  providers: [
    { provide: IEmployeeLookupPort, useClass: HttpEmployeeLookupAdapter },
  ],
  exports: [IEmployeeLookupPort],
})
export class EmployeeLookupModule {}
