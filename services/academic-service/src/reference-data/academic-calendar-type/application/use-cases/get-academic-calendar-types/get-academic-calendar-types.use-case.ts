import { Injectable } from '@nestjs/common'
import { AcademicCalendarTypeEntity } from '../../../domain/entities/academic-calendar-type.entity.js'
import { IAcademicCalendarTypeRepository } from '../../../domain/repositories/academic-calendar-type.repository.js'
import { PaginatedResponse } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type { ListAcademicCalendarTypesInput } from './get-academic-calendar-types.input.js'

@Injectable()
export class GetAcademicCalendarTypesUseCase {
  constructor(
    private readonly academicCalendarTypeRepository: IAcademicCalendarTypeRepository,
  ) {}

  async execute(
    input: ListAcademicCalendarTypesInput,
  ): Promise<PaginatedResponse<AcademicCalendarTypeEntity>> {
    const { data, total, page, limit } =
      await this.academicCalendarTypeRepository.findAll({
        page: input.page,
        limit: input.limit,
        search: input.search,
        isActive: input.isActive,
      })
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}
