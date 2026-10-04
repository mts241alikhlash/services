import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common'
import { UpdateSchoolUnitTypeInput } from './update-school-unit-type.input.js'
import { ISchoolUnitTypeRepository } from '../../../domain/repositories/school-unit-type.repository.js'

@Injectable()
export class UpdateSchoolUnitTypeUseCase {
  private readonly logger = new Logger(UpdateSchoolUnitTypeUseCase.name)

  constructor(
    private readonly schoolUnitTypeRepository: ISchoolUnitTypeRepository,
  ) {}

  async execute(id: string, input: UpdateSchoolUnitTypeInput) {
    const existing = await this.schoolUnitTypeRepository.findById(id)
    if (!existing) {
      throw new NotFoundException('School unit type not found')
    }

    if (input.code && typeof input.code === 'string') {
      const dup = await this.schoolUnitTypeRepository.findByCode(input.code)
      if (dup && dup.id !== id) {
        throw new ConflictException(
          `School unit type '${input.code}' already exists`,
        )
      }
    }

    const updated = await this.schoolUnitTypeRepository.update(id, {
      code: input.code,
      name: input.name,
    })
    this.logger.log(`School unit type updated: ${updated.code}`)
    return updated
  }
}
