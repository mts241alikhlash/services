import { Module, forwardRef } from '@nestjs/common'
import { StudentModule } from '../student/student.module.js'
import { EnrollmentController } from './presentation/http/enrollment.controller.js'
import { EnrollmentInternalController } from './presentation/http/enrollment-internal.controller.js'
import { PrismaEnrollmentRepository } from './infrastructure/persistence/prisma/prisma-enrollment.repository.js'
import { ClassroomCapacityService } from './application/services/classroom-capacity.service.js'
import { BulkCreateStudentEnrollmentUseCase } from './application/use-cases/bulk-create-student-enrollment/bulk-create-student-enrollment.use-case.js'
import { CreateStudentEnrollmentUseCase } from './application/use-cases/create-student-enrollment/create-student-enrollment.use-case.js'
import { DeleteStudentEnrollmentUseCase } from './application/use-cases/delete-student-enrollment/delete-student-enrollment.use-case.js'
import { DropStudentUseCase } from './application/use-cases/drop-student/drop-student.use-case.js'
import { GetStudentEnrollmentByIdUseCase } from './application/use-cases/get-student-enrollment-by-id/get-student-enrollment-by-id.use-case.js'
import { GetStudentEnrollmentsUseCase } from './application/use-cases/get-student-enrollments/get-student-enrollments.use-case.js'
import { TransferStudentUseCase } from './application/use-cases/transfer-student/transfer-student.use-case.js'
import { BulkTransferStudentUseCase } from './application/use-cases/bulk-transfer-student/bulk-transfer-student.use-case.js'
import { UpdateStudentEnrollmentUseCase } from './application/use-cases/update-student-enrollment/update-student-enrollment.use-case.js'
import { EnsureStudentEnrollmentUseCase } from './application/use-cases/ensure-student-enrollment/ensure-student-enrollment.use-case.js'
import { IEnrollmentRepository } from './domain/repositories/enrollment.repository.js'

@Module({
  imports: [forwardRef(() => StudentModule)],
  controllers: [EnrollmentInternalController, EnrollmentController],
  providers: [
    {
      provide: IEnrollmentRepository,
      useClass: PrismaEnrollmentRepository,
    },
    ClassroomCapacityService,
    GetStudentEnrollmentsUseCase,
    GetStudentEnrollmentByIdUseCase,
    CreateStudentEnrollmentUseCase,
    BulkCreateStudentEnrollmentUseCase,
    UpdateStudentEnrollmentUseCase,
    DeleteStudentEnrollmentUseCase,
    TransferStudentUseCase,
    BulkTransferStudentUseCase,
    DropStudentUseCase,
    EnsureStudentEnrollmentUseCase,
  ],
  exports: [IEnrollmentRepository, EnsureStudentEnrollmentUseCase],
})
export class EnrollmentModule {}
