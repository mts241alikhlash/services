import { Module } from '@nestjs/common'
import { ParentController } from './presentation/http/parent.controller.js'
import { ParentInternalController } from './presentation/http/parent-internal.controller.js'
import { IParentRepository } from './domain/repositories/parent.repository.js'
import { PrismaParentRepository } from './infrastructure/persistence/prisma/prisma-parent.repository.js'
import { CreateParentUseCase } from './application/use-cases/create-parent/create-parent.use-case.js'
import { DeleteParentUseCase } from './application/use-cases/delete-parent/delete-parent.use-case.js'
import { GetParentByIdUseCase } from './application/use-cases/get-parent-by-id/get-parent-by-id.use-case.js'
import { GetParentsUseCase } from './application/use-cases/get-parents/get-parents.use-case.js'
import { UpdateParentUseCase } from './application/use-cases/update-parent/update-parent.use-case.js'

@Module({
  controllers: [ParentInternalController, ParentController],
  providers: [
    { provide: IParentRepository, useClass: PrismaParentRepository },
    GetParentsUseCase,
    GetParentByIdUseCase,
    CreateParentUseCase,
    UpdateParentUseCase,
    DeleteParentUseCase,
  ],
  exports: [IParentRepository],
})
export class ParentModule {}
