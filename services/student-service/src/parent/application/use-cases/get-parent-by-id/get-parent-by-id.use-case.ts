import { Injectable, NotFoundException } from '@nestjs/common'
import { ParentWithDetails } from '../../../domain/entities/parent.entity.js'
import { IParentRepository } from '../../../domain/repositories/parent.repository.js'

@Injectable()
export class GetParentByIdUseCase {
  constructor(private readonly parentRepository: IParentRepository) {}

  async execute(id: string): Promise<ParentWithDetails> {
    const parent = await this.parentRepository.findById(id)
    if (!parent) {
      throw new NotFoundException(`Parent with ID ${id} not found`)
    }
    return parent
  }
}
