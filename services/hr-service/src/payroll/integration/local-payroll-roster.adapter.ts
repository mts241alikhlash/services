import { Injectable } from '@nestjs/common'
import { IEmployeeIdentityReadPort } from '../../employee/domain/repositories/employee-identity-read.port.js'
import { IProfileLookupPort } from '../../platform/profile-lookup/profile-lookup.port.js'
import { IPayrollRosterPort, RosterMember } from './roster.port.js'

@Injectable()
export class LocalPayrollRosterAdapter implements IPayrollRosterPort {
  constructor(
    private readonly staffIdentityRead: IEmployeeIdentityReadPort,
    private readonly profileLookupPort: IProfileLookupPort,
  ) {}

  async listActiveEmployees(): Promise<RosterMember[]> {
    const userIds = await this.staffIdentityRead.listRosterUserIds()
    if (userIds.length === 0) return []

    const profiles = await this.profileLookupPort.findByUserIds(userIds)
    const profileByUserId = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    )

    return userIds
      .filter((userId) => profileByUserId.get(userId)?.isActive)
      .map((userId) => ({
        userId,
        displayName: profileByUserId.get(userId)?.name ?? null,
      }))
  }
}
