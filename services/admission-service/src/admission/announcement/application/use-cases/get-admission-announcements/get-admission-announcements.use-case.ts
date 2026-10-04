import { Injectable } from '@nestjs/common'
import { IAdmissionAnnouncementRepository } from '../../../domain/repositories/admission-announcement-repository.js'
import type { GetAdmissionAnnouncementsInput } from './get-admission-announcements.input.js'

@Injectable()
export class GetAdmissionAnnouncementsUseCase {
  constructor(
    private readonly admissionAnnouncementRepository: IAdmissionAnnouncementRepository,
  ) {}

  async execute(input: GetAdmissionAnnouncementsInput) {
    const { data, total, page, limit } =
      await this.admissionAnnouncementRepository.findAll(input)

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
