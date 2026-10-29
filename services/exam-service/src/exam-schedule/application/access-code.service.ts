import { deriveAccessCode } from '../domain/policies/derive-access-code.policy.js'
import { verifyAccessCode } from '../domain/policies/verify-access-code.policy.js'

export class AccessCodeService {
  constructor(private readonly secret: string) {}

  codeFor(scheduleId: string, rotation: number): string {
    return deriveAccessCode(this.secret, scheduleId, rotation)
  }

  matches(scheduleId: string, rotation: number, given: string): boolean {
    return verifyAccessCode(this.secret, scheduleId, rotation, given)
  }
}
