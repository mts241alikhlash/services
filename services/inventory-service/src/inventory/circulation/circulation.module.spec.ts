import { Test } from '@nestjs/testing'
import { PrismaService } from '../../core/database/prisma.service.js'
import { PrismaModule } from '../../core/database/prisma.module.js'
import { CreateLoanUseCase } from './application/use-cases/create-loan/create-loan.use-case.js'
import { GetHistoriesUseCase } from './application/use-cases/get-histories/get-histories.use-case.js'
import { GetLoanByIdUseCase } from './application/use-cases/get-loan-by-id/get-loan-by-id.use-case.js'
import { GetLoansUseCase } from './application/use-cases/get-loans/get-loans.use-case.js'
import { ReturnLoanUseCase } from './application/use-cases/return-loan/return-loan.use-case.js'
import { IHistoryCapabilityPort } from './domain/repositories/history.repository.js'
import { ITransactionTypeCapabilityPort } from './domain/repositories/transaction-type.repository.js'
import {
  IAssetUnitCapabilityPort,
  IAssetUnitMutationPort,
} from '../asset/index.js'
import { IApprovalCapabilityPort } from '../approval/index.js'
import { IStatusLookupPort } from '../reference-data/status/index.js'
import { IHistoryRepository } from './domain/repositories/history.repository.js'
import { ILoanRepository } from './domain/repositories/loan.repository.js'
import { ITransactionTypeRepository } from './domain/repositories/transaction-type.repository.js'
import { HistoryController } from './presentation/http/history.controller.js'
import { LoanController } from './presentation/http/loan.controller.js'
import { CirculationModule } from './circulation.module.js'
import { PrismaCirculationRepository } from './infrastructure/persistence/prisma/prisma-circulation.repository.js'

describe('CirculationModule', () => {
  it('resolves every split port to one Prisma adapter instance', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, CirculationModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile()

    const adapter = moduleRef.get(PrismaCirculationRepository)
    expect(moduleRef.get(ILoanRepository)).toBe(adapter)
    expect(moduleRef.get(IHistoryRepository)).toBe(adapter)
    expect(moduleRef.get(ITransactionTypeRepository)).toBe(adapter)
    expect(moduleRef.get(IHistoryCapabilityPort)).toBe(adapter)
    expect(moduleRef.get(ITransactionTypeCapabilityPort)).toBe(adapter)
    expect(moduleRef.get(IAssetUnitCapabilityPort)).toBeDefined()
    expect(moduleRef.get(IAssetUnitMutationPort)).toBeDefined()
    expect(moduleRef.get(IApprovalCapabilityPort)).toBeDefined()
    expect(moduleRef.get(IStatusLookupPort)).toBeDefined()
    await moduleRef.close()
  })

  it('registers moved use cases and controllers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, CirculationModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile()

    for (const provider of [
      CreateLoanUseCase,
      ReturnLoanUseCase,
      GetLoansUseCase,
      GetLoanByIdUseCase,
      GetHistoriesUseCase,
      LoanController,
      HistoryController,
    ]) {
      expect(moduleRef.get(provider)).toBeInstanceOf(provider)
    }
    await moduleRef.close()
  })
})
