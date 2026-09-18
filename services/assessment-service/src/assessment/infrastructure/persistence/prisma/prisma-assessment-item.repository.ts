import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { resolveUserRefs } from '../../../../shared/utils/resolve-user-refs.helper.js'
import { resolveAssessmentRefs } from '../../../../shared/utils/assessment-refs.helper.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import type {
  AssessmentItemQueryInput,
  CreateAssessmentItemRepositoryInput,
  UpdateAssessmentItemRepositoryInput,
} from '../../../domain/repositories/assessment-item.repository.js'
import { IAssessmentItemRepository } from '../../../domain/repositories/assessment-item.repository.js'
import { AssessmentItemWithDetails } from '../../../domain/entities/assessment-item.entity.js'
import { toAssignmentRef } from './prisma-assessment.refs.js'
import {
  ASSESSMENT_ITEM_WITH_DETAILS_INCLUDE,
  AssessmentItemRow,
} from './prisma-assessment.includes.js'

@Injectable()
export class PrismaAssessmentItemRepository extends IAssessmentItemRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
    private readonly academicLookup: IAcademicLookupPort,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {
    super()
  }

  private async decorate(
    rows: AssessmentItemRow[],
  ): Promise<AssessmentItemWithDetails[]> {
    if (rows.length === 0) return []

    const refs = await resolveAssessmentRefs(
      this.enrollmentLookup,
      this.academicLookup,
      { teachingAssignmentIds: rows.map((row) => row.teachingAssignmentId) },
    )

    const assignments = rows
      .map((row) => refs.assignment(row.teachingAssignmentId))
      .filter((assignment) => assignment !== null)

    const userRefs = await resolveUserRefs(
      assignments
        .map((assignment) => assignment.employeeUserId)
        .filter((userId): userId is string => userId !== null),
      this.profileLookupPort,
    )

    return rows.map((row) => {
      const assignment = refs.assignment(row.teachingAssignmentId)
      return {
        ...row,
        teachingAssignment: assignment
          ? toAssignmentRef(assignment, userRefs)
          : undefined,
      }
    })
  }

  async findAll(query: AssessmentItemQueryInput) {
    const { page = 1, limit = 10, teachingAssignmentId, type } = query
    const skip = (page - 1) * limit

    const where: Prisma.AssessmentItemWhereInput = {
      deletedAt: null,
      ...(teachingAssignmentId && { teachingAssignmentId }),
      ...(type && { type }),
    }

    const [rows, total] = await Promise.all([
      this.prisma.assessmentItem.findMany({
        where,
        include: ASSESSMENT_ITEM_WITH_DETAILS_INCLUDE,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.assessmentItem.count({ where }),
    ])

    return { data: await this.decorate(rows), total, page, limit }
  }

  async findById(id: string) {
    const row = await this.prisma.assessmentItem.findFirst({
      where: { id, deletedAt: null },
      include: ASSESSMENT_ITEM_WITH_DETAILS_INCLUDE,
    })
    if (!row) return null
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async create(dto: CreateAssessmentItemRepositoryInput) {
    const row = await this.prisma.assessmentItem.create({
      data: {
        teachingAssignmentId: dto.teachingAssignmentId,
        name: dto.name,
        type: dto.type,
        ...(dto.weight !== undefined && { weight: dto.weight }),
        ...(dto.maxScore !== undefined && { maxScore: dto.maxScore }),
      },
      include: ASSESSMENT_ITEM_WITH_DETAILS_INCLUDE,
    })
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async update(id: string, dto: UpdateAssessmentItemRepositoryInput) {
    const row = await this.prisma.assessmentItem.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
        ...(dto.maxScore !== undefined && { maxScore: dto.maxScore }),
      },
      include: ASSESSMENT_ITEM_WITH_DETAILS_INCLUDE,
    })
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async remove(id: string) {
    return this.softDelete(id)
  }

  async softDelete(id: string) {
    return this.prisma.assessmentItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async countScoresWithAssessmentItem(id: string): Promise<number> {
    return this.prisma.studentScore.count({
      where: { assessmentItemId: id, deletedAt: null },
    })
  }
}
