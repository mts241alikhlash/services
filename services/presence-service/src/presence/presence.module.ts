import { Module } from '@nestjs/common'
import { AttendancePeriodModule } from './attendance-period/attendance-period.module.js'
import { CredentialModule } from './credential/credential.module.js'
import { DailyRecordModule } from './daily-record/daily-record.module.js'
import { DeviceModule } from './device/device.module.js'
import { LeaveModule } from './leave/leave.module.js'
import { ScanModule } from './scan/scan.module.js'
import { PresenceSharedModule } from './shared/presence-shared.module.js'
import { WorkPatternModule } from './work-pattern/work-pattern.module.js'

@Module({
  imports: [
    PresenceSharedModule,
    AttendancePeriodModule,
    WorkPatternModule,
    CredentialModule,
    DailyRecordModule,
    DeviceModule,
    ScanModule,
    LeaveModule,
  ],
  exports: [AttendancePeriodModule, DailyRecordModule],
})
export class PresenceModule {}
