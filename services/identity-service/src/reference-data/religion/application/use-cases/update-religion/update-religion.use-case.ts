import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { UpdateReligionInput } from './update-religion.input.js'
import { IReligionRepository } from '../../../domain/repositories/religion.repository.js'

@Injectable()
export class UpdateReligionUseCase {
  private readonly logger = new Logger(UpdateReligionUseCase.name)

  constructor(private readonly repository: IReligionRepository) {}

  async execute(id: string, input: UpdateReligionInput) {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Religion not found')
    }

    if (input.name !== undefined) {
      const duplicate = await this.repository.findByName(input.name)
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Religion '${input.name}' already exists`)
      }
    }

    const updated = await this.repository.update(id, {
      name: input.name,
      isActive: input.isActive,
    })
    this.logger.log(`Religion updated: ${updated.name}`)
    return updated
  }
}
