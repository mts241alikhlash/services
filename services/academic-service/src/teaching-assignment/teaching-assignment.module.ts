import { Module } from '@nestjs/common'
import { TeachingAssignmentController } from './presentation/http/teaching-assignment.controller.js'
import { PrismaTeachingAssignmentRepository } from './infrastructure/persistence/prisma/prisma-teaching-assignment.repository.js'
import { CreateTeachingAssignmentUseCase } from './application/use-cases/create-teaching-assignment/create-teaching-assignment.use-case.js'
import { DeleteTeachingAssignmentUseCase } from './application/use-cases/delete-teaching-assignment/delete-teaching-assignment.use-case.js'
import { GetTeachingAssignmentByIdUseCase } from './application/use-cases/get-teaching-assignment-by-id/get-teaching-assignment-by-id.use-case.js'
import { GetTeachingAssignmentsUseCase } from './application/use-cases/get-teaching-assignments/get-teaching-assignments.use-case.js'
import { GetMyTeachingAssignmentsUseCase } from './application/use-cases/get-my-teaching-assignments/get-my-teaching-assignments.use-case.js'
import { UpdateTeachingAssignmentUseCase } from './application/use-cases/update-teaching-assignment/update-teaching-assignment.use-case.js'
import { ITeachingAssignmentRepository } from './domain/repositories/teaching-assignment.repository.js'
import { EmployeeIdentityModule } from '../platform/employee-identity/employee-identity.module.js'
import { TeachingAssignmentInternalController } from './presentation/http/teaching-assignment-internal.controller.js'

@Module({
  imports: [EmployeeIdentityModule],
  controllers: [
    TeachingAssignmentInternalController,
    TeachingAssignmentController,
  ],
  providers: [
    {
      provide: ITeachingAssignmentRepository,
      useClass: PrismaTeachingAssignmentRepository,
    },
    GetTeachingAssignmentsUseCase,
    GetMyTeachingAssignmentsUseCase,
    GetTeachingAssignmentByIdUseCase,
    CreateTeachingAssignmentUseCase,
    UpdateTeachingAssignmentUseCase,
    DeleteTeachingAssignmentUseCase,
  ],
  exports: [ITeachingAssignmentRepository],
})
export class TeachingAssignmentModule {}
