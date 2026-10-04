import { Injectable, NotFoundException } from '@nestjs/common'
import { IReligionRepository } from '../../../domain/repositories/religion.repository.js'

@Injectable()
export class GetReligionByIdUseCase {
  constructor(private readonly repository: IReligionRepository) {}

  async execute(id: string) {
    const found = await this.repository.findById(id)
    if (!found) {
      throw new NotFoundException('Religion not found')
    }
    return found
  }
}
