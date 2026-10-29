import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'
import { AccessCodeService } from '../../access-code.service.js'
import type { AccessCodeResult } from '../get-access-code/get-access-code.use-case.js'
import { CANCELLED_MESSAGE } from '../update-exam-schedule/update-exam-schedule.use-case.js'

@Injectable()
export class RotateAccessCodeUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly codes: AccessCodeService,
  ) {}

  async execute(id: string): Promise<AccessCodeResult> {
    const found = await this.schedules.findById(id)
    if (found === null) throw new NotFoundException('Jadwal tidak ditemukan')
    const rotated = await this.schedules.rotateToken(id)
    if (rotated === null) throw new ConflictException(CANCELLED_MESSAGE)
    return {
      accessCode: this.codes.codeFor(rotated.id, rotated.tokenRotation),
      rotation: rotated.tokenRotation,
    }
  }
}
