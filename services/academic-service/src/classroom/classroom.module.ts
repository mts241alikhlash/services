import { Module } from '@nestjs/common'
import { ClassroomController } from './presentation/http/classroom.controller.js'
import { ClassroomStructureController } from './presentation/http/classroom-structure.controller.js'
import { ClassroomSupervisorController } from './presentation/http/classroom-supervisor.controller.js'
import { IClassroomRepository } from './domain/repositories/classroom.repository.js'
import { IClassroomStructureRepository } from './domain/repositories/classroom-structure.repository.js'
import { IClassroomSupervisorRepository } from './domain/repositories/classroom-supervisor.repository.js'
import { PrismaClassroomRepository } from './infrastructure/persistence/prisma/prisma-classroom.repository.js'
import { PrismaClassroomStructureRepository } from './infrastructure/persistence/prisma/prisma-classroom-structure.repository.js'
import { PrismaClassroomSupervisorRepository } from './infrastructure/persistence/prisma/prisma-classroom-supervisor.repository.js'
import { AcademicYearModule } from '../academic-year/academic-year.module.js'
import { CopyClassroomsToAcademicYearUseCase } from './application/use-cases/copy-classrooms-to-academic-year/copy-classrooms-to-academic-year.use-case.js'
import { CreateClassroomUseCase } from './application/use-cases/create-classroom/create-classroom.use-case.js'
import { DeleteClassroomUseCase } from './application/use-cases/delete-classroom/delete-classroom.use-case.js'
import { GetClassroomByIdUseCase } from './application/use-cases/get-classroom-by-id/get-classroom-by-id.use-case.js'
import { GetClassroomsUseCase } from './application/use-cases/get-classrooms/get-classrooms.use-case.js'
import { UpdateClassroomUseCase } from './application/use-cases/update-classroom/update-classroom.use-case.js'
import { CreateClassroomStructureUseCase } from './application/use-cases/create-classroom-structure/create-classroom-structure.use-case.js'
import { DeleteClassroomStructureUseCase } from './application/use-cases/delete-classroom-structure/delete-classroom-structure.use-case.js'
import { GetClassroomStructuresUseCase } from './application/use-cases/get-classroom-structures/get-classroom-structures.use-case.js'
import { UpdateClassroomStructureUseCase } from './application/use-cases/update-classroom-structure/update-classroom-structure.use-case.js'
import { CreateClassroomSupervisorUseCase } from './application/use-cases/create-classroom-supervisor/create-classroom-supervisor.use-case.js'
import { DeleteClassroomSupervisorUseCase } from './application/use-cases/delete-classroom-supervisor/delete-classroom-supervisor.use-case.js'
import { GetClassroomSupervisorByIdUseCase } from './application/use-cases/get-classroom-supervisor-by-id/get-classroom-supervisor-by-id.use-case.js'
import { GetClassroomSupervisorsUseCase } from './application/use-cases/get-classroom-supervisors/get-classroom-supervisors.use-case.js'
import { UpdateClassroomSupervisorUseCase } from './application/use-cases/update-classroom-supervisor/update-classroom-supervisor.use-case.js'
import { ClassroomInternalController } from './presentation/http/classroom-internal.controller.js'
import { TeachingAssignmentModule } from '../teaching-assignment/teaching-assignment.module.js'

@Module({
  imports: [TeachingAssignmentModule, AcademicYearModule],
  controllers: [
    ClassroomInternalController,
    ClassroomController,
    ClassroomStructureController,
    ClassroomSupervisorController,
  ],
  providers: [
    { provide: IClassroomRepository, useClass: PrismaClassroomRepository },
    {
      provide: IClassroomStructureRepository,
      useClass: PrismaClassroomStructureRepository,
    },
    {
      provide: IClassroomSupervisorRepository,
      useClass: PrismaClassroomSupervisorRepository,
    },
    CopyClassroomsToAcademicYearUseCase,
    CreateClassroomUseCase,
    DeleteClassroomUseCase,
    GetClassroomByIdUseCase,
    GetClassroomsUseCase,
    UpdateClassroomUseCase,
    CreateClassroomStructureUseCase,
    DeleteClassroomStructureUseCase,
    GetClassroomStructuresUseCase,
    UpdateClassroomStructureUseCase,
    CreateClassroomSupervisorUseCase,
    DeleteClassroomSupervisorUseCase,
    GetClassroomSupervisorByIdUseCase,
    GetClassroomSupervisorsUseCase,
    UpdateClassroomSupervisorUseCase,
  ],
  exports: [
    IClassroomRepository,
    IClassroomStructureRepository,
    IClassroomSupervisorRepository,
  ],
})
export class ClassroomModule {}
