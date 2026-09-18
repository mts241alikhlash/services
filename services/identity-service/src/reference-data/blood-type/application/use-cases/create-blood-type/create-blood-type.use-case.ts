import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { CreateBloodTypeInput } from './create-blood-type.input.js'
import { IBloodTypeRepository } from '../../../domain/repositories/blood-type.repository.js'

@Injectable()
export class CreateBloodTypeUseCase {
  private readonly logger = new Logger(CreateBloodTypeUseCase.name)

  constructor(private readonly repository: IBloodTypeRepository) {}

  async execute(input: CreateBloodTypeInput) {
    const existing = await this.repository.findByName(input.name)
    if (existing) {
      throw new ConflictException(`Blood type '${input.name}' already exists`)
    }

    const created = await this.repository.create({
      name: input.name,
      isActive: input.isActive,
    })
    this.logger.log(`Blood type created: ${created.name}`)
    return created
  }
}
