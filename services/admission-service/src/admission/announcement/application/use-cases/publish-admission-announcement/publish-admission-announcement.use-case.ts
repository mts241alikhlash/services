import { Injectable, NotFoundException } from '@nestjs/common'
import { IAdmissionAnnouncementRepository } from '../../../domain/repositories/admission-announcement-repository.js'
import { AdmissionNotificationService } from '../../../../notification/index.js'

@Injectable()
export class PublishAdmissionAnnouncementUseCase {
  constructor(
    private readonly admissionAnnouncementRepository: IAdmissionAnnouncementRepository,
    private readonly notifications: AdmissionNotificationService,
  ) {}

  async execute(id: string) {
    const announcement =
      await this.admissionAnnouncementRepository.findActiveById(id)
    if (!announcement) {
      throw new NotFoundException('Announcement not found')
    }

    const updated = await this.admissionAnnouncementRepository.publish(id)

    await this.notifications.notifyScope(
      announcement.waveId,
      announcement.title,
      announcement.content,
    )

    return updated
  }
}
