import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'
import { AccessCodeService } from '../../access-code.service.js'
import { CANCELLED_MESSAGE } from '../update-exam-schedule/update-exam-schedule.use-case.js'

export interface AccessCodeResult {
  accessCode: string
  rotation: number
}

@Injectable()
export class GetAccessCodeUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly codes: AccessCodeService,
  ) {}

  async execute(id: string): Promise<AccessCodeResult> {
    const found = await this.schedules.findById(id)
    if (found === null) throw new NotFoundException('Jadwal tidak ditemukan')
    if (found.status !== 'SCHEDULED') {
      throw new ConflictException(CANCELLED_MESSAGE)
    }
    return {
      accessCode: this.codes.codeFor(found.id, found.tokenRotation),
      rotation: found.tokenRotation,
    }
  }
}
