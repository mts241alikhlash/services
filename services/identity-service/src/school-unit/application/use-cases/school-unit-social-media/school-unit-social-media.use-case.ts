import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  CreateSchoolUnitSocialMediaInput,
  UpdateSchoolUnitSocialMediaInput,
} from './school-unit-social-media.input.js'
import { ISchoolUnitRepository } from '../../../domain/repositories/school-unit.repository.js'
import { ISchoolUnitSocialMediaRepository } from '../../../domain/repositories/school-unit-social-media.repository.js'

@Injectable()
export class SchoolUnitSocialMediaUseCase {
  private readonly logger = new Logger(SchoolUnitSocialMediaUseCase.name)

  constructor(
    private readonly schoolUnitRepository: ISchoolUnitRepository,
    private readonly schoolUnitSocialMediaRepository: ISchoolUnitSocialMediaRepository,
  ) {}

  async findAll() {
    const schoolUnit = await this.requireSchoolUnit()
    return this.schoolUnitSocialMediaRepository.findAllBySchoolUnitId(
      schoolUnit.id,
    )
  }

  async create(input: CreateSchoolUnitSocialMediaInput) {
    const schoolUnit = await this.requireSchoolUnit()

    const socialMedia = await this.schoolUnitSocialMediaRepository.create({
      schoolUnitId: schoolUnit.id,
      socialMediaId: input.socialMediaId,
      username: input.username,
    })
    this.logger.log(`Social media added: platform ${input.socialMediaId}`)
    return socialMedia
  }

  async update(id: string, input: UpdateSchoolUnitSocialMediaInput) {
    await this.requireSchoolUnit()
    const socialMedia = await this.schoolUnitSocialMediaRepository.findById(id)
    if (!socialMedia) {
      throw new NotFoundException(`Social media with ID ${id} not found`)
    }

    return this.schoolUnitSocialMediaRepository.update(id, {
      username: input.username,
    })
  }

  async remove(id: string): Promise<void> {
    await this.requireSchoolUnit()
    const socialMedia = await this.schoolUnitSocialMediaRepository.findById(id)
    if (!socialMedia) {
      throw new NotFoundException(`Social media with ID ${id} not found`)
    }

    await this.schoolUnitSocialMediaRepository.remove(id)
    this.logger.log(`Social media ${id} removed`)
  }

  private async requireSchoolUnit() {
    const schoolUnit = await this.schoolUnitRepository.findFirst()
    if (!schoolUnit) {
      throw new NotFoundException('School unit has not been set up yet')
    }
    return schoolUnit
  }
}
