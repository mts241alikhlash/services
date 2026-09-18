import { AcademicSetting } from '../entities/academic-setting.entity.js'

export interface AcademicSettingRepositoryInput {
  weeklyHolidays?: number[]
  defaultPassingScore?: number
}

export abstract class IAcademicSettingRepository {
  abstract find(): Promise<AcademicSetting | null>
  abstract update(
    id: string,
    input: AcademicSettingRepositoryInput,
  ): Promise<AcademicSetting>
}
