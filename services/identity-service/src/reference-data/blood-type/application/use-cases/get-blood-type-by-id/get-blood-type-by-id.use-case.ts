import { Injectable, NotFoundException } from '@nestjs/common'
import { IBloodTypeRepository } from '../../../domain/repositories/blood-type.repository.js'

@Injectable()
export class GetBloodTypeByIdUseCase {
  constructor(private readonly repository: IBloodTypeRepository) {}

  async execute(id: string) {
    const found = await this.repository.findById(id)
    if (!found) {
      throw new NotFoundException('Blood type not found')
    }
    return found
  }
}
