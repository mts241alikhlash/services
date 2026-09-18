import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { OccupationEntity } from '../../../domain/entities/occupation.entity.js'
import { IOccupationRepository } from '../../../domain/repositories/occupation.repository.js'
import type { CreateOccupationInput } from './create-occupation.input.js'

@Injectable()
export class CreateOccupationUseCase {
  private readonly logger = new Logger(CreateOccupationUseCase.name)

  constructor(private readonly occupationRepository: IOccupationRepository) {}

  async execute(input: CreateOccupationInput): Promise<OccupationEntity> {
    const existing = await this.occupationRepository.findByName(input.name)
    if (existing) {
      throw new ConflictException(
        `Occupation name "${input.name}" is already taken`,
      )
    }

    const occupation = await this.occupationRepository.create({
      name: input.name,
      isActive: input.isActive,
    })
    this.logger.log(`Occupation created: ${occupation.name}`)
    return occupation
  }
}
