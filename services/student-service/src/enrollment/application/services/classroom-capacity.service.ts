import { BadRequestException, Injectable } from '@nestjs/common'
import { IAcademicLookupPort } from '../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.js'

@Injectable()
export class ClassroomCapacityService {
  constructor(
    private readonly academicLookup: IAcademicLookupPort,
    private readonly enrollmentRepository: IEnrollmentRepository,
  ) {}

  async assertRoomFor(input: {
    classroomId: string
    semesterId: string
    incoming: number
  }): Promise<void> {
    if (input.incoming <= 0) return

    const classroom = await this.academicLookup.findClassroomDetail(
      input.classroomId,
    )
    if (!classroom || classroom.capacity <= 0) return

    const activeCount =
      await this.enrollmentRepository.countActiveByClassroomAndSemester(
        input.classroomId,
        input.semesterId,
      )

    if (activeCount + input.incoming > classroom.capacity) {
      const room = Math.max(classroom.capacity - activeCount, 0)
      throw new BadRequestException(
        `Classroom capacity limit of ${classroom.capacity} reached: ` +
          `${activeCount} already enrolled, room for ${room} more, ${input.incoming} requested`,
      )
    }
  }
}
