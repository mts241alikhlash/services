import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  AssessmentWeightEntity,
  IAssessmentWeightRepository,
  ReplaceAssessmentWeightsInput,
} from '../../../domain/repositories/assessment-weight.repository.js'
import { AssessmentType } from '../../../../shared/domain/enums/assessment-type.enum.js'

function toWeightEntity(row: {
  type: keyof typeof AssessmentType
  weight: number
}): AssessmentWeightEntity {
  return { type: AssessmentType[row.type], weight: row.weight }
}

@Injectable()
export class PrismaAssessmentWeightRepository extends IAssessmentWeightRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findByTeachingAssignment(
    teachingAssignmentId: string,
  ): Promise<AssessmentWeightEntity[]> {
    return this.prisma.assessmentWeight
      .findMany({
        where: { teachingAssignmentId },
        select: { type: true, weight: true },
        orderBy: { type: 'asc' },
      })
      .then((rows) => rows.map(toWeightEntity))
  }

  async replaceForTeachingAssignment(
    input: ReplaceAssessmentWeightsInput,
  ): Promise<AssessmentWeightEntity[]> {
    const { teachingAssignmentId, weights } = input

    return this.prisma.$transaction(async (tx) => {
      await tx.assessmentWeight.deleteMany({ where: { teachingAssignmentId } })

      if (weights.length > 0) {
        await tx.assessmentWeight.createMany({
          data: weights.map((weight) => ({
            teachingAssignmentId,
            type: weight.type,
            weight: weight.weight,
          })),
        })
      }

      return tx.assessmentWeight
        .findMany({
          where: { teachingAssignmentId },
          select: { type: true, weight: true },
          orderBy: { type: 'asc' },
        })
        .then((rows) => rows.map(toWeightEntity))
    })
  }
}
