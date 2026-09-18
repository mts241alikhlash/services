import { Global, Module } from '@nestjs/common'
import { HttpProfileLookupAdapter } from './http-profile-lookup.adapter.js'
import { IProfileLookupPort } from './profile-lookup.port.js'

@Global()
@Module({
  providers: [
    { provide: IProfileLookupPort, useClass: HttpProfileLookupAdapter },
  ],
  exports: [IProfileLookupPort],
})
export class ProfileLookupModule {}
