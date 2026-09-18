import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { UpdateSchoolUnitInput } from './update-school-unit.input.js'
import { ISchoolUnitRepository } from '../../../domain/repositories/school-unit.repository.js'

@Injectable()
export class UpdateSchoolUnitUseCase {
  private readonly logger = new Logger(UpdateSchoolUnitUseCase.name)

  constructor(private readonly schoolUnitRepository: ISchoolUnitRepository) {}

  async execute(input: UpdateSchoolUnitInput) {
    const existing = await this.schoolUnitRepository.findFirst()
    if (!existing) {
      throw new NotFoundException('School unit has not been set up yet')
    }

    const schoolUnit = await this.schoolUnitRepository.update(existing.id, {
      name: input.name,
      surname: input.surname,
      nsm: input.nsm,
      npsn: input.npsn,
      status: input.status,
      typeId: input.typeId,
      npwp: input.npwp,
      phone: input.phone,
      email: input.email,
      website: input.website,
    })
    this.logger.log(`School unit updated: ${schoolUnit.name}`)
    return schoolUnit
  }
}
