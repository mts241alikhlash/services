import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'
import { IAssetUnitDetailsCapabilityPort } from '../../../../asset/index.js'
import {
  IHistoryCapabilityPort,
  IHistoryRepository,
  type CreateHistoryRepositoryInput,
  type RecordHistoryCapabilityInput,
  type HistoryQueryInput,
  type HistoryRepositoryOutput,
} from '../../../domain/repositories/history.repository.js'
import {
  ILoanCapabilityPort,
  ILoanItemCapabilityPort,
  ILoanRepository,
  type CreateLoanRepositoryInput,
  type LoanDetailsCapabilityOutput,
  type LoanItemCapabilityOutput,
  type LoanQueryInput,
  type LoanRepositoryOutput,
  type LoanStatusCapabilityOutput,
  type ProcessCreateLoanInput,
  type ProcessReturnLoanInput,
  type UpdateLoanRepositoryInput,
} from '../../../domain/repositories/loan.repository.js'
import {
  ITransactionTypeCapabilityPort,
  type TransactionTypeRepositoryOutput,
} from '../../../domain/repositories/transaction-type.repository.js'
import {
  mapHistory,
  mapLoan,
  mapTransactionType,
} from './prisma-circulation.mapping.js'
import {
  findAllHistories,
  findAllLoans,
  findLoanById,
  findLoanDetailsByIds,
  findLoanItemUnitIds,
  type ReaderDependencies,
} from './prisma-circulation.reader.js'

@Injectable()
export class PrismaCirculationRepository
  implements
    ILoanRepository,
    ILoanCapabilityPort,
    ILoanItemCapabilityPort,
    IHistoryRepository,
    IHistoryCapabilityPort,
    ITransactionTypeCapabilityPort
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitDetails: IAssetUnitDetailsCapabilityPort,
  ) {}

  private dependencies(): ReaderDependencies {
    return { prisma: this.prisma, unitDetails: this.unitDetails }
  }

  async findAllLoans(
    query: LoanQueryInput,
  ): Promise<PaginatedResult<LoanRepositoryOutput>> {
    return findAllLoans(this.dependencies(), query)
  }

  async findLoanById(id: string): Promise<LoanRepositoryOutput | null> {
    return findLoanById(this.dependencies(), id)
  }

  async createLoan(
    input: CreateLoanRepositoryInput,
  ): Promise<LoanRepositoryOutput> {
    const loan = await this.prisma.inventoryLoan.create({
      data: {
        loanNumber: input.loanNumber,
        requesterId: input.requesterId,
        expectedReturnDate: input.expectedReturnDate,
        purpose: input.purpose,
        statusId: input.statusId,
        workflowInstanceId: input.workflowInstanceId,
      },
    })
    return mapLoan(loan)
  }

  async updateLoan(
    id: string,
    input: UpdateLoanRepositoryInput,
  ): Promise<LoanRepositoryOutput> {
    const loan = await this.prisma.inventoryLoan.update({
      where: { id },
      data: {
        expectedReturnDate: input.expectedReturnDate,
        actualReturnDate: input.actualReturnDate,
        purpose: input.purpose,
        statusId: input.statusId,
        workflowInstanceId: input.workflowInstanceId,
      },
    })
    return mapLoan(loan)
  }

  async findLatestLoan(): Promise<LoanRepositoryOutput | null> {
    const loan = await this.prisma.inventoryLoan.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    return loan ? mapLoan(loan) : null
  }

  async findDetailsByIds(
    ids: string[],
  ): Promise<LoanDetailsCapabilityOutput[]> {
    return findLoanDetailsByIds(this.dependencies(), ids)
  }

  async updateStatus(
    id: string,
    statusId: string,
  ): Promise<LoanStatusCapabilityOutput> {
    return this.prisma.inventoryLoan.update({
      where: { id },
      data: { statusId },
      select: { id: true, loanNumber: true },
    })
  }

  async findByLoanId(loanId: string): Promise<LoanItemCapabilityOutput[]> {
    return findLoanItemUnitIds(this.dependencies(), loanId)
  }

  async findAllHistories(
    query: HistoryQueryInput,
  ): Promise<PaginatedResult<HistoryRepositoryOutput>> {
    return findAllHistories(this.dependencies(), query)
  }

  async createHistory(
    input: CreateHistoryRepositoryInput,
  ): Promise<HistoryRepositoryOutput> {
    const history = await this.prisma.inventoryHistory.create({
      data: {
        unitId: input.unitId,
        transactionTypeId: input.transactionTypeId,
        previousConditionId: input.previousConditionId,
        newConditionId: input.newConditionId,
        previousStatusId: input.previousStatusId,
        newStatusId: input.newStatusId,
        previousLocationId: input.previousLocationId,
        newLocationId: input.newLocationId,
        previousCustodianId: input.previousCustodianId,
        newCustodianId: input.newCustodianId,
        note: input.note,
        changedById: input.changedById,
      },
    })
    return mapHistory(history)
  }

  async findTransactionTypeByCode(
    code: string,
  ): Promise<TransactionTypeRepositoryOutput | null> {
    const transactionType =
      await this.prisma.inventoryTransactionType.findUnique({ where: { code } })
    return transactionType ? mapTransactionType(transactionType) : null
  }

  async record(input: RecordHistoryCapabilityInput): Promise<void> {
    const data = {
      unitId: input.unitId,
      transactionTypeId: input.transactionTypeId,
      previousStatusId: input.previousStatusId,
      newStatusId: input.newStatusId,
      note: input.note,
      changedById: input.changedById,
      operationKey: input.operationKey,
    }
    if (input.operationKey) {
      await this.prisma.inventoryHistory.upsert({
        where: { operationKey: input.operationKey },
        create: data,
        update: {},
      })
      return
    }
    await this.prisma.inventoryHistory.create({ data })
  }

  async processCreateLoanTransaction(
    params: ProcessCreateLoanInput,
  ): Promise<LoanRepositoryOutput> {
    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.inventoryLoan.create({
        data: {
          loanNumber: params.loanNumber,
          requesterId: params.requesterId,
          expectedReturnDate: params.expectedReturnDate,
          purpose: params.purpose,
          statusId: params.pendingStatusId,
          items: {
            create: params.unitIds.map((unitId) => ({
              unitId,
            })),
          },
        },
      })
      return mapLoan(loan)
    })
  }

  async processReturnLoanTransaction(
    params: ProcessReturnLoanInput,
  ): Promise<LoanRepositoryOutput> {
    const updatedLoan = await this.prisma.inventoryLoan.update({
      where: { id: params.loanId },
      data: {
        actualReturnDate: new Date(),
        statusId: params.returnedStatusId,
      },
    })
    return mapLoan(updatedLoan)
  }
}
