import { Global, Module } from '@nestjs/common'
import { HttpRegionLookupAdapter } from './http-region-lookup.adapter.js'
import { IRegionLookupPort } from './region-lookup.port.js'

@Global()
@Module({
  providers: [
    { provide: IRegionLookupPort, useClass: HttpRegionLookupAdapter },
  ],
  exports: [IRegionLookupPort],
})
export class RegionLookupModule {}
