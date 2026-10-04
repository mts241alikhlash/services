import { BadRequestException, Injectable } from '@nestjs/common'
import { SemesterWithAcademicYear } from '../../domain/entities/promotion.entity.js'
import { IPromotionRepository } from '../../domain/repositories/promotion.repository.js'

export interface ResolvedPromotionSemesters {
  source: SemesterWithAcademicYear
  target: SemesterWithAcademicYear
}

@Injectable()
export class PromotionSemesterResolver {
  constructor(private readonly promotionRepository: IPromotionRepository) {}

  assertDifferentYears(
    sourceAcademicYearId: string,
    targetAcademicYearId: string,
  ): void {
    if (sourceAcademicYearId === targetAcademicYearId) {
      throw new BadRequestException(
        'Promotion moves students between academic years. To move between the ' +
          'terms of one year, use rollover.',
      )
    }
  }

  async resolveSource(
    sourceAcademicYearId: string,
    targetAcademicYearId: string,
  ): Promise<SemesterWithAcademicYear> {
    this.assertDifferentYears(sourceAcademicYearId, targetAcademicYearId)

    const source =
      await this.promotionRepository.findLatestEnrolledSemesterOfAcademicYear(
        sourceAcademicYearId,
      )
    if (source) return source

    const anyTerm =
      await this.promotionRepository.findEdgeSemesterOfAcademicYear(
        sourceAcademicYearId,
        'last',
      )
    const year = await this.nameOf(sourceAcademicYearId)

    throw new BadRequestException(
      anyTerm
        ? `Academic year ${year} has no students enrolled in any of its ` +
            'semesters, so there is nobody to promote.'
        : `Academic year ${year} has no semester to promote students from.`,
    )
  }

  async resolveBoth(
    sourceAcademicYearId: string,
    targetAcademicYearId: string,
  ): Promise<ResolvedPromotionSemesters> {
    const source = await this.resolveSource(
      sourceAcademicYearId,
      targetAcademicYearId,
    )

    const target =
      await this.promotionRepository.findEdgeSemesterOfAcademicYear(
        targetAcademicYearId,
        'first',
      )

    if (!target) {
      throw new BadRequestException(
        `Academic year ${await this.nameOf(targetAcademicYearId)} has no ` +
          'semester to enrol students into. Create its first term before ' +
          'running the promotion.',
      )
    }

    return { source, target }
  }

  private async nameOf(academicYearId: string): Promise<string> {
    const name =
      await this.promotionRepository.findAcademicYearName(academicYearId)
    return name ?? academicYearId
  }
}
