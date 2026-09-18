import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { AcademicSetting } from '../../../domain/entities/academic-setting.entity.js'
import {
  AcademicSettingRepositoryInput,
  IAcademicSettingRepository,
} from '../../../domain/repositories/academic-setting.repository.js'

const ACADEMIC_SETTING_SELECT = {
  id: true,
  weeklyHolidays: true,
  defaultPassingScore: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AcademicSettingSelect

@Injectable()
export class PrismaAcademicSettingRepository extends IAcademicSettingRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async find(): Promise<AcademicSetting | null> {
    const row = await this.prisma.academicSetting.findFirst({
      select: ACADEMIC_SETTING_SELECT,
    })
    return row ? AcademicSetting.reconstitute(row) : null
  }

  async update(
    id: string,
    input: AcademicSettingRepositoryInput,
  ): Promise<AcademicSetting> {
    const row = await this.prisma.academicSetting.update({
      where: { id },
      data: {
        ...(input.weeklyHolidays !== undefined && {
          weeklyHolidays: input.weeklyHolidays,
        }),
        ...(input.defaultPassingScore !== undefined && {
          defaultPassingScore: input.defaultPassingScore,
        }),
      },
      select: ACADEMIC_SETTING_SELECT,
    })
    return AcademicSetting.reconstitute(row)
  }
}
