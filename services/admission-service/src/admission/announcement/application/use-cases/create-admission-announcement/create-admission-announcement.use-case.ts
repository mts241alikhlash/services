import { Injectable } from '@nestjs/common'
import { IAdmissionAnnouncementRepository } from '../../../domain/repositories/admission-announcement-repository.js'
import type { CreateAdmissionAnnouncementInput } from './create-admission-announcement.input.js'

@Injectable()
export class CreateAdmissionAnnouncementUseCase {
  constructor(
    private readonly admissionAnnouncementRepository: IAdmissionAnnouncementRepository,
  ) {}

  async execute(input: CreateAdmissionAnnouncementInput, createdById: string) {
    return this.admissionAnnouncementRepository.create({
      title: input.title,
      content: input.content,
      waveId: input.waveId ?? null,
      isPublished: input.isPublished ?? false,
      publishedAt: input.isPublished ? new Date() : null,
      createdById,
    })
  }
}
