import { Module } from '@nestjs/common'
import { UserModule } from '../platform/user/user.module.js'
import { EmployeeController } from './presentation/http/employee.controller.js'
import { EmployeeImportExportController } from './presentation/http/employee-import-export.controller.js'
import { EmployeeInternalController } from './presentation/http/employee-internal.controller.js'
import { EmployeePositionsController } from './presentation/http/employee-position.controller.js'
import { IEmployeeRepository } from './domain/repositories/employee.repository.js'
import { IEmployeeIdentityReadPort } from './domain/repositories/employee-identity-read.port.js'
import { PrismaEmployeeIdentityReadPort } from './infrastructure/persistence/prisma/prisma-employee-identity.read-port.js'
import { IEmployeePositionRepository } from './domain/repositories/employee-position.repository.js'
import { PrismaEmployeeRepository } from './infrastructure/persistence/prisma/prisma-employee.repository.js'
import { PrismaEmployeePositionRepository } from './infrastructure/persistence/prisma/prisma-employee-position.repository.js'
import { ExcelEmployeeParser as ExcelEmployeeParserConcrete } from './infrastructure/parsers/excel-employee.parser.js'
import { ExcelEmployeeParser } from './domain/repositories/employee-excel-parser.interface.js'
import { CreateEmployeeUseCase } from './application/use-cases/create-employee/create-employee.use-case.js'
import { DeleteEmployeeUseCase } from './application/use-cases/delete-employee/delete-employee.use-case.js'
import { GetEmployeeByIdUseCase } from './application/use-cases/get-employee-by-id/get-employee-by-id.use-case.js'
import { GetMyEmployeeUseCase } from './application/use-cases/get-my-employee/get-my-employee.use-case.js'
import { GetEmployeesUseCase } from './application/use-cases/get-employees/get-employees.use-case.js'
import { UpdateEmployeeUseCase } from './application/use-cases/update-employee/update-employee.use-case.js'
import { UpdateEmployeeProfileUseCase } from './application/use-cases/update-employee-profile/update-employee-profile.use-case.js'
import { ToggleEmployeeActiveUseCase } from './application/use-cases/toggle-employee-active/toggle-employee-active.use-case.js'
import { BulkImportEmployeesUseCase } from './application/use-cases/bulk-import-employee/bulk-import-employee.use-case.js'
import { ResolveBulkImportConflictsUseCase } from './application/use-cases/resolve-bulk-import-conflicts/resolve-bulk-import-conflicts.use-case.js'
import { ExportEmployeesUseCase } from './application/use-cases/export-employee/export-employee.use-case.js'
import { EmployeePositionUseCase } from './application/use-cases/employee-position/employee-position.use-case.js'

@Module({
  imports: [UserModule],
  controllers: [
    EmployeeInternalController,
    EmployeeImportExportController,
    EmployeeController,
    EmployeePositionsController,
  ],
  providers: [
    { provide: IEmployeeRepository, useClass: PrismaEmployeeRepository },
    {
      provide: IEmployeeIdentityReadPort,
      useClass: PrismaEmployeeIdentityReadPort,
    },
    {
      provide: IEmployeePositionRepository,
      useClass: PrismaEmployeePositionRepository,
    },
    { provide: ExcelEmployeeParser, useClass: ExcelEmployeeParserConcrete },
    CreateEmployeeUseCase,
    DeleteEmployeeUseCase,
    GetEmployeeByIdUseCase,
    GetMyEmployeeUseCase,
    GetEmployeesUseCase,
    UpdateEmployeeUseCase,
    UpdateEmployeeProfileUseCase,
    ToggleEmployeeActiveUseCase,
    BulkImportEmployeesUseCase,
    ResolveBulkImportConflictsUseCase,
    ExportEmployeesUseCase,
    EmployeePositionUseCase,
  ],
  exports: [
    IEmployeeRepository,
    IEmployeePositionRepository,
    IEmployeeIdentityReadPort,
  ],
})
export class EmployeeModule {}
