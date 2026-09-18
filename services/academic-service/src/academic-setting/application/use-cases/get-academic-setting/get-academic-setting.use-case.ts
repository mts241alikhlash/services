import { Injectable, NotFoundException } from '@nestjs/common'
import { AcademicSetting } from '../../../domain/entities/academic-setting.entity.js'
import { IAcademicSettingRepository } from '../../../domain/repositories/academic-setting.repository.js'

@Injectable()
export class GetAcademicSettingUseCase {
  constructor(private readonly repository: IAcademicSettingRepository) {}

  async execute(): Promise<AcademicSetting> {
    const setting = await this.repository.find()
    if (!setting) {
      throw new NotFoundException('Academic settings have not been set up')
    }
    return setting
  }
}
