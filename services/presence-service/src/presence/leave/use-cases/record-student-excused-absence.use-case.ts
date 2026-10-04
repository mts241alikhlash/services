import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { LeaveRequestWithDetails } from '../domain/entities/leave.entity.js'
import { ILeaveRepository } from '../domain/interfaces/leave-repository.interface.js'
import { RecordStudentAbsenceDto } from '../dto/request/record-student-absence.dto.js'
import { WorkingDayExpanderService } from '../services/working-day-expander.service.js'

function dateOnly(value: string): Date {
  const parsed = new Date(value)
  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
    ),
  )
}

@Injectable()
export class RecordStudentExcusedAbsenceUseCase {
  constructor(
    private readonly leave: ILeaveRepository,
    private readonly expander: WorkingDayExpanderService,
  ) {}

  async execute(
    dto: RecordStudentAbsenceDto,
    recordedBy: string,
  ): Promise<LeaveRequestWithDetails> {
    const type = await this.leave.findTypeById(dto.leaveTypeId)
    if (!type?.isActive) {
      throw new NotFoundException('Leave type not found')
    }

    if (type.appliesTo !== 'STUDENT') {
      throw new UnprocessableEntityException(
        `${type.name} is not a student leave type.`,
      )
    }

    const start = dateOnly(dto.startDate)
    const end = dateOnly(dto.endDate ?? dto.startDate)

    const days = await this.expander.expand(dto.studentUserId, start, end)
    if (days.length === 0) {
      throw new UnprocessableEntityException(
        'That range contains no school days.',
      )
    }

    const request = await this.leave.submit({
      requesterId: dto.studentUserId,
      leaveTypeId: dto.leaveTypeId,
      startDate: start,
      endDate: end,
      reason: dto.reason,
      documentFileId: dto.documentFileId ?? null,
      workingDayCount: days.length,
      days,
    })

    return this.leave.approve(
      request.id,
      { approverId: recordedBy, decidedAt: new Date() },
      type.treatment,
      'STUDENT',
    )
  }
}
