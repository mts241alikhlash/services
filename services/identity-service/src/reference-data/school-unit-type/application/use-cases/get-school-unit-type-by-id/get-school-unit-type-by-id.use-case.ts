import { Injectable, NotFoundException } from '@nestjs/common'
import { ISchoolUnitTypeRepository } from '../../../domain/repositories/school-unit-type.repository.js'

@Injectable()
export class GetSchoolUnitTypeByIdUseCase {
  constructor(
    private readonly schoolUnitTypeRepository: ISchoolUnitTypeRepository,
  ) {}

  async execute(id: string) {
    const item = await this.schoolUnitTypeRepository.findById(id)
    if (!item) {
      throw new NotFoundException('School unit type not found')
    }
    return item
  }
}
