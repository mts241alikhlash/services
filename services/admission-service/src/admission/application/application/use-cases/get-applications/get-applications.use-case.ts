import { Injectable } from '@nestjs/common'
import { IAdmissionApplicationRepository } from '../../../domain/repositories/admission-application-repository.js'
import type { GetApplicationsInput } from './get-applications.input.js'

@Injectable()
export class GetApplicationsUseCase {
  constructor(
    private readonly admissionApplicationRepository: IAdmissionApplicationRepository,
  ) {}

  async execute(query: GetApplicationsInput) {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const { data, total } = await this.admissionApplicationRepository.findAll({
      page,
      limit,
      search: query.search,
      status: query.status,
      waveId: query.waveId,
    })

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
