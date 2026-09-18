import { Injectable } from '@nestjs/common'
import { ISchoolUnitTypeRepository } from '../../../domain/repositories/school-unit-type.repository.js'

@Injectable()
export class GetSchoolUnitTypesUseCase {
  constructor(
    private readonly schoolUnitTypeRepository: ISchoolUnitTypeRepository,
  ) {}

  async execute() {
    return this.schoolUnitTypeRepository.findAll()
  }
}
