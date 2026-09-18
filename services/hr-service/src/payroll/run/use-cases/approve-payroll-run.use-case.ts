import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { RUN_MESSAGES } from '../constants/payroll-run.constants.js'
import { PayrollRunWithTotals } from '../domain/entities/payroll-run.entity.js'
import { IPayrollRunRepository } from '../domain/interfaces/payroll-run-repository.interface.js'

@Injectable()
export class ApprovePayrollRunUseCase {
  constructor(private readonly runs: IPayrollRunRepository) {}

  async execute(id: string, actorId: string): Promise<PayrollRunWithTotals> {
    const run = await this.runs.findRunById(id)
    if (!run) throw new NotFoundException(RUN_MESSAGES.NOT_FOUND)

    if (run.status === 'APPROVED') {
      throw new ConflictException(RUN_MESSAGES.APPROVED_TERMINAL)
    }
    if (run.status !== 'SUBMITTED') {
      throw new ConflictException(RUN_MESSAGES.APPROVE_FROM_SUBMITTED)
    }
    if (run.createdBy === actorId) {
      throw new ForbiddenException(RUN_MESSAGES.SELF_APPROVAL)
    }

    return this.runs.transition(id, {
      status: 'APPROVED',
      actorId,
      at: new Date(),
    })
  }
}
