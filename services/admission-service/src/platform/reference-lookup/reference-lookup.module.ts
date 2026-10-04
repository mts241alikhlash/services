import { Global, Module } from '@nestjs/common'
import { IReferenceLookupPort } from './reference-lookup.port.js'
import { HttpReferenceLookupAdapter } from './http-reference-lookup.adapter.js'

@Global()
@Module({
  providers: [
    { provide: IReferenceLookupPort, useClass: HttpReferenceLookupAdapter },
  ],
  exports: [IReferenceLookupPort],
})
export class ReferenceLookupModule {}
