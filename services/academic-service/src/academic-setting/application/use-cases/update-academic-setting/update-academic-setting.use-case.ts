import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { AcademicSetting } from '../../../domain/entities/academic-setting.entity.js'
import { InvalidAcademicSettingError } from '../../../domain/errors/invalid-academic-setting.error.js'
import { IAcademicSettingRepository } from '../../../domain/repositories/academic-setting.repository.js'
import type { UpdateAcademicSettingInput } from './update-academic-setting.input.js'

@Injectable()
export class UpdateAcademicSettingUseCase {
  private readonly logger = new Logger(UpdateAcademicSettingUseCase.name)

  constructor(private readonly repository: IAcademicSettingRepository) {}

  async execute(input: UpdateAcademicSettingInput): Promise<AcademicSetting> {
    const existing = await this.repository.find()
    if (!existing) {
      throw new NotFoundException('Academic settings have not been set up')
    }

    let validated: AcademicSetting
    try {
      validated = existing.withUpdate(input)
    } catch (error) {
      if (error instanceof InvalidAcademicSettingError) {
        throw new BadRequestException(error.message)
      }
      throw error
    }

    const updated = await this.repository.update(existing.id, {
      weeklyHolidays: validated.weeklyHolidays,
      defaultPassingScore: validated.defaultPassingScore,
    })

    this.logger.log(
      `Academic settings updated: weekly holidays [${updated.weeklyHolidays.join(', ')}], ` +
        `default passing score ${updated.defaultPassingScore}`,
    )
    return updated
  }
}
