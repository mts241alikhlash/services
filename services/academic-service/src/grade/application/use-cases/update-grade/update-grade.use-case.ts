import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IGradeRepository } from '../../../domain/repositories/grade.repository.js'
import type { UpdateGradeInput } from './update-grade.input.js'

@Injectable()
export class UpdateGradeUseCase {
  private readonly logger = new Logger(UpdateGradeUseCase.name)

  constructor(private readonly gradeRepository: IGradeRepository) {}

  async execute(id: string, input: UpdateGradeInput) {
    const current = await this.gradeRepository.findById(id)
    if (!current) {
      throw new NotFoundException(`Classroom level with ID ${id} not found`)
    }

    if (input.level !== undefined && input.level !== current.level) {
      const duplicate = await this.gradeRepository.findByLevel(input.level)
      if (duplicate) {
        throw new ConflictException(
          `Classroom level ${input.level} already exists`,
        )
      }
    }

    if (input.name && input.name !== current.name) {
      const duplicate = await this.gradeRepository.findByName(input.name)
      if (duplicate) {
        throw new ConflictException(
          `Classroom level name "${input.name}" already exists`,
        )
      }
    }

    const updated = await this.gradeRepository.update(id, {
      level: input.level,
      name: input.name,
      isActive: input.isActive,
    })
    this.logger.log(`Classroom level updated: ${id}`)
    return updated
  }
}
