import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { OccupationEntity } from '../../../domain/entities/occupation.entity.js'
import { IOccupationRepository } from '../../../domain/repositories/occupation.repository.js'
import type { UpdateOccupationInput } from './update-occupation.input.js'

@Injectable()
export class UpdateOccupationUseCase {
  private readonly logger = new Logger(UpdateOccupationUseCase.name)

  constructor(private readonly occupationRepository: IOccupationRepository) {}

  async execute(
    id: string,
    input: UpdateOccupationInput,
  ): Promise<OccupationEntity> {
    const existing = await this.occupationRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Occupation with ID ${id} not found`)
    }

    if (input.name) {
      const duplicate = await this.occupationRepository.findByName(
        input.name,
        id,
      )
      if (duplicate) {
        throw new ConflictException(
          `Occupation name "${input.name}" is already taken`,
        )
      }
    }

    const occupation = await this.occupationRepository.update(id, {
      name: input.name,
      isActive: input.isActive,
    })
    this.logger.log(`Occupation updated: ${id}`)
    return occupation
  }
}
