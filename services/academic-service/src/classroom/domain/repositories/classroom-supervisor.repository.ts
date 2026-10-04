import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../shared/domain/interfaces/repository.interface.js'
import {
  ClassroomSupervisorEntity,
  SupervisorWithDetails,
} from '../entities/classroom-supervisor.entity.js'

export type {
  SupervisorWithDetails as ClassroomSupervisorWithDetails,
  SupervisorWithDetails,
}

export interface ClassroomSupervisorQueryInput extends PaginationQueryInput {
  classroomId?: string
  employeeId?: string
  semesterId?: string
}

export interface CreateClassroomSupervisorRepositoryInput {
  classroomId: string
  employeeId: string
  semesterId: string
}

export type UpdateClassroomSupervisorRepositoryInput =
  Partial<CreateClassroomSupervisorRepositoryInput>

export interface SupervisedClassroomRow {
  id: string
  code: string
  name: string | null
}

export abstract class IClassroomSupervisorRepository {
  abstract findAll(
    query: ClassroomSupervisorQueryInput,
  ): Promise<PaginatedResult<SupervisorWithDetails>>
  abstract findById(id: string): Promise<SupervisorWithDetails | null>
  abstract findAssignment(
    classroomId: string,
    semesterId: string,
    excludeId?: string,
  ): Promise<ClassroomSupervisorEntity | null>
  abstract findEmployeeAssignment(
    employeeId: string,
    semesterId: string,
    excludeId?: string,
  ): Promise<ClassroomSupervisorEntity | null>
  abstract findEmployeeById(id: string): Promise<{ id: string } | null>
  abstract supervises(
    employeeId: string,
    classroomId: string,
    semesterId: string,
  ): Promise<boolean>
  abstract listSupervisedClassrooms(
    employeeId: string,
    semesterId: string,
  ): Promise<SupervisedClassroomRow[]>
  abstract create(
    input: CreateClassroomSupervisorRepositoryInput,
  ): Promise<SupervisorWithDetails>
  abstract update(
    id: string,
    input: UpdateClassroomSupervisorRepositoryInput,
  ): Promise<SupervisorWithDetails>
  abstract remove(id: string): Promise<ClassroomSupervisorEntity>
}
