import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { CreateReligionInput } from './create-religion.input.js'
import { IReligionRepository } from '../../../domain/repositories/religion.repository.js'

@Injectable()
export class CreateReligionUseCase {
  private readonly logger = new Logger(CreateReligionUseCase.name)

  constructor(private readonly repository: IReligionRepository) {}

  async execute(input: CreateReligionInput) {
    const existing = await this.repository.findByName(input.name)
    if (existing) {
      throw new ConflictException(`Religion '${input.name}' already exists`)
    }

    const created = await this.repository.create({
      name: input.name,
      isActive: input.isActive,
    })
    this.logger.log(`Religion created: ${created.name}`)
    return created
  }
}
