import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { IGradeRepository } from '../../../domain/repositories/grade.repository.js'
import type { CreateGradeInput } from './create-grade.input.js'

@Injectable()
export class CreateGradeUseCase {
  private readonly logger = new Logger(CreateGradeUseCase.name)

  constructor(private readonly gradeRepository: IGradeRepository) {}

  async execute(input: CreateGradeInput) {
    const existingLevel = await this.gradeRepository.findByLevel(input.level)
    if (existingLevel) {
      throw new ConflictException(
        `Classroom level ${input.level} already exists`,
      )
    }

    const existingName = await this.gradeRepository.findByName(input.name)
    if (existingName) {
      throw new ConflictException(
        `Classroom level name "${input.name}" already exists`,
      )
    }

    const created = await this.gradeRepository.create({
      level: input.level,
      name: input.name,
      isActive: input.isActive,
    })
    this.logger.log(`Classroom level created: ${created.id} (${created.name})`)
    return created
  }
}
