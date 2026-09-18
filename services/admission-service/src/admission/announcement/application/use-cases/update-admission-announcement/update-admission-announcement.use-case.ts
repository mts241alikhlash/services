import { Injectable, NotFoundException } from '@nestjs/common'
import { IAdmissionAnnouncementRepository } from '../../../domain/repositories/admission-announcement-repository.js'
import type { UpdateAdmissionAnnouncementInput } from './update-admission-announcement.input.js'

@Injectable()
export class UpdateAdmissionAnnouncementUseCase {
  constructor(
    private readonly admissionAnnouncementRepository: IAdmissionAnnouncementRepository,
  ) {}

  async execute(id: string, input: UpdateAdmissionAnnouncementInput) {
    const announcement =
      await this.admissionAnnouncementRepository.findActiveById(id)
    if (!announcement) {
      throw new NotFoundException('Announcement not found')
    }

    const becomingPublished =
      input.isPublished === true && !announcement.isPublished

    return this.admissionAnnouncementRepository.update(id, {
      ...input,
      ...(becomingPublished && { publishedAt: new Date() }),
    })
  }
}
