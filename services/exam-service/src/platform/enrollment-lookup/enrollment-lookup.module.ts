import { Global, Module } from '@nestjs/common'
import { IEnrollmentLookupPort } from './enrollment-lookup.port.js'
import { HttpEnrollmentLookupAdapter } from './http-enrollment-lookup.adapter.js'

@Global()
@Module({
  providers: [
    { provide: IEnrollmentLookupPort, useClass: HttpEnrollmentLookupAdapter },
  ],
  exports: [IEnrollmentLookupPort],
})
export class EnrollmentLookupModule {}
