import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { IClassroomRepository } from '../../../domain/repositories/classroom.repository.js'
import { withDisplayName } from '../../../../shared/utils/classroom-display-name.helper.js'
import type { CreateClassroomInput } from './create-classroom.input.js'

@Injectable()
export class CreateClassroomUseCase {
  private readonly logger = new Logger(CreateClassroomUseCase.name)

  constructor(private readonly classroomRepository: IClassroomRepository) {}

  async execute(input: CreateClassroomInput) {
    const existing = await this.classroomRepository.findDuplicate(
      input.code,
      input.academicYearId,
    )
    if (existing) {
      throw new ConflictException(
        `Classroom code "${input.code}" already exists for this academic year and level`,
      )
    }

    const newClassroom = await this.classroomRepository.create({
      academicYearId: input.academicYearId,
      gradeId: input.gradeId,
      code: input.code,
      name: input.name,
      capacity: input.capacity,
      isActive: input.isActive,
    })

    this.logger.log(`Classroom created: ${input.code}`)
    return withDisplayName(newClassroom)
  }
}
