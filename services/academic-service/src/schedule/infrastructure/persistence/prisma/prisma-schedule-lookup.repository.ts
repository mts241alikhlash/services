import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IScheduleLookupRepository } from '../../../domain/repositories/schedule-lookup.repository.js'
import type { CreateTeachingAssignmentFromScheduleInput } from '../../../domain/repositories/schedule.repository.js'
import {
  createTeachingAssignmentRow,
  findActiveSemesterId,
  findAnyEmployeeIdBySubject,
  findTeachingAssignmentId,
  findTeachingAssignmentIdBySubject,
  findValidClassroomId,
} from './prisma-schedule.lookups.js'

@Injectable()
export class PrismaScheduleLookupRepository extends IScheduleLookupRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findTeachingAssignmentById(id: string) {
    return findTeachingAssignmentId(this.prisma, id)
  }

  async findValidClassroomById(id: string) {
    return findValidClassroomId(this.prisma, id)
  }

  async findActiveSemester() {
    return findActiveSemesterId(this.prisma)
  }

  async findTeachingAssignmentBySubjectAndSemester(
    classroomId: string,
    subjectId: string,
    semesterId: string,
  ) {
    return findTeachingAssignmentIdBySubject(
      this.prisma,
      classroomId,
      subjectId,
      semesterId,
    )
  }

  async findAnyEmployeeIdForSubject(subjectId: string) {
    return findAnyEmployeeIdBySubject(this.prisma, subjectId)
  }

  async createTeachingAssignment(
    input: CreateTeachingAssignmentFromScheduleInput,
  ) {
    return createTeachingAssignmentRow(this.prisma, input)
  }
}
