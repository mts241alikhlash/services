import { Injectable } from '@nestjs/common'
import {
  IPayrollRosterPort,
  RosterMember,
} from '../../integration/roster.port.js'

export type { RosterMember }

@Injectable()
export class PayrollRosterService {
  constructor(private readonly roster: IPayrollRosterPort) {}

  async list(): Promise<RosterMember[]> {
    return this.roster.listActiveEmployees()
  }

  name(roster: RosterMember[], userIds: string[]): string[] {
    const byId = new Map(
      roster.map((member) => [member.userId, member.displayName]),
    )

    return userIds.map((userId) => byId.get(userId) ?? userId)
  }
}
