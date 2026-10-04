import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { IReportCardRepository } from '../../../domain/repositories/report-card.repository.js'
import type { UpdateReportCardInput } from './update-report-card.input.js'

@Injectable()
export class UpdateReportCardUseCase {
  private readonly logger = new Logger(UpdateReportCardUseCase.name)

  constructor(private readonly reportCardRepository: IReportCardRepository) {}

  async execute(id: string, input: UpdateReportCardInput) {
    const existing = await this.reportCardRepository.findById(id)
    if (!existing)
      throw new NotFoundException(`ReportCard with ID ${id} not found`)

    const updated = await this.reportCardRepository.update(id, {
      employeeNote: input.employeeNote,
      rank: input.rank,
    })

    this.logger.log(`ReportCard updated: ${id}`)
    return updated
  }
}
