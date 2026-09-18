import { Injectable } from '@nestjs/common'
import { Prisma, ReportCard } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type {
  ReportCardQueryInput,
  ReportCardSummary,
  ReportCardWithDetails,
  CreateReportCardRepositoryInput,
  ReportCardSubjectInput,
  UpdateReportCardRepositoryInput,
} from '../../../domain/repositories/report-card.repository.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { decorateReportCards } from './prisma-report-card.refs.js'
import { IReportCardRepository } from '../../../domain/repositories/report-card.repository.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import {
  REPORT_CARD_WITH_DETAILS_INCLUDE,
  ReportCardRow,
} from './prisma-report-card.includes.js'

function toSubjectRow(subject: ReportCardSubjectInput) {
  return {
    subjectId: subject.subjectId,
    subjectCode: subject.subjectCode ?? null,
    subjectName: subject.subjectName,
    score: subject.score,
    passingScore: subject.passingScore,
    predicate: subject.predicate,
    description: subject.description,
    isComplete: subject.isComplete,
  }
}

@Injectable()
export class PrismaReportCardRepository extends IReportCardRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly academicLookup: IAcademicLookupPort,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {
    super()
  }

  private async decorate(
    rows: ReportCardRow[],
  ): Promise<ReportCardWithDetails[]> {
    return decorateReportCards(rows, this.enrollmentLookup, this.academicLookup)
  }

  private async decorateOne(
    row: ReportCardRow,
  ): Promise<ReportCardWithDetails> {
    const [decorated] = await this.decorate([row])
    return decorated
  }

  async findAll(
    query: ReportCardQueryInput,
  ): Promise<PaginatedResult<ReportCardWithDetails, ReportCardSummary>> {
    const {
      page = 1,
      limit = 10,
      studentId,
      classroomId,
      semesterId,
      isPublished,
    } = query
    const skip = (page - 1) * limit

    const resolvedSemesterId =
      semesterId ?? (await this.academicLookup.findActiveSemester())?.id

    const scoped = Boolean(studentId ?? classroomId ?? resolvedSemesterId)
    const scopedEnrollmentIds = scoped
      ? (
          await this.enrollmentLookup.search({
            studentId,
            classroomId,
            semesterId: resolvedSemesterId,
          })
        ).map((enrolment) => enrolment.id)
      : null

    const where: Prisma.ReportCardWhereInput = {
      deletedAt: null,
      ...(isPublished !== undefined && { isPublished }),
      ...(scopedEnrollmentIds !== null && {
        enrollmentId: { in: scopedEnrollmentIds },
      }),
    }

    const [rows, total, published, averages] = await Promise.all([
      this.prisma.reportCard.findMany({
        where,
        include: REPORT_CARD_WITH_DETAILS_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reportCard.count({ where }),
      this.prisma.reportCard.count({ where: { ...where, isPublished: true } }),
      this.prisma.reportCard.aggregate({
        where,
        _avg: { totalAverage: true },
      }),
    ])

    return {
      data: await this.decorate(rows),
      total,
      page,
      limit,
      summary: {
        published,
        draft: total - published,
        averageScore: averages._avg.totalAverage,
      },
    }
  }

  async findById(id: string): Promise<ReportCardWithDetails | null> {
    const row = await this.prisma.reportCard.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: REPORT_CARD_WITH_DETAILS_INCLUDE,
    })
    if (!row) return null
    return this.decorateOne(row)
  }

  async findOwnership(
    id: string,
  ): Promise<{ enrollmentId: string; studentId: string } | null> {
    const row = await this.prisma.reportCard.findFirst({
      where: { id, deletedAt: null },
      select: { enrollmentId: true },
    })
    if (!row) return null

    const enrolment = await this.enrollmentLookup.findSummary(row.enrollmentId)
    if (!enrolment) return null

    return {
      enrollmentId: row.enrollmentId,
      studentId: enrolment.studentId,
    }
  }

  async findAveragesByEnrollmentIds(
    enrollmentIds: string[],
  ): Promise<{ enrollmentId: string; totalAverage: number | null }[]> {
    if (enrollmentIds.length === 0) return []

    return this.prisma.reportCard.findMany({
      where: { enrollmentId: { in: enrollmentIds }, deletedAt: null },
      select: { enrollmentId: true, totalAverage: true },
    })
  }

  async findByEnrollmentId(
    enrollmentId: string,
  ): Promise<ReportCardWithDetails | null> {
    const row = await this.prisma.reportCard.findFirst({
      where: {
        enrollmentId,
        deletedAt: null,
      },
      include: REPORT_CARD_WITH_DETAILS_INCLUDE,
    })
    if (!row) return null
    return this.decorateOne(row)
  }

  async create(
    dto: CreateReportCardRepositoryInput,
  ): Promise<ReportCardWithDetails> {
    const { subjects, ...fields } = dto

    const row = await this.prisma.reportCard.create({
      data: {
        ...fields,
        ...(subjects?.length
          ? { subjects: { create: subjects.map(toSubjectRow) } }
          : {}),
      },
      include: REPORT_CARD_WITH_DETAILS_INCLUDE,
    })
    return this.decorateOne(row)
  }

  async upsert(
    input: CreateReportCardRepositoryInput,
  ): Promise<ReportCardWithDetails> {
    const { enrollmentId, subjects, ...fields } = input

    const row = await this.prisma.$transaction(async (tx) => {
      const card = await tx.reportCard.upsert({
        where: { enrollmentId },
        create: { enrollmentId, ...fields },
        update: fields,
      })

      if (subjects) {
        await tx.reportCardSubject.deleteMany({
          where: { reportCardId: card.id },
        })
        if (subjects.length > 0) {
          await tx.reportCardSubject.createMany({
            data: subjects.map((subject) => ({
              reportCardId: card.id,
              ...toSubjectRow(subject),
            })),
          })
        }
      }

      return tx.reportCard.findUniqueOrThrow({
        where: { id: card.id },
        include: REPORT_CARD_WITH_DETAILS_INCLUDE,
      })
    })
    return this.decorateOne(row)
  }

  async update(
    id: string,
    data: UpdateReportCardRepositoryInput,
  ): Promise<ReportCardWithDetails> {
    const row = await this.prisma.reportCard.update({
      where: { id },
      data,
      include: REPORT_CARD_WITH_DETAILS_INCLUDE,
    })
    return this.decorateOne(row)
  }

  async calculateAndApplyClassroomRanks(
    classroomId: string,
    semesterId: string,
    targetEnrollmentId?: string,
  ): Promise<number | null> {
    const enrollments = await this.enrollmentLookup.search({
      classroomId,
      semesterId,
    })
    if (enrollments.length === 0) return null

    const reportCardsInClass = await this.prisma.reportCard.findMany({
      where: {
        deletedAt: null,
        totalAverage: { not: null },
        enrollmentId: { in: enrollments.map((enrolment) => enrolment.id) },
      },
      select: { id: true, enrollmentId: true, totalAverage: true },
      orderBy: { totalAverage: 'desc' },
    })

    let targetRank: number | null = null
    for (let i = 0; i < reportCardsInClass.length; i++) {
      const item = reportCardsInClass[i]
      const rankValue = i + 1
      await this.prisma.reportCard.update({
        where: { id: item.id },
        data: { rank: rankValue },
      })
      if (item.enrollmentId === targetEnrollmentId) {
        targetRank = rankValue
      }
    }
    return targetRank
  }

  async remove(id: string): Promise<ReportCard> {
    return this.softDelete(id)
  }

  async softDelete(id: string): Promise<ReportCard> {
    return this.prisma.reportCard.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
