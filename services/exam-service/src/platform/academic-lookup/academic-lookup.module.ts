import { Global, Module } from '@nestjs/common'
import { IAcademicLookupPort } from './academic-lookup.port.js'
import { HttpAcademicLookupAdapter } from './http-academic-lookup.adapter.js'

@Global()
@Module({
  providers: [
    { provide: IAcademicLookupPort, useClass: HttpAcademicLookupAdapter },
  ],
  exports: [IAcademicLookupPort],
})
export class AcademicLookupModule {}
