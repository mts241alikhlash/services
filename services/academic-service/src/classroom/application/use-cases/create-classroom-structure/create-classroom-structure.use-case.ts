import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common'
import { IClassroomStructureRepository } from '../../../domain/repositories/classroom-structure.repository.js'
import type { CreateClassroomStructureInput } from './create-classroom-structure.input.js'

@Injectable()
export class CreateClassroomStructureUseCase {
  private readonly logger = new Logger(CreateClassroomStructureUseCase.name)

  constructor(
    private readonly classroomStructureRepository: IClassroomStructureRepository,
  ) {}

  async execute(input: CreateClassroomStructureInput) {
    const existing = await this.classroomStructureRepository.findStructure(
      input.classroomId,
      input.semesterId,
    )

    if (existing)
      throw new ConflictException(
        'Classroom structure already exists for this classroom/semester',
      )

    const positionEntries = [
      { field: 'president', id: input.presidentId },
      { field: 'vicePresident', id: input.vicePresidentId },
      { field: 'secretary', id: input.secretaryId },
      { field: 'treasurer', id: input.treasurerId },
    ].filter((e): e is { field: string; id: string } => !!e.id)

    const studentIds = positionEntries.map((e) => e.id)
    const uniqueIds = new Set(studentIds)
    if (uniqueIds.size !== studentIds.length) {
      throw new BadRequestException(
        'A student cannot hold more than one position in the same structure',
      )
    }

    const structure = await this.classroomStructureRepository.create({
      classroomId: input.classroomId,
      semesterId: input.semesterId,
      presidentId: input.presidentId,
      vicePresidentId: input.vicePresidentId,
      secretaryId: input.secretaryId,
      treasurerId: input.treasurerId,
    })

    this.logger.log(
      `ClassroomStructure created for classroom ${input.classroomId}, semester ${input.semesterId}`,
    )
    return structure
  }
}
