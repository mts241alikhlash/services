import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.js'
import { IScheduleLookupRepository } from '../../../domain/repositories/schedule-lookup.repository.js'
import { DayEnum } from '../../../../shared/domain/enums/day.enum.js'
import { assertSlotIsFree } from '../../../domain/policies/assert-slot-is-free.policy.js'
import type { UpdateScheduleInput } from './update-schedule.input.js'

@Injectable()
export class UpdateScheduleUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly lookupRepository: IScheduleLookupRepository,
  ) {}

  async execute(id: string, input: UpdateScheduleInput) {
    const current = await this.scheduleRepository.findById(id)
    if (!current) throw new NotFoundException(`Schedule ${id} not found`)
    const taId = input.teachingAssignmentId ?? current.teachingAssignmentId
    const day = input.day ?? current.day
    const tsId = input.timeSlotId ?? current.timeSlotId
    if (
      taId !== current.teachingAssignmentId ||
      day !== current.day ||
      tsId !== current.timeSlotId
    ) {
      const dup = await this.scheduleRepository.findDuplicate(
        taId,
        day,
        tsId,
        id,
      )
      if (dup) throw new ConflictException('Schedule already exists')

      const ta = await this.lookupRepository.findTeachingAssignmentById(taId)
      if (!ta) {
        throw new BadRequestException('Teaching assignment not found')
      }
      await assertSlotIsFree(
        this.scheduleRepository,
        {
          employeeId: ta.employeeId,
          classroomId: ta.classroomId,
          semesterId: ta.semesterId,
          timeSlotId: tsId,
          day: day as DayEnum,
        },
        id,
      )
    }
    return this.scheduleRepository.update(id, {
      teachingAssignmentId: input.teachingAssignmentId,
      timeSlotId: input.timeSlotId,
      day: input.day,
      room: input.room,
    })
  }
}
