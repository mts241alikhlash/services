import { Module } from '@nestjs/common'
import { ConditionController } from './presentation/http/condition.controller.js'
import { PrismaConditionRepository } from './infrastructure/persistence/prisma/prisma-condition.repository.js'
import { IConditionRepository } from './domain/repositories/condition.repository.js'
import { CreateConditionUseCase } from './application/use-cases/create-condition/create-condition.use-case.js'
import { DeleteConditionUseCase } from './application/use-cases/delete-condition/delete-condition.use-case.js'
import { GetConditionsUseCase } from './application/use-cases/get-conditions/get-conditions.use-case.js'
import { UpdateConditionUseCase } from './application/use-cases/update-condition/update-condition.use-case.js'

@Module({
  controllers: [ConditionController],
  providers: [
    { provide: IConditionRepository, useClass: PrismaConditionRepository },
    GetConditionsUseCase,
    CreateConditionUseCase,
    UpdateConditionUseCase,
    DeleteConditionUseCase,
  ],
  exports: [IConditionRepository],
})
export class ConditionModule {}
