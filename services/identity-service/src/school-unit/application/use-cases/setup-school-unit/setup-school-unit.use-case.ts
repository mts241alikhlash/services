import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { SetupSchoolUnitInput } from './setup-school-unit.input.js'
import { ISchoolUnitRepository } from '../../../domain/repositories/school-unit.repository.js'

@Injectable()
export class SetupSchoolUnitUseCase {
  private readonly logger = new Logger(SetupSchoolUnitUseCase.name)

  constructor(private readonly schoolUnitRepository: ISchoolUnitRepository) {}

  async execute(input: SetupSchoolUnitInput) {
    const existing = await this.schoolUnitRepository.findFirst()
    if (existing) {
      throw new ConflictException('School unit has already been set up')
    }
    const schoolUnit = await this.schoolUnitRepository.create({
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
    this.logger.log(`School unit created: ${schoolUnit.name}`)
    return schoolUnit
  }
}
