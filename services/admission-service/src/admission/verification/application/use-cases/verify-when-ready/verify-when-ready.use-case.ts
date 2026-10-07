import { Injectable, Logger } from '@nestjs/common'
import { AdmissionNotificationService } from '../../../../notification/index.js'
import { isReadyForVerification } from '../../../domain/policies/application-readiness.policy.js'
import { IAdmissionVerificationRepository } from '../../../domain/repositories/admission-verification.repository.js'

export const APPLICATION_VERIFIED_NOTIFICATION = {
  title: 'Data pendaftaran terverifikasi',
  message:
    'Data, berkas, dan pembayaran Anda telah diverifikasi panitia. Keputusan penerimaan akan diumumkan melalui akun ini.',
}

@Injectable()
export class VerifyApplicationWhenReadyUseCase {
  private readonly logger = new Logger(VerifyApplicationWhenReadyUseCase.name)

  constructor(
    private readonly verification: IAdmissionVerificationRepository,
    private readonly notifications: AdmissionNotificationService,
  ) {}

  async execute(
    applicationId: string,
    verifiedById: string | null,
  ): Promise<boolean> {
    let verified = false
    try {
      const snapshot = await this.verification.findSnapshot(applicationId)
      if (!snapshot) return false
      const requiredTypeIds = await this.verification.findRequiredTypeIds()
      if (!isReadyForVerification({ ...snapshot, requiredTypeIds })) {
        return false
      }
      verified = await this.verification.markVerified(
        applicationId,
        verifiedById,
        requiredTypeIds,
      )
      if (!verified) return false
      await this.notifications.notify(
        applicationId,
        'STATUS_CHANGE',
        APPLICATION_VERIFIED_NOTIFICATION.title,
        APPLICATION_VERIFIED_NOTIFICATION.message,
      )
    } catch (error) {
      this.logger.error(
        `Automatic verification of ${applicationId} failed`,
        error instanceof Error ? error.stack : undefined,
      )
    }
    return verified
  }
}
