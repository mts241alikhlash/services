import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common'
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.js'
import { IScheduleLookupRepository } from '../../../domain/repositories/schedule-lookup.repository.js'
import { assertSlotIsFree } from '../../../domain/policies/assert-slot-is-free.policy.js'
import type { CreateScheduleInput } from './create-schedule.input.js'

@Injectable()
export class CreateScheduleUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly lookupRepository: IScheduleLookupRepository,
  ) {}

  async execute(input: CreateScheduleInput) {
    const ta = await this.lookupRepository.findTeachingAssignmentById(
      input.teachingAssignmentId,
    )
    if (!ta) {
      throw new BadRequestException('Teaching assignment not found')
    }

    const dup = await this.scheduleRepository.findDuplicate(
      input.teachingAssignmentId,
      input.day,
      input.timeSlotId,
    )
    if (dup) {
      throw new ConflictException(
        'Schedule already exists for this assignment, day and timeslot',
      )
    }

    await assertSlotIsFree(this.scheduleRepository, {
      employeeId: ta.employeeId,
      classroomId: ta.classroomId,
      semesterId: ta.semesterId,
      timeSlotId: input.timeSlotId,
      day: input.day,
    })

    const softDeleted = await this.scheduleRepository.findSoftDeleted(
      input.teachingAssignmentId,
      input.day,
      input.timeSlotId,
    )
    if (softDeleted) {
      return this.scheduleRepository.restore(softDeleted.id, {
        room: input.room ?? undefined,
      })
    }

    return this.scheduleRepository.create({
      teachingAssignmentId: input.teachingAssignmentId,
      timeSlotId: input.timeSlotId,
      day: input.day,
      room: input.room,
    })
  }
}
