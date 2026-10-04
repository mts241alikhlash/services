import { Global, Module } from '@nestjs/common'
import {
  IAttendancePeriodReadPort,
  IDailyPresenceReadPort,
} from './presence-lookup.port.js'
import {
  HttpAttendancePeriodLookupAdapter,
  HttpPresenceLookupAdapter,
} from './http-presence-lookup.adapter.js'

@Global()
@Module({
  providers: [
    { provide: IDailyPresenceReadPort, useClass: HttpPresenceLookupAdapter },
    {
      provide: IAttendancePeriodReadPort,
      useClass: HttpAttendancePeriodLookupAdapter,
    },
  ],
  exports: [IDailyPresenceReadPort, IAttendancePeriodReadPort],
})
export class PresenceLookupModule {}
