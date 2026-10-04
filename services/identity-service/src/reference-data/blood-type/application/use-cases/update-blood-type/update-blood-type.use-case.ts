import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { UpdateBloodTypeInput } from './update-blood-type.input.js'
import { IBloodTypeRepository } from '../../../domain/repositories/blood-type.repository.js'

@Injectable()
export class UpdateBloodTypeUseCase {
  private readonly logger = new Logger(UpdateBloodTypeUseCase.name)

  constructor(private readonly repository: IBloodTypeRepository) {}

  async execute(id: string, input: UpdateBloodTypeInput) {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Blood type not found')
    }

    if (input.name !== undefined) {
      const duplicate = await this.repository.findByName(input.name)
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Blood type '${input.name}' already exists`)
      }
    }

    const updated = await this.repository.update(id, {
      name: input.name,
      isActive: input.isActive,
    })
    this.logger.log(`Blood type updated: ${updated.name}`)
    return updated
  }
}
