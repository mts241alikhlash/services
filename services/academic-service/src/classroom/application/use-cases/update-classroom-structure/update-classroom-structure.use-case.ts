import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IClassroomStructureRepository } from '../../../domain/repositories/classroom-structure.repository.js'
import type { UpdateClassroomStructureInput } from './update-classroom-structure.input.js'

@Injectable()
export class UpdateClassroomStructureUseCase {
  private readonly logger = new Logger(UpdateClassroomStructureUseCase.name)

  constructor(
    private readonly classroomStructureRepository: IClassroomStructureRepository,
  ) {}

  async execute(id: string, input: UpdateClassroomStructureInput) {
    const current = await this.classroomStructureRepository.findById(id)
    if (!current)
      throw new NotFoundException(`ClassStructure with ID ${id} not found`)

    const mergedPositions = {
      presidentId: input.presidentId ?? current.presidentId,
      vicePresidentId: input.vicePresidentId ?? current.vicePresidentId,
      secretaryId: input.secretaryId ?? current.secretaryId,
      treasurerId: input.treasurerId ?? current.treasurerId,
    }

    const allIds = Object.values(mergedPositions).filter(Boolean) as string[]
    const uniqueIds = new Set(allIds)
    if (uniqueIds.size !== allIds.length) {
      throw new BadRequestException(
        'A student cannot hold more than one position in the same structure',
      )
    }

    const updated = await this.classroomStructureRepository.update(id, {
      classroomId: input.classroomId,
      semesterId: input.semesterId,
      presidentId: input.presidentId,
      vicePresidentId: input.vicePresidentId,
      secretaryId: input.secretaryId,
      treasurerId: input.treasurerId,
    })
    this.logger.log(`ClassStructure updated: ${id}`)
    return updated
  }
}
