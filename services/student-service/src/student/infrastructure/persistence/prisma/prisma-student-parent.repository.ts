import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type {
  CreateStudentParentRepositoryInput,
  UpdateStudentParentRepositoryInput,
} from '../../../domain/repositories/student-parent.repository.js'
import { IStudentParentRepository } from '../../../domain/repositories/student-parent.repository.js'
import {
  STUDENT_PARENT_INCLUDE,
  StudentParentRow,
  StudentParentWithDetails,
} from './prisma-student-parent.includes.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'

@Injectable()
export class PrismaStudentParentRepository extends IStudentParentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly academicLookup: IAcademicLookupPort,
  ) {
    super()
  }

  private async attachReferences(
    rows: StudentParentRow[],
  ): Promise<StudentParentWithDetails[]> {
    if (rows.length === 0) return []

    const [occupations, educations] = await Promise.all([
      this.academicLookup.listOccupationsByIds([
        ...new Set(rows.map((row) => row.parent.occupationId)),
      ]),
      this.academicLookup.listEducationsByIds([
        ...new Set(
          rows
            .map((row) => row.parent.educationId)
            .filter((id): id is string => id !== null),
        ),
      ]),
    ])
    const occupationById = new Map(occupations.map((row) => [row.id, row]))
    const educationById = new Map(educations.map((row) => [row.id, row]))

    return rows.map((row) => ({
      ...row,
      parent: {
        ...row.parent,
        occupation: occupationById.get(row.parent.occupationId) ?? null,
        education: row.parent.educationId
          ? (educationById.get(row.parent.educationId) ?? null)
          : null,
      },
    }))
  }

  private async attachOne(
    row: StudentParentRow | null,
  ): Promise<StudentParentWithDetails | null> {
    if (!row) return null
    const [decorated] = await this.attachReferences([row])
    return decorated
  }

  async findByStudentId(
    studentId: string,
  ): Promise<StudentParentWithDetails[]> {
    const rows = await this.prisma.studentParent.findMany({
      where: {
        studentId,
        student: { deletedAt: null },
        parent: { deletedAt: null },
      },
      include: STUDENT_PARENT_INCLUDE,
      orderBy: [{ isPrimary: 'desc' }, { relation: 'asc' }],
    })
    return this.attachReferences(rows)
  }

  async findAll(studentId: string): Promise<StudentParentWithDetails[]> {
    return this.findByStudentId(studentId)
  }

  async findById(id: string): Promise<StudentParentWithDetails | null> {
    return this.attachOne(
      await this.prisma.studentParent.findFirst({
        where: {
          id,
          student: { deletedAt: null },
          parent: { deletedAt: null },
        },
        include: STUDENT_PARENT_INCLUDE,
      }),
    )
  }

  async findByStudentAndParent(
    studentId: string,
    parentId: string,
  ): Promise<StudentParentWithDetails | null> {
    return this.attachOne(
      await this.prisma.studentParent.findUnique({
        where: { studentId_parentId: { studentId, parentId } },
        include: STUDENT_PARENT_INCLUDE,
      }),
    )
  }

  async findPair(
    studentId: string,
    parentId: string,
  ): Promise<StudentParentWithDetails | null> {
    return this.findByStudentAndParent(studentId, parentId)
  }

  async findStudent(id: string): Promise<{ id: string } | null> {
    return this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
  }

  async findParent(id: string): Promise<{ id: string } | null> {
    return this.prisma.parent.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
  }

  async create(
    dto: CreateStudentParentRepositoryInput,
  ): Promise<StudentParentWithDetails> {
    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.studentParent.updateMany({
          where: { studentId: dto.studentId, isPrimary: true },
          data: { isPrimary: false },
        })
      }
      return tx.studentParent.create({
        data: {
          studentId: dto.studentId,
          parentId: dto.parentId,
          relation: dto.relation,
          isPrimary: dto.isPrimary ?? false,
        },
        include: STUDENT_PARENT_INCLUDE,
      })
    })

    const [created] = await this.attachReferences([row])
    return created
  }

  async update(
    id: string,
    input: UpdateStudentParentRepositoryInput,
    studentId?: string,
  ): Promise<StudentParentWithDetails> {
    const row = await this.prisma.$transaction(async (tx) => {
      if (input.isPrimary && studentId) {
        await tx.studentParent.updateMany({
          where: { studentId, isPrimary: true, NOT: { id } },
          data: { isPrimary: false },
        })
      }
      return tx.studentParent.update({
        where: { id },
        data: input,
        include: STUDENT_PARENT_INCLUDE,
      })
    })

    const [updated] = await this.attachReferences([row])
    return updated
  }

  async remove(id: string): Promise<StudentParentWithDetails> {
    const row = await this.prisma.studentParent.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: STUDENT_PARENT_INCLUDE,
    })
    const [removed] = await this.attachReferences([row])
    return removed
  }

  async clearPrimaryForStudent(
    studentId: string,
    excludeId?: string,
  ): Promise<{ count: number }> {
    return this.prisma.studentParent.updateMany({
      where: {
        studentId,
        isPrimary: true,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      data: { isPrimary: false },
    })
  }
}
