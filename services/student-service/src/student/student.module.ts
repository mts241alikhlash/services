import { GetMyClassroomUseCase } from './application/use-cases/get-my-classroom/get-my-classroom.use-case.js'
import { Module, forwardRef } from '@nestjs/common'
import { UserModule } from '../platform/user/user.module.js'
import { EnrollmentModule } from '../enrollment/enrollment.module.js'
import { StudentController } from './presentation/http/student.controller.js'
import { StudentImportExportController } from './presentation/http/student-import-export.controller.js'
import { StudentInternalController } from './presentation/http/student-internal.controller.js'
import { StudentParentController } from './presentation/http/student-parent.controller.js'
import { IStudentRepository } from './domain/repositories/student.repository.js'
import { IStudentIdentityReadPort } from './domain/repositories/student-identity-read.port.js'
import { PrismaStudentIdentityReadPort } from './infrastructure/persistence/prisma/prisma-student-identity.read-port.js'
import { IStudentParentRepository } from './domain/repositories/student-parent.repository.js'
import { PrismaStudentRepository } from './infrastructure/persistence/prisma/prisma-student.repository.js'
import { PrismaStudentParentRepository } from './infrastructure/persistence/prisma/prisma-student-parent.repository.js'
import { ExcelStudentParser as ExcelStudentParserConcrete } from './infrastructure/parsers/excel-student.parser.js'
import { ExcelStudentParser } from './domain/repositories/student-excel-parser.interface.js'
import { CreateStudentUseCase } from './application/use-cases/create-student/create-student.use-case.js'
import { CreateStudentWithRelationsUseCase } from './application/use-cases/create-student-with-relations/create-student-with-relations.use-case.js'
import { DeleteStudentUseCase } from './application/use-cases/delete-student/delete-student.use-case.js'
import { GetStudentByIdUseCase } from './application/use-cases/get-student-by-id/get-student-by-id.use-case.js'
import { GetMyStudentUseCase } from './application/use-cases/get-my-student/get-my-student.use-case.js'
import { GetStudentsUseCase } from './application/use-cases/get-students/get-students.use-case.js'
import { UpdateStudentUseCase } from './application/use-cases/update-student/update-student.use-case.js'
import { ToggleStudentActiveUseCase } from './application/use-cases/toggle-student-active/toggle-student-active.use-case.js'
import { BulkImportStudentsUseCase } from './application/use-cases/bulk-import-student/bulk-import-student.use-case.js'
import { ResolveBulkImportConflictsUseCase } from './application/use-cases/resolve-bulk-import-conflicts/resolve-bulk-import-conflicts.use-case.js'
import { ExportStudentsUseCase } from './application/use-cases/export-student/export-student.use-case.js'
import { CreateStudentParentUseCase } from './application/use-cases/create-student-parent/create-student-parent.use-case.js'
import { GetStudentParentsListUseCase } from './application/use-cases/get-student-parents-list/get-student-parents-list.use-case.js'
import { GetStudentParentByIdUseCase } from './application/use-cases/get-student-parent-by-id/get-student-parent-by-id.use-case.js'
import { UpdateStudentParentUseCase } from './application/use-cases/update-student-parent/update-student-parent.use-case.js'
import { DeleteStudentParentUseCase } from './application/use-cases/delete-student-parent/delete-student-parent.use-case.js'
import { UpdateStudentProfileUseCase } from './application/use-cases/update-student-profile/update-student-profile.use-case.js'
import { EnrolExistingAccountUseCase } from './application/use-cases/enrol-existing-account/enrol-existing-account.use-case.js'

@Module({
  imports: [UserModule, forwardRef(() => EnrollmentModule)],
  controllers: [
    StudentInternalController,
    StudentImportExportController,
    StudentController,
    StudentParentController,
  ],
  providers: [
    GetMyClassroomUseCase,
    { provide: IStudentRepository, useClass: PrismaStudentRepository },
    {
      provide: IStudentIdentityReadPort,
      useClass: PrismaStudentIdentityReadPort,
    },
    {
      provide: IStudentParentRepository,
      useClass: PrismaStudentParentRepository,
    },
    { provide: ExcelStudentParser, useClass: ExcelStudentParserConcrete },
    CreateStudentUseCase,
    CreateStudentWithRelationsUseCase,
    EnrolExistingAccountUseCase,
    DeleteStudentUseCase,
    GetStudentByIdUseCase,
    GetMyStudentUseCase,
    GetStudentsUseCase,
    UpdateStudentUseCase,
    ToggleStudentActiveUseCase,
    BulkImportStudentsUseCase,
    ResolveBulkImportConflictsUseCase,
    ExportStudentsUseCase,
    CreateStudentParentUseCase,
    GetStudentParentsListUseCase,
    GetStudentParentByIdUseCase,
    UpdateStudentParentUseCase,
    DeleteStudentParentUseCase,
    UpdateStudentProfileUseCase,
  ],
  exports: [
    IStudentRepository,
    IStudentParentRepository,
    IStudentIdentityReadPort,
  ],
})
export class StudentModule {}
