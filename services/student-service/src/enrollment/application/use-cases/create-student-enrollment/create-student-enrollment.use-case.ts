import { ConflictException, Injectable } from '@nestjs/common'
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js'
import { ClassroomCapacityService } from '../../services/classroom-capacity.service.js'
import type { CreateStudentEnrollmentInput } from './create-student-enrollment.input.js'

@Injectable()
export class CreateStudentEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly classroomCapacity: ClassroomCapacityService,
  ) {}

  async execute(input: CreateStudentEnrollmentInput) {
    await this.classroomCapacity.assertRoomFor({
      classroomId: input.classroomId,
      semesterId: input.semesterId,
      incoming: 1,
    })

    const dup = await this.enrollmentRepository.findDuplicate(
      input.studentId,
      input.semesterId,
    )
    if (dup) {
      throw new ConflictException(
        'Student is already enrolled in this semester',
      )
    }

    const softDeleted = await this.enrollmentRepository.findSoftDeleted(
      input.studentId,
      input.semesterId,
    )
    if (softDeleted) {
      return this.enrollmentRepository.restore(softDeleted.id, {
        classroomId: input.classroomId,
      })
    }

    return this.enrollmentRepository.create({
      studentId: input.studentId,
      classroomId: input.classroomId,
      semesterId: input.semesterId,
    })
  }
}
