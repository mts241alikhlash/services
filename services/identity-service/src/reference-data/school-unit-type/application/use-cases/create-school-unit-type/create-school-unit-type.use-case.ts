import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { CreateSchoolUnitTypeInput } from './create-school-unit-type.input.js'
import { ISchoolUnitTypeRepository } from '../../../domain/repositories/school-unit-type.repository.js'

@Injectable()
export class CreateSchoolUnitTypeUseCase {
  private readonly logger = new Logger(CreateSchoolUnitTypeUseCase.name)

  constructor(
    private readonly schoolUnitTypeRepository: ISchoolUnitTypeRepository,
  ) {}

  async execute(input: CreateSchoolUnitTypeInput) {
    const existing = await this.schoolUnitTypeRepository.findByCode(input.code)
    if (existing) {
      throw new ConflictException('School unit type code already exists')
    }

    const schoolUnitType = await this.schoolUnitTypeRepository.create({
      code: input.code,
      name: input.name,
    })
    this.logger.log(`School unit type created: ${schoolUnitType.code}`)
    return schoolUnitType
  }
}
