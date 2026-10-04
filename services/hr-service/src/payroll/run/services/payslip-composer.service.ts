import { Injectable } from '@nestjs/common'
import { IDailyPresenceReadPort } from '../../../platform/presence-lookup/presence-lookup.port.js'
import { EffectiveAssignment } from '../../assignment/domain/interfaces/salary-assignment-repository.interface.js'
import {
  ComposedPayslip,
  PayslipLineEntity,
} from '../domain/entities/payslip.entity.js'
import { AttendanceDriverService } from './attendance-driver.service.js'
import { RoundingService } from './rounding.service.js'
import { SalaryResolverService } from './salary-resolver.service.js'

export interface CompositionResult {
  payslips: ComposedPayslip[]
  unconfigured: string[]
}

@Injectable()
export class PayslipComposerService {
  constructor(
    private readonly resolver: SalaryResolverService,
    private readonly presence: IDailyPresenceReadPort,
    private readonly drivers: AttendanceDriverService,
    private readonly rounding: RoundingService,
  ) {}

  async compose(
    userIds: string[],
    year: number,
    month: number,
  ): Promise<CompositionResult> {
    const byUser = await this.resolver.resolve(userIds, year, month)
    const unconfigured = this.resolver.unconfigured(byUser)
    if (unconfigured.length > 0) return { payslips: [], unconfigured }

    const summaries = await this.presence.summariseMonth(userIds, year, month)
    const byUserSummary = new Map(summaries.map((s) => [s.userId, s]))

    const payslips = userIds.map((userId) => {
      const summary = byUserSummary.get(userId) ?? this.drivers.blank(userId)
      const lines = (byUser.get(userId) ?? []).map((assignment) =>
        this.line(assignment, summary),
      )
      const { gross, deductions, net } = this.rounding.total(lines)
      const { userId: _identity, ...attendance } = summary

      return { userId, gross, deductions, net, attendance, lines }
    })

    return { payslips, unconfigured: [] }
  }

  private line(
    assignment: EffectiveAssignment,
    summary: ReturnType<AttendanceDriverService['blank']>,
  ): PayslipLineEntity {
    const driver = assignment.driver
    const driverCount = driver ? this.drivers.countFor(driver, summary) : null

    return {
      componentId: assignment.componentId,
      componentCode: assignment.componentCode,
      componentName: assignment.componentName,
      componentType: assignment.componentType,
      amount: driver
        ? this.rounding.driven(assignment.rate, driverCount ?? 0)
        : this.rounding.toRupiah(assignment.amount ?? 0),
      driver,
      driverCount,
      rate: driver ? assignment.rate : null,
    }
  }
}
