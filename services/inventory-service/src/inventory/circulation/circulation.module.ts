import { forwardRef, Module } from '@nestjs/common'
import { AssetModule } from '../asset/asset.module.js'
import { ApprovalModule } from '../approval/approval.module.js'
import { StatusModule } from '../reference-data/status/status.module.js'
import { PrismaCirculationRepository } from './infrastructure/persistence/prisma/prisma-circulation.repository.js'
import { IHistoryCapabilityPort } from './domain/repositories/history.repository.js'
import { ITransactionTypeCapabilityPort } from './domain/repositories/transaction-type.repository.js'
import { IHistoryRepository } from './domain/repositories/history.repository.js'
import {
  ILoanCapabilityPort,
  ILoanItemCapabilityPort,
  ILoanRepository,
} from './domain/repositories/loan.repository.js'
import { ITransactionTypeRepository } from './domain/repositories/transaction-type.repository.js'
import { CreateLoanUseCase } from './application/use-cases/create-loan/create-loan.use-case.js'
import { ReturnLoanUseCase } from './application/use-cases/return-loan/return-loan.use-case.js'
import { GetLoansUseCase } from './application/use-cases/get-loans/get-loans.use-case.js'
import { GetLoanByIdUseCase } from './application/use-cases/get-loan-by-id/get-loan-by-id.use-case.js'
import { GetHistoriesUseCase } from './application/use-cases/get-histories/get-histories.use-case.js'
import { LoanController } from './presentation/http/loan.controller.js'
import { HistoryController } from './presentation/http/history.controller.js'

@Module({
  imports: [AssetModule, forwardRef(() => ApprovalModule), StatusModule],
  controllers: [LoanController, HistoryController],
  providers: [
    PrismaCirculationRepository,
    { provide: ILoanRepository, useExisting: PrismaCirculationRepository },
    { provide: IHistoryRepository, useExisting: PrismaCirculationRepository },
    {
      provide: ITransactionTypeRepository,
      useExisting: PrismaCirculationRepository,
    },
    {
      provide: IHistoryCapabilityPort,
      useExisting: PrismaCirculationRepository,
    },
    {
      provide: ITransactionTypeCapabilityPort,
      useExisting: PrismaCirculationRepository,
    },
    { provide: ILoanCapabilityPort, useExisting: PrismaCirculationRepository },
    {
      provide: ILoanItemCapabilityPort,
      useExisting: PrismaCirculationRepository,
    },
    CreateLoanUseCase,
    ReturnLoanUseCase,
    GetLoansUseCase,
    GetLoanByIdUseCase,
    GetHistoriesUseCase,
  ],
  exports: [
    ILoanRepository,
    IHistoryRepository,
    ITransactionTypeRepository,
    IHistoryCapabilityPort,
    ITransactionTypeCapabilityPort,
    ILoanCapabilityPort,
    ILoanItemCapabilityPort,
  ],
})
export class CirculationModule {}
