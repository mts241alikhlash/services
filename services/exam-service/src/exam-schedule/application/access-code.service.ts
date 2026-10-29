import { deriveAccessCode } from '../domain/policies/derive-access-code.policy.js'

export class AccessCodeService {
  constructor(private readonly secret: string) {}

  codeFor(scheduleId: string, rotation: number): string {
    return deriveAccessCode(this.secret, scheduleId, rotation)
  }
}
