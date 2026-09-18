import { Injectable, NotFoundException } from '@nestjs/common'
import { OccupationWithCount } from '../../../domain/entities/occupation.entity.js'
import { IOccupationRepository } from '../../../domain/repositories/occupation.repository.js'

@Injectable()
export class GetOccupationByIdUseCase {
  constructor(private readonly occupationRepository: IOccupationRepository) {}

  async execute(id: string): Promise<OccupationWithCount> {
    const occupation = await this.occupationRepository.findById(id)
    if (!occupation) {
      throw new NotFoundException(`Occupation with ID ${id} not found`)
    }
    return occupation
  }
}
