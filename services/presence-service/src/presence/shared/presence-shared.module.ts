import { Module } from '@nestjs/common'
import { DeviceTokenService } from './services/device-token.service.js'
import { ServerClockService } from './services/server-clock.service.js'

@Module({
  providers: [ServerClockService, DeviceTokenService],
  exports: [ServerClockService, DeviceTokenService],
})
export class PresenceSharedModule {}
