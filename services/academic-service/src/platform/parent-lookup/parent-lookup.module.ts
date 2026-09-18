import { Global, Module } from '@nestjs/common'
import { IParentLookupPort } from './parent-lookup.port.js'
import { HttpParentLookupAdapter } from './http-parent-lookup.adapter.js'

@Global()
@Module({
  providers: [
    { provide: IParentLookupPort, useClass: HttpParentLookupAdapter },
  ],
  exports: [IParentLookupPort],
})
export class ParentLookupModule {}
