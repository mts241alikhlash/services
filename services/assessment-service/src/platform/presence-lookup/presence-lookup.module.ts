import { Global, Module } from '@nestjs/common'
import { IDailyPresenceReadPort } from './presence-lookup.port.js'
import { HttpPresenceLookupAdapter } from './http-presence-lookup.adapter.js'

@Global()
@Module({
  providers: [
    { provide: IDailyPresenceReadPort, useClass: HttpPresenceLookupAdapter },
  ],
  exports: [IDailyPresenceReadPort],
})
export class PresenceLookupModule {}
