import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ProcessApprovalUseCase } from './process-approval.use-case.js'
import { IApprovalRepository } from '../../../domain/repositories/approval.repository.js'

describe('ProcessApprovalUseCase', () => {
  const PENDING_STATUS = { id: 'st-pending' }
  const INSTANCE_ID = 'inst-1'
  const REFERENCE_ID = 'loan-1'
  const USER_ID = 'user-1'
  const APPROVE_ACTION_ID = '00000000-0000-0000-0000-000000000001'
  const REJECT_ACTION_ID = '00000000-0000-0000-0000-000000000002'

  interface StepShape {
    stepSequence: number
    approverRoleCode: string
    isMandatory: boolean
  }

  function makeRepository(options: {
    steps: StepShape[]
    currentStepSequence?: number
    roleCodes: string[]
    statusId?: string
    logs?: unknown[]
    existingLog?: Record<string, unknown> | null
  }) {
    const consequenceUpdatedAt = new Date('2026-09-14T00:03:00.000Z')
    let lastConsequenceType: 'NONE' | 'FINAL_APPROVAL' | 'REJECTION' =
      'FINAL_APPROVAL'
    const makeLog = (
      id: string,
      consequenceType: 'NONE' | 'FINAL_APPROVAL' | 'REJECTION',
      consequenceStatus: 'NOT_REQUIRED' | 'PENDING' | 'COMPLETED' | 'FAILED',
      note: string | null = null,
      consequenceError: string | null = null,
    ) => ({
      id,
      instanceId: INSTANCE_ID,
      stepSequence: options.currentStepSequence ?? 1,
      approverId: USER_ID,
      actionId:
        consequenceType === 'REJECTION' ? REJECT_ACTION_ID : APPROVE_ACTION_ID,
      note,
      createdAt: consequenceUpdatedAt,
      consequenceType,
      consequenceStatus,
      consequenceError,
      consequenceUpdatedAt,
    })
    const processApprovalTransaction = jest
      .fn()
      .mockImplementation((params) => {
        const consequenceType = params.hasNextStep
          ? 'NONE'
          : params.action === 'REJECT'
            ? 'REJECTION'
            : 'FINAL_APPROVAL'
        lastConsequenceType = consequenceType
        const consequenceStatus =
          consequenceType === 'NONE' ? 'NOT_REQUIRED' : 'PENDING'
        return {
          success: true,
          action:
            params.action === 'REJECT'
              ? 'REJECT'
              : params.hasNextStep
                ? 'APPROVE_STEP'
                : 'APPROVE_FINAL',
          ...(params.nextStepSequence !== undefined && {
            nextStepSequence: params.nextStepSequence,
          }),
          log:
            params.existingLogId && options.existingLog
              ? {
                  ...options.existingLog,
                  consequenceStatus: 'PENDING',
                  consequenceError: null,
                }
              : makeLog(
                  'log-1',
                  consequenceType,
                  consequenceStatus,
                  params.note ?? null,
                ),
          consequence: {
            type: consequenceType,
            status: consequenceStatus,
          },
          retryable: false,
        }
      })
    const transitionLogConsequence = jest
      .fn()
      .mockImplementation(
        (
          logId: string,
          _expectedStatus: string,
          nextStatus: 'NOT_REQUIRED' | 'PENDING' | 'COMPLETED' | 'FAILED',
          safeError?: string | null,
        ) => ({
          log: {
            ...(options.existingLog ??
              makeLog(logId, lastConsequenceType, 'PENDING')),
            consequenceStatus: nextStatus,
            consequenceError: safeError ?? null,
          },
          transitioned: true,
        }),
      )

    const repository = {
      findInstanceById: jest.fn().mockResolvedValue({
        id: 'inst-1',
        referenceId: 'loan-1',
        statusId: options.statusId ?? PENDING_STATUS.id,
        currentStepSequence: options.currentStepSequence ?? 1,
        workflow: { steps: options.steps },
        logs:
          options.logs ??
          (options.existingLog ? [options.existingLog] : undefined),
      }),
      processApprovalTransaction,
      transitionLogConsequence,
    } as unknown as IApprovalRepository

    const statusLookup = {
      findBySystemKey: jest.fn().mockImplementation((key: string) => {
        const statuses: Record<string, { id: string }> = {
          LOAN_PENDING: PENDING_STATUS,
          LOAN_REJECTED: { id: 'st-rejected' },
          AVAILABLE: { id: 'st-available' },
          LOAN_APPROVED: { id: 'st-approved' },
          LOANED: { id: 'st-loaned' },
        }
        return statuses[key] ?? null
      }),
    }
    const loanCapability = {
      findDetailsByIds: jest.fn(),
      updateStatus: jest
        .fn()
        .mockResolvedValue({ id: REFERENCE_ID, loanNumber: 'LN-1' }),
    }
    const loanItemCapability = { findByLoanId: jest.fn().mockResolvedValue([]) }
    const unitMutation = {
      updateStatuses: jest.fn().mockResolvedValue(undefined),
      updateCondition: jest.fn().mockResolvedValue(undefined),
    }
    const history = { record: jest.fn() }
    const transactionType = {
      findTransactionTypeByCode: jest
        .fn()
        .mockResolvedValue({ id: 'transaction-1' }),
    }

    return {
      useCase: new ProcessApprovalUseCase(
        repository,
        statusLookup,
        loanCapability,
        loanItemCapability,
        unitMutation,
        history,
        transactionType,
      ),
      processApprovalTransaction,
      transitionLogConsequence,
      repository,
      statusLookup,
      loanCapability,
      loanItemCapability,
      unitMutation,
      history,
      makeLog,
      roleCodes: options.roleCodes,
    }
  }

  const TWO_STEP_OPTIONAL: StepShape[] = [
    { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
    { stepSequence: 2, approverRoleCode: 'PRINCIPAL', isMandatory: false },
  ]

  const TWO_STEP_MANDATORY: StepShape[] = [
    { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
    { stepSequence: 2, approverRoleCode: 'PRINCIPAL', isMandatory: true },
  ]

  describe('authorization', () => {
    it('accepts the role the workflow names as this step’s approver', async () => {
      const { useCase, processApprovalTransaction, roleCodes } = makeRepository(
        {
          steps: TWO_STEP_OPTIONAL,
          roleCodes: ['ADMIN'],
        },
      )

      await useCase.execute(
        'inst-1',
        { action: 'APPROVE' },
        'user-1',
        roleCodes,
      )

      expect(processApprovalTransaction).toHaveBeenCalled()
    })

    it('refuses a role the workflow does not name', async () => {
      const { useCase, processApprovalTransaction, roleCodes } = makeRepository(
        {
          steps: TWO_STEP_OPTIONAL,
          roleCodes: ['TEACHER'],
        },
      )

      await expect(
        useCase.execute(INSTANCE_ID, { action: 'APPROVE' }, USER_ID, roleCodes),
      ).rejects.toEqual(
        new ForbiddenException(
          'You do not have the required role (ADMIN) to process this step.',
        ),
      )
      expect(processApprovalTransaction).not.toHaveBeenCalled()
    })

    it('refuses SUPER_ADMIN when the workflow does not name it', async () => {
      const { useCase, roleCodes } = makeRepository({
        steps: TWO_STEP_OPTIONAL,
        roleCodes: ['SUPER_ADMIN'],
      })

      await expect(
        useCase.execute(INSTANCE_ID, { action: 'APPROVE' }, USER_ID, roleCodes),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })
  })

  describe('preconditions', () => {
    it('throws when the approval instance does not exist', async () => {
      const findInstanceById = jest.fn().mockResolvedValue(null)
      const findStatusBySystemKey = jest.fn()
      const repository = {
        findInstanceById,
        processApprovalTransaction: jest.fn(),
      } as unknown as IApprovalRepository
      const useCase = new ProcessApprovalUseCase(
        repository,
        { findBySystemKey: findStatusBySystemKey },
        { findDetailsByIds: jest.fn() } as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
      )

      await expect(
        useCase.execute('missing-instance', { action: 'APPROVE' }, 'user-1', [
          'ADMIN',
        ]),
      ).rejects.toEqual(new NotFoundException('Approval instance not found.'))
      expect(findInstanceById).toHaveBeenCalledWith('missing-instance')
      expect(findStatusBySystemKey).not.toHaveBeenCalled()
    })

    it('throws when the pending status cannot be found', async () => {
      const findStatusBySystemKey = jest.fn().mockResolvedValue(null)
      const findInstanceById = jest.fn().mockResolvedValue({
        id: 'inst-1',
        referenceId: 'loan-1',
        statusId: PENDING_STATUS.id,
        currentStepSequence: 1,
        workflow: { steps: TWO_STEP_OPTIONAL },
      })
      const processApprovalTransaction = jest.fn()
      const repository = {
        findInstanceById,
        processApprovalTransaction,
      } as unknown as IApprovalRepository
      const useCase = new ProcessApprovalUseCase(
        repository,
        { findBySystemKey: findStatusBySystemKey },
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
      )

      await expect(
        useCase.execute('inst-1', { action: 'APPROVE' }, 'user-1', ['ADMIN']),
      ).rejects.toEqual(
        new BadRequestException('This approval request is no longer pending.'),
      )
      expect(findStatusBySystemKey).toHaveBeenCalledWith('LOAN_PENDING')
      expect(processApprovalTransaction).not.toHaveBeenCalled()
    })

    it('throws when the instance status is no longer pending', async () => {
      const findInstanceById = jest.fn().mockResolvedValue({
        id: 'inst-1',
        referenceId: 'loan-1',
        statusId: 'st-approved',
        currentStepSequence: 1,
        workflow: { steps: TWO_STEP_OPTIONAL },
      })
      const findStatusBySystemKey = jest.fn().mockResolvedValue(PENDING_STATUS)
      const processApprovalTransaction = jest.fn()
      const repository = {
        findInstanceById,
        processApprovalTransaction,
      } as unknown as IApprovalRepository
      const useCase = new ProcessApprovalUseCase(
        repository,
        { findBySystemKey: findStatusBySystemKey },
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
      )

      await expect(
        useCase.execute('inst-1', { action: 'APPROVE' }, 'user-1', ['ADMIN']),
      ).rejects.toEqual(
        new BadRequestException('This approval request is no longer pending.'),
      )
      expect(processApprovalTransaction).not.toHaveBeenCalled()
    })

    it('throws when current step sequence is not in the workflow', async () => {
      const { useCase, processApprovalTransaction } = makeRepository({
        steps: TWO_STEP_OPTIONAL,
        currentStepSequence: 3,
        roleCodes: ['ADMIN'],
      })

      await expect(
        useCase.execute('inst-1', { action: 'APPROVE' }, 'user-1', ['ADMIN']),
      ).rejects.toEqual(
        new BadRequestException('Current approval step sequence is invalid.'),
      )
      expect(processApprovalTransaction).not.toHaveBeenCalled()
    })
  })

  describe('transaction outcomes', () => {
    it('returns the rejection result from the repository', async () => {
      const { useCase, processApprovalTransaction, roleCodes } = makeRepository(
        {
          steps: TWO_STEP_MANDATORY,
          roleCodes: ['ADMIN'],
        },
      )
      await expect(
        useCase.execute(
          'inst-1',
          { action: 'REJECT', note: 'Tidak sesuai' },
          'user-1',
          roleCodes,
        ),
      ).resolves.toMatchObject({
        success: true,
        action: 'REJECT',
        consequence: { type: 'REJECTION', status: 'COMPLETED' },
        retryable: false,
      })
      expect(processApprovalTransaction).toHaveBeenCalledWith({
        instanceId: 'inst-1',
        currentStepSequence: 1,
        action: 'REJECT',
        userId: 'user-1',
        note: 'Tidak sesuai',
        statusId: 'st-rejected',
        hasNextStep: false,
        consequenceType: 'REJECTION',
      })
    })

    it('returns the intermediate approval result for the next step', async () => {
      const {
        useCase,
        processApprovalTransaction,
        loanCapability,
        loanItemCapability,
        unitMutation,
        history,
        roleCodes,
      } = makeRepository({
        steps: TWO_STEP_OPTIONAL,
        roleCodes: ['ADMIN'],
      })
      await expect(
        useCase.execute(
          INSTANCE_ID,
          {
            action: 'APPROVE',
            forwardToNextApprover: true,
            note: 'Forwarded for principal review',
          },
          USER_ID,
          roleCodes,
        ),
      ).resolves.toMatchObject({
        success: true,
        action: 'APPROVE_STEP',
        nextStepSequence: 2,
        consequence: { type: 'NONE', status: 'NOT_REQUIRED' },
        retryable: false,
      })
      expect(processApprovalTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId: INSTANCE_ID,
          currentStepSequence: 1,
          action: 'APPROVE',
          userId: USER_ID,
          note: 'Forwarded for principal review',
          hasNextStep: true,
          nextStepSequence: 2,
          consequenceType: 'NONE',
        }),
      )
      expect(loanCapability.updateStatus).not.toHaveBeenCalled()
      expect(loanItemCapability.findByLoanId).not.toHaveBeenCalled()
      expect(unitMutation.updateStatuses).not.toHaveBeenCalled()
      expect(history.record).not.toHaveBeenCalled()
    })

    it('returns the final approval result', async () => {
      const { useCase, processApprovalTransaction, roleCodes } = makeRepository(
        {
          steps: TWO_STEP_OPTIONAL,
          currentStepSequence: 2,
          roleCodes: ['PRINCIPAL'],
        },
      )
      await expect(
        useCase.execute(
          INSTANCE_ID,
          { action: 'APPROVE', note: 'Final approval' },
          USER_ID,
          roleCodes,
        ),
      ).resolves.toMatchObject({
        success: true,
        action: 'APPROVE_FINAL',
        consequence: { type: 'FINAL_APPROVAL', status: 'COMPLETED' },
        retryable: false,
      })
      expect(processApprovalTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId: INSTANCE_ID,
          currentStepSequence: 2,
          action: 'APPROVE',
          userId: USER_ID,
          note: 'Final approval',
          statusId: 'st-approved',
          hasNextStep: false,
          consequenceType: 'FINAL_APPROVAL',
        }),
      )
    })

    it('propagates downstream transaction failures', async () => {
      const { useCase, processApprovalTransaction, roleCodes } = makeRepository(
        {
          steps: TWO_STEP_OPTIONAL,
          roleCodes: ['ADMIN'],
        },
      )
      const error = new Error('loan update failed')
      processApprovalTransaction.mockRejectedValue(error)

      await expect(
        useCase.execute('inst-1', { action: 'APPROVE' }, 'user-1', roleCodes),
      ).rejects.toBe(error)
    })
  })

  describe('the optional second approver', () => {
    it('finishes the loan when the administrator does not forward it', async () => {
      const { useCase, processApprovalTransaction, roleCodes } = makeRepository(
        {
          steps: TWO_STEP_OPTIONAL,
          roleCodes: ['ADMIN'],
        },
      )

      await useCase.execute(
        'inst-1',
        { action: 'APPROVE' },
        'user-1',
        roleCodes,
      )

      expect(processApprovalTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ hasNextStep: false }),
      )
    })

    it('passes it to the head teacher when the administrator asks', async () => {
      const { useCase, processApprovalTransaction, roleCodes } = makeRepository(
        {
          steps: TWO_STEP_OPTIONAL,
          roleCodes: ['ADMIN'],
        },
      )

      await useCase.execute(
        'inst-1',
        { action: 'APPROVE', forwardToNextApprover: true },
        'user-1',
        roleCodes,
      )

      expect(processApprovalTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ hasNextStep: true, nextStepSequence: 2 }),
      )
    })

    it('takes a mandatory next step even when not asked to forward', async () => {
      const { useCase, processApprovalTransaction, roleCodes } = makeRepository(
        {
          steps: TWO_STEP_MANDATORY,
          roleCodes: ['ADMIN'],
        },
      )

      await useCase.execute(
        'inst-1',
        { action: 'APPROVE', forwardToNextApprover: false },
        'user-1',
        roleCodes,
      )

      expect(processApprovalTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ hasNextStep: true, nextStepSequence: 2 }),
      )
    })

    it('refuses to forward when there is no further step', async () => {
      const { useCase, processApprovalTransaction, roleCodes } = makeRepository(
        {
          steps: [
            { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
          ],
          roleCodes: ['ADMIN'],
        },
      )

      await expect(
        useCase.execute(
          'inst-1',
          { action: 'APPROVE', forwardToNextApprover: true },
          'user-1',
          roleCodes,
        ),
      ).rejects.toEqual(
        new BadRequestException(
          'This workflow has no further approver to forward to.',
        ),
      )
      expect(processApprovalTransaction).not.toHaveBeenCalled()
    })

    it('never forwards a rejection', async () => {
      const { useCase, processApprovalTransaction, roleCodes } = makeRepository(
        {
          steps: TWO_STEP_MANDATORY,
          roleCodes: ['ADMIN'],
        },
      )

      await useCase.execute(
        'inst-1',
        { action: 'REJECT', note: 'Aset sedang diperbaiki' },
        'user-1',
        roleCodes,
      )

      expect(processApprovalTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ hasNextStep: false }),
      )
    })

    it('is already final at the last step', async () => {
      const { useCase, processApprovalTransaction, roleCodes } = makeRepository(
        {
          steps: TWO_STEP_OPTIONAL,
          currentStepSequence: 2,
          roleCodes: ['PRINCIPAL'],
        },
      )

      await useCase.execute(
        'inst-1',
        { action: 'APPROVE' },
        'user-1',
        roleCodes,
      )

      expect(processApprovalTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          hasNextStep: false,
          statusId: 'st-approved',
        }),
      )
    })
  })

  it('awaits circulation and asset consequences after local approval persistence', async () => {
    const order: string[] = []
    const repository = {
      findInstanceById: jest.fn().mockResolvedValue({
        id: INSTANCE_ID,
        referenceId: REFERENCE_ID,
        statusId: PENDING_STATUS.id,
        currentStepSequence: 1,
        workflow: {
          steps: [
            { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
          ],
        },
      }),
      processApprovalTransaction: jest.fn().mockImplementation(() => {
        order.push('approval')
        return {
          success: true,
          action: 'REJECT',
          log: {
            id: 'log-reject',
            instanceId: INSTANCE_ID,
            stepSequence: 1,
            approverId: USER_ID,
            actionId: REJECT_ACTION_ID,
            note: 'Not available',
            createdAt: new Date('2026-09-14T00:03:00.000Z'),
            consequenceType: 'REJECTION',
            consequenceStatus: 'PENDING',
            consequenceError: null,
            consequenceUpdatedAt: new Date('2026-09-14T00:03:00.000Z'),
          },
          consequence: { type: 'REJECTION', status: 'PENDING' },
          retryable: false,
        }
      }),
      transitionLogConsequence: jest
        .fn()
        .mockImplementation(
          (logId: string, _expected: string, status: string) => ({
            log: {
              id: logId,
              instanceId: INSTANCE_ID,
              stepSequence: 1,
              approverId: USER_ID,
              actionId: REJECT_ACTION_ID,
              note: 'Not available',
              createdAt: new Date('2026-09-14T00:03:00.000Z'),
              consequenceType: 'REJECTION',
              consequenceStatus: status,
              consequenceError: null,
              consequenceUpdatedAt: new Date('2026-09-14T00:03:00.000Z'),
            },
            transitioned: true,
          }),
        ),
    }
    const statusLookup = {
      findBySystemKey: jest.fn().mockImplementation((key: string) => {
        if (key === 'LOAN_PENDING') return PENDING_STATUS
        if (key === 'LOAN_REJECTED') return { id: 'status-rejected' }
        if (key === 'AVAILABLE') return { id: 'status-available' }
        return null
      }),
    }
    const loan = {
      updateStatus: jest.fn().mockImplementation(() => {
        order.push('loan')
        return { id: REFERENCE_ID, loanNumber: 'LN-1' }
      }),
    }
    const loanItems = {
      findByLoanId: jest.fn().mockImplementation(() => {
        order.push('loan-items')
        return [{ unitId: 'unit-1' }]
      }),
    }
    const unitMutation = {
      updateStatuses: jest.fn().mockImplementation(() => {
        order.push('units')
      }),
      updateCondition: jest.fn(),
    }
    const history = {
      record: jest.fn().mockImplementation(() => {
        order.push('history')
      }),
    }
    const transactionType = {
      findTransactionTypeByCode: jest
        .fn()
        .mockResolvedValue({ id: 'transaction-cancel' }),
    }
    const useCase = new (
      ProcessApprovalUseCase as unknown as new (
        ...args: unknown[]
      ) => ProcessApprovalUseCase
    )(
      repository,
      statusLookup,
      loan,
      loanItems,
      unitMutation,
      history,
      transactionType,
    )

    await useCase.execute(
      INSTANCE_ID,
      { action: 'REJECT', note: 'Not available' },
      USER_ID,
      ['ADMIN'],
    )

    expect(order).toEqual([
      'approval',
      'loan',
      'loan-items',
      'units',
      'history',
    ])
    expect(loan.updateStatus).toHaveBeenCalledWith(
      REFERENCE_ID,
      'status-rejected',
    )
    expect(unitMutation.updateStatuses).toHaveBeenCalledWith({
      unitIds: ['unit-1'],
      statusId: 'status-available',
    })
    expect(history.record).toHaveBeenCalledWith({
      unitId: 'unit-1',
      transactionTypeId: 'transaction-cancel',
      previousStatusId: PENDING_STATUS.id,
      newStatusId: 'status-available',
      note: 'Peminjaman ditolak (Not available)',
      changedById: USER_ID,
      operationKey: 'log-reject:unit-1',
    })
  })

  it('runs final approval consequences in loan, item, unit, history order', async () => {
    const order: string[] = []
    const {
      useCase,
      loanCapability,
      loanItemCapability,
      unitMutation,
      history,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      roleCodes: ['ADMIN'],
    })
    loanCapability.updateStatus.mockImplementation(() => {
      order.push('loan')
      return { id: REFERENCE_ID, loanNumber: 'LN-1' }
    })
    loanItemCapability.findByLoanId.mockImplementation(() => {
      order.push('loan-items')
      return [{ unitId: 'unit-1' }]
    })
    unitMutation.updateStatuses.mockImplementation(() => {
      order.push('units')
    })
    history.record.mockImplementation(() => {
      order.push('history')
    })

    await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE' },
      USER_ID,
      roleCodes,
    )

    expect(order).toEqual(['loan', 'loan-items', 'units', 'history'])
  })

  it('marks a completed final consequence after all downstream calls succeed', async () => {
    const {
      useCase,
      transitionLogConsequence,
      loanItemCapability,
      history,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      roleCodes: ['ADMIN'],
    })
    loanItemCapability.findByLoanId.mockResolvedValue([
      { unitId: 'unit-1' },
      { unitId: 'unit-2' },
    ])

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE', note: 'Stored approval' },
      USER_ID,
      roleCodes,
    )

    expect(transitionLogConsequence).toHaveBeenLastCalledWith(
      'log-1',
      'PENDING',
      'COMPLETED',
      null,
      expect.any(Date),
    )
    expect(history.record).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ operationKey: 'log-1:unit-1' }),
    )
    expect(history.record).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ operationKey: 'log-1:unit-2' }),
    )
    expect(result).toMatchObject({
      success: true,
      consequence: { type: 'FINAL_APPROVAL', status: 'COMPLETED' },
      retryable: false,
    })
  })

  it('returns a retryable failed result and stores a safe consequence error', async () => {
    const {
      useCase,
      loanCapability,
      transitionLogConsequence,
      makeLog,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      roleCodes: ['ADMIN'],
    })
    const downstreamError = new Error('database host and credentials leaked')
    loanCapability.updateStatus.mockRejectedValue(downstreamError)

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE' },
      USER_ID,
      roleCodes,
    )

    expect(transitionLogConsequence).toHaveBeenCalledWith(
      'log-1',
      'PENDING',
      'FAILED',
      expect.any(String),
      expect.any(Date),
    )
    expect(result).toMatchObject({
      success: false,
      consequence: {
        type: 'FINAL_APPROVAL',
        status: 'FAILED',
        error: expect.any(String),
      },
      retryable: true,
    })
    expect(result.consequence?.error).not.toContain('credentials')
  })

  it('stores a safe failed result when loan item lookup fails', async () => {
    const { useCase, loanItemCapability, transitionLogConsequence, roleCodes } =
      makeRepository({
        steps: [
          { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
        ],
        roleCodes: ['ADMIN'],
      })
    const error = new Error('raw loan-item SQL credentials')
    loanItemCapability.findByLoanId.mockRejectedValue(error)

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE' },
      USER_ID,
      roleCodes,
    )

    expect(transitionLogConsequence).toHaveBeenCalledWith(
      'log-1',
      'PENDING',
      'FAILED',
      'Approval consequence could not be completed. Retry this action.',
      expect.any(Date),
    )
    expect(result).toMatchObject({
      success: false,
      consequence: {
        status: 'FAILED',
        error:
          'Approval consequence could not be completed. Retry this action.',
      },
      retryable: true,
    })
    expect(result.consequence?.error).not.toContain('credentials')
  })

  it('stores a safe failed result when unit mutation fails', async () => {
    const {
      useCase,
      loanItemCapability,
      unitMutation,
      transitionLogConsequence,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      roleCodes: ['ADMIN'],
    })
    loanItemCapability.findByLoanId.mockResolvedValue([{ unitId: 'unit-1' }])
    const error = new Error('raw unit SQL credentials')
    unitMutation.updateStatuses.mockRejectedValue(error)

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE' },
      USER_ID,
      roleCodes,
    )

    expect(transitionLogConsequence).toHaveBeenCalledWith(
      'log-1',
      'PENDING',
      'FAILED',
      'Approval consequence could not be completed. Retry this action.',
      expect.any(Date),
    )
    expect(result).toMatchObject({
      success: false,
      consequence: {
        status: 'FAILED',
        error:
          'Approval consequence could not be completed. Retry this action.',
      },
      retryable: true,
    })
    expect(result.consequence?.error).not.toContain('credentials')
  })

  it('stores a safe failed result when history recording fails', async () => {
    const {
      useCase,
      loanItemCapability,
      history,
      transitionLogConsequence,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      roleCodes: ['ADMIN'],
    })
    loanItemCapability.findByLoanId.mockResolvedValue([{ unitId: 'unit-1' }])
    const error = new Error('raw history SQL credentials')
    history.record.mockRejectedValue(error)

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE' },
      USER_ID,
      roleCodes,
    )

    expect(transitionLogConsequence).toHaveBeenCalledWith(
      'log-1',
      'PENDING',
      'FAILED',
      'Approval consequence could not be completed. Retry this action.',
      expect.any(Date),
    )
    expect(result).toMatchObject({
      success: false,
      consequence: {
        status: 'FAILED',
        error:
          'Approval consequence could not be completed. Retry this action.',
      },
      retryable: true,
    })
    expect(result.consequence?.error).not.toContain('credentials')
  })

  it('does not run consequences when an existing pending claim is lost', async () => {
    const pendingLog = {
      id: 'log-pending',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Persisted note',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'PENDING' as const,
      consequenceError: null,
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const {
      useCase,
      transitionLogConsequence,
      loanCapability,
      makeLog,
      repository,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      statusId: 'st-approved',
      existingLog: pendingLog,
      roleCodes: ['ADMIN'],
    })
    transitionLogConsequence.mockResolvedValueOnce({
      log: pendingLog,
      transitioned: false,
    })
    const findInstanceById = repository.findInstanceById as jest.Mock
    findInstanceById.mockReset()
    findInstanceById
      .mockResolvedValueOnce({
        id: INSTANCE_ID,
        referenceId: REFERENCE_ID,
        statusId: 'st-approved',
        currentStepSequence: 1,
        workflow: {
          steps: [
            { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
          ],
        },
        logs: [pendingLog],
      })
      .mockResolvedValueOnce({
        id: INSTANCE_ID,
        referenceId: REFERENCE_ID,
        statusId: 'st-approved',
        currentStepSequence: 1,
        workflow: {
          steps: [
            { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
          ],
        },
        logs: [{ ...pendingLog, consequenceStatus: 'COMPLETED' as const }],
      })

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE' },
      USER_ID,
      roleCodes,
    )

    expect(loanCapability.updateStatus).not.toHaveBeenCalled()
    expect(findInstanceById).toHaveBeenCalledTimes(2)
    expect(result).toMatchObject({
      success: true,
      consequence: { status: 'COMPLETED' },
      retryable: false,
    })
  })

  it('does not reclaim a fresh pending consequence', async () => {
    const now = new Date('2026-09-14T00:05:00.000Z')
    const pendingLog = {
      id: 'log-fresh-pending',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Persisted note',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'PENDING' as const,
      consequenceError: null,
      consequenceUpdatedAt: new Date('2026-09-14T00:04:30.000Z'),
    }
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now.getTime())

    try {
      const {
        useCase,
        transitionLogConsequence,
        loanCapability,
        loanItemCapability,
        unitMutation,
        history,
        roleCodes,
      } = makeRepository({
        steps: [
          { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
        ],
        statusId: 'st-approved',
        existingLog: pendingLog,
        roleCodes: ['ADMIN'],
      })

      await expect(
        useCase.execute(INSTANCE_ID, { action: 'APPROVE' }, USER_ID, roleCodes),
      ).rejects.toEqual(
        new InternalServerErrorException(
          'Approval consequence is already being processed. Retry this action.',
        ),
      )
      expect(transitionLogConsequence).not.toHaveBeenCalled()
      expect(loanCapability.updateStatus).not.toHaveBeenCalled()
      expect(loanItemCapability.findByLoanId).not.toHaveBeenCalled()
      expect(unitMutation.updateStatuses).not.toHaveBeenCalled()
      expect(history.record).not.toHaveBeenCalled()
    } finally {
      nowSpy.mockRestore()
    }
  })

  it('reclaims a stale pending consequence', async () => {
    const now = new Date('2026-09-14T01:05:01.000Z')
    const pendingLog = {
      id: 'log-stale-pending',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Persisted note',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'PENDING' as const,
      consequenceError: null,
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now.getTime())

    try {
      const { useCase, transitionLogConsequence, loanCapability, roleCodes } =
        makeRepository({
          steps: [
            { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
          ],
          statusId: 'st-approved',
          existingLog: pendingLog,
          roleCodes: ['ADMIN'],
        })

      await expect(
        useCase.execute(INSTANCE_ID, { action: 'APPROVE' }, USER_ID, roleCodes),
      ).resolves.toMatchObject({
        success: true,
        consequence: { status: 'COMPLETED' },
      })
      expect(transitionLogConsequence).toHaveBeenNthCalledWith(
        1,
        pendingLog.id,
        'PENDING',
        'PENDING',
        null,
        pendingLog.consequenceUpdatedAt,
      )
      expect(loanCapability.updateStatus).toHaveBeenCalledTimes(1)
    } finally {
      nowSpy.mockRestore()
    }
  })

  it('executes the consequence directly for the request that creates its log', async () => {
    const { useCase, transitionLogConsequence, loanCapability, roleCodes } =
      makeRepository({
        steps: [
          { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
        ],
        roleCodes: ['ADMIN'],
      })

    await expect(
      useCase.execute(INSTANCE_ID, { action: 'APPROVE' }, USER_ID, roleCodes),
    ).resolves.toMatchObject({
      success: true,
      consequence: { status: 'COMPLETED' },
    })
    expect(transitionLogConsequence).toHaveBeenCalledTimes(1)
    expect(transitionLogConsequence).toHaveBeenCalledWith(
      'log-1',
      'PENDING',
      'COMPLETED',
      null,
      expect.any(Date),
    )
    expect(loanCapability.updateStatus).toHaveBeenCalledTimes(1)
  })

  it('does not return success while a lost claim remains pending', async () => {
    const pendingLog = {
      id: 'log-pending',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Persisted note',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'PENDING' as const,
      consequenceError: null,
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const { useCase, transitionLogConsequence, repository, roleCodes } =
      makeRepository({
        steps: [
          { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
        ],
        statusId: 'st-approved',
        existingLog: pendingLog,
        roleCodes: ['ADMIN'],
      })
    const findInstanceById = repository.findInstanceById as jest.Mock
    findInstanceById.mockReset()
    findInstanceById
      .mockResolvedValueOnce({
        id: INSTANCE_ID,
        referenceId: REFERENCE_ID,
        statusId: 'st-approved',
        currentStepSequence: 1,
        workflow: {
          steps: [
            { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
          ],
        },
        logs: [pendingLog],
      })
      .mockResolvedValueOnce({
        id: INSTANCE_ID,
        referenceId: REFERENCE_ID,
        statusId: 'st-approved',
        currentStepSequence: 1,
        workflow: {
          steps: [
            { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
          ],
        },
        logs: [pendingLog],
      })
    transitionLogConsequence.mockResolvedValueOnce({
      log: pendingLog,
      transitioned: false,
    })

    await expect(
      useCase.execute(INSTANCE_ID, { action: 'APPROVE' }, USER_ID, roleCodes),
    ).rejects.toEqual(
      new InternalServerErrorException(
        'Approval consequence is already being processed. Retry this action.',
      ),
    )
  })

  it('re-reads and resumes the same action after a first-submit unique race', async () => {
    const failedLog = {
      id: 'log-raced',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Persisted note',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'FAILED' as const,
      consequenceError: 'Previous safe error',
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const pendingLog = { ...failedLog, consequenceStatus: 'PENDING' as const }
    const reloadedInstance = {
      id: INSTANCE_ID,
      referenceId: REFERENCE_ID,
      statusId: 'st-approved',
      currentStepSequence: 1,
      workflow: {
        steps: [
          { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
        ],
      },
      logs: [failedLog],
    }
    const initialInstance = {
      ...reloadedInstance,
      statusId: PENDING_STATUS.id,
      logs: [],
    }
    const findInstanceById = jest
      .fn()
      .mockResolvedValueOnce(initialInstance)
      .mockResolvedValueOnce(reloadedInstance)
    const processApprovalTransaction = jest.fn().mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { target: ['instance_id', 'step_sequence'] },
      }),
    )
    const transitionLogConsequence = jest
      .fn()
      .mockResolvedValueOnce({ log: pendingLog, transitioned: true })
      .mockResolvedValueOnce({
        log: { ...pendingLog, consequenceStatus: 'COMPLETED' as const },
        transitioned: true,
      })
    const repository = {
      findInstanceById,
      processApprovalTransaction,
      transitionLogConsequence,
    } as unknown as IApprovalRepository
    const statusLookup = {
      findBySystemKey: jest.fn().mockImplementation((key: string) => {
        if (key === 'LOAN_PENDING') return PENDING_STATUS
        if (key === 'LOAN_APPROVED') return { id: 'st-approved' }
        if (key === 'LOANED') return { id: 'st-loaned' }
        return null
      }),
    }
    const loanCapability = {
      findDetailsByIds: jest.fn(),
      updateStatus: jest
        .fn()
        .mockResolvedValue({ id: REFERENCE_ID, loanNumber: 'LN-1' }),
    }
    const loanItemCapability = { findByLoanId: jest.fn().mockResolvedValue([]) }
    const unitMutation = {
      updateStatuses: jest.fn(),
      updateCondition: jest.fn(),
    }
    const history = { record: jest.fn() }
    const transactionType = {
      findTransactionTypeByCode: jest
        .fn()
        .mockResolvedValue({ id: 'transaction-loan-out' }),
    }
    const useCase = new ProcessApprovalUseCase(
      repository,
      statusLookup,
      loanCapability,
      loanItemCapability,
      unitMutation,
      history,
      transactionType,
    )

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE' },
      USER_ID,
      ['ADMIN'],
    )

    expect(findInstanceById).toHaveBeenNthCalledWith(2, INSTANCE_ID)
    expect(processApprovalTransaction).toHaveBeenCalledTimes(1)
    expect(loanCapability.updateStatus).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      success: true,
      consequence: { status: 'COMPLETED' },
    })
  })

  it('rereads terminal state after losing the claim during P2002 recovery', async () => {
    const pendingLog = {
      id: 'log-raced-pending',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Persisted note',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'PENDING' as const,
      consequenceError: null,
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const completedLog = {
      ...pendingLog,
      consequenceStatus: 'COMPLETED' as const,
      consequenceUpdatedAt: new Date('2026-09-14T00:05:00.000Z'),
    }
    const {
      useCase,
      processApprovalTransaction,
      transitionLogConsequence,
      repository,
      loanCapability,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      roleCodes: ['ADMIN'],
    })
    const findInstanceById = repository.findInstanceById as jest.Mock
    const instance = {
      id: INSTANCE_ID,
      referenceId: REFERENCE_ID,
      statusId: PENDING_STATUS.id,
      currentStepSequence: 1,
      workflow: {
        steps: [
          { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
        ],
      },
    }
    findInstanceById.mockReset()
    findInstanceById
      .mockResolvedValueOnce({ ...instance, logs: [] })
      .mockResolvedValueOnce({
        ...instance,
        statusId: 'st-approved',
        logs: [pendingLog],
      })
      .mockResolvedValueOnce({
        ...instance,
        statusId: 'st-approved',
        logs: [completedLog],
      })
    processApprovalTransaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { target: ['instance_id', 'step_sequence'] },
      }),
    )
    transitionLogConsequence.mockResolvedValueOnce({
      log: pendingLog,
      transitioned: false,
    })

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE' },
      USER_ID,
      ['ADMIN'],
    )

    expect(findInstanceById).toHaveBeenCalledTimes(3)
    expect(processApprovalTransaction).toHaveBeenCalledTimes(1)
    expect(loanCapability.updateStatus).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      success: true,
      log: { id: completedLog.id },
      consequence: { status: 'COMPLETED' },
      retryable: false,
    })
  })

  it('returns not-pending after a first-submit unique race with a conflicting action', async () => {
    const existingRejectLog = {
      id: 'log-reject',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: 'other-user',
      actionId: REJECT_ACTION_ID,
      note: null,
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'REJECTION' as const,
      consequenceStatus: 'PENDING' as const,
      consequenceError: null,
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const instance = {
      id: INSTANCE_ID,
      referenceId: REFERENCE_ID,
      statusId: PENDING_STATUS.id,
      currentStepSequence: 1,
      workflow: {
        steps: [
          { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
        ],
      },
      logs: [existingRejectLog],
    }
    const findInstanceById = jest
      .fn()
      .mockResolvedValueOnce({ ...instance, logs: [] })
      .mockResolvedValueOnce(instance)
    const processApprovalTransaction = jest.fn().mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { target: ['instance_id', 'step_sequence'] },
      }),
    )
    const repository = {
      findInstanceById,
      processApprovalTransaction,
      transitionLogConsequence: jest.fn(),
    } as unknown as IApprovalRepository
    const useCase = new ProcessApprovalUseCase(
      repository,
      {
        findBySystemKey: jest.fn().mockImplementation((key: string) => {
          if (key === 'LOAN_PENDING') return PENDING_STATUS
          if (key === 'LOAN_APPROVED') return { id: 'st-approved' }
          if (key === 'LOANED') return { id: 'st-loaned' }
          return null
        }),
      },
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        findTransactionTypeByCode: jest
          .fn()
          .mockResolvedValue({ id: 'transaction-loan-out' }),
      },
    )

    await expect(
      useCase.execute(INSTANCE_ID, { action: 'APPROVE' }, USER_ID, ['ADMIN']),
    ).rejects.toEqual(
      new BadRequestException('This approval request is no longer pending.'),
    )
  })

  it('ignores a changed forward flag when retrying a stored failed consequence', async () => {
    const failedLog = {
      id: 'log-failed',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Persisted note',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'FAILED' as const,
      consequenceError: 'Previous safe error',
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const {
      useCase,
      transitionLogConsequence,
      loanCapability,
      makeLog,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      statusId: 'st-approved',
      existingLog: failedLog,
      roleCodes: ['ADMIN'],
    })
    transitionLogConsequence.mockResolvedValueOnce({
      log: { ...failedLog, consequenceStatus: 'PENDING' as const },
      transitioned: true,
    })
    transitionLogConsequence.mockResolvedValueOnce({
      log: { ...failedLog, consequenceStatus: 'COMPLETED' as const },
      transitioned: true,
    })

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE', forwardToNextApprover: true },
      USER_ID,
      roleCodes,
    )

    expect(loanCapability.updateStatus).toHaveBeenCalledWith(
      REFERENCE_ID,
      'st-approved',
    )
    expect(result).toMatchObject({
      success: true,
      consequence: { type: 'FINAL_APPROVAL', status: 'COMPLETED' },
    })
  })

  it('marks rejection failure and retries it without another approval log', async () => {
    const failedLog = {
      id: 'log-reject',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: REJECT_ACTION_ID,
      note: 'Unavailable',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'REJECTION' as const,
      consequenceStatus: 'FAILED' as const,
      consequenceError: 'Previous safe error',
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const { useCase, processApprovalTransaction, loanCapability, roleCodes } =
      makeRepository({
        steps: [
          { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
        ],
        statusId: 'st-rejected',
        existingLog: failedLog,
        roleCodes: ['ADMIN'],
      })
    loanCapability.updateStatus
      .mockRejectedValueOnce(new Error('loan service unavailable'))
      .mockResolvedValueOnce({ id: REFERENCE_ID, loanNumber: 'LN-1' })
    const transitionLogConsequence = (
      useCase as unknown as { approvalRepository: IApprovalRepository }
    ).approvalRepository.transitionLogConsequence as jest.Mock
    transitionLogConsequence
      .mockResolvedValueOnce({
        log: { ...failedLog, consequenceStatus: 'PENDING' as const },
        transitioned: true,
      })
      .mockResolvedValueOnce({
        log: { ...failedLog, consequenceStatus: 'FAILED' as const },
        transitioned: true,
      })
      .mockResolvedValueOnce({
        log: { ...failedLog, consequenceStatus: 'PENDING' as const },
        transitioned: true,
      })
      .mockResolvedValueOnce({
        log: { ...failedLog, consequenceStatus: 'COMPLETED' as const },
        transitioned: true,
      })

    const first = await useCase.execute(
      INSTANCE_ID,
      { action: 'REJECT', note: 'New note must not win' },
      USER_ID,
      roleCodes,
    )
    const second = await useCase.execute(
      INSTANCE_ID,
      { action: 'REJECT', note: 'New note must not win' },
      USER_ID,
      roleCodes,
    )

    expect(first).toMatchObject({
      success: false,
      consequence: { type: 'REJECTION', status: 'FAILED' },
      retryable: true,
    })
    expect(second).toMatchObject({
      success: true,
      consequence: { type: 'REJECTION', status: 'COMPLETED' },
    })
    expect(processApprovalTransaction).not.toHaveBeenCalled()
    expect(loanCapability.updateStatus).toHaveBeenCalledTimes(2)
  })

  it('returns the completed state when failure recording loses a state race', async () => {
    const {
      useCase,
      loanCapability,
      transitionLogConsequence,
      makeLog,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      roleCodes: ['ADMIN'],
    })
    loanCapability.updateStatus.mockRejectedValue(
      new Error('loan service unavailable'),
    )
    transitionLogConsequence.mockResolvedValueOnce({
      log: makeLog('log-1', 'FINAL_APPROVAL', 'COMPLETED'),
      transitioned: false,
    })

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE' },
      USER_ID,
      roleCodes,
    )

    expect(result).toMatchObject({
      success: true,
      consequence: { type: 'FINAL_APPROVAL', status: 'COMPLETED' },
      retryable: false,
    })
  })

  it('propagates the downstream error when failure state cannot be saved', async () => {
    const {
      useCase,
      loanCapability,
      transitionLogConsequence,
      makeLog,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      roleCodes: ['ADMIN'],
    })
    const downstreamError = new Error('loan service unavailable')
    loanCapability.updateStatus.mockRejectedValue(downstreamError)
    transitionLogConsequence.mockRejectedValueOnce(
      new Error('approval db down'),
    )

    await expect(
      useCase.execute(INSTANCE_ID, { action: 'APPROVE' }, USER_ID, roleCodes),
    ).rejects.toBe(downstreamError)
  })

  it('replays a completed action without side effects and keeps its stored note', async () => {
    const completedLog = {
      id: 'log-completed',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Persisted note',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'COMPLETED' as const,
      consequenceError: null,
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const {
      useCase,
      processApprovalTransaction,
      transitionLogConsequence,
      loanCapability,
      statusLookup,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      statusId: 'st-approved',
      existingLog: completedLog,
      roleCodes: ['ADMIN'],
    })

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE', note: 'New note must not win' },
      USER_ID,
      ['ADMIN'],
    )

    expect(result).toMatchObject({
      success: true,
      action: 'APPROVE_FINAL',
      log: { id: 'log-completed', note: 'Persisted note' },
      consequence: { type: 'FINAL_APPROVAL', status: 'COMPLETED' },
      retryable: false,
    })
    expect(processApprovalTransaction).not.toHaveBeenCalled()
    expect(transitionLogConsequence).not.toHaveBeenCalled()
    expect(loanCapability.updateStatus).not.toHaveBeenCalled()
    expect(statusLookup.findBySystemKey).not.toHaveBeenCalled()
  })

  it('resumes a failed action without creating another log', async () => {
    const failedLog = {
      id: 'log-failed',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Persisted note',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'FAILED' as const,
      consequenceError: 'Previous safe error',
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const {
      useCase,
      processApprovalTransaction,
      transitionLogConsequence,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      statusId: 'st-approved',
      existingLog: failedLog,
      roleCodes: ['ADMIN'],
    })

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE', note: 'New note must not win' },
      USER_ID,
      roleCodes,
    )

    expect(processApprovalTransaction).not.toHaveBeenCalled()
    expect(transitionLogConsequence).toHaveBeenNthCalledWith(
      1,
      'log-failed',
      'FAILED',
      'PENDING',
      null,
      expect.any(Date),
    )
    expect(transitionLogConsequence).toHaveBeenLastCalledWith(
      'log-failed',
      'PENDING',
      'COMPLETED',
      null,
      expect.any(Date),
    )
    expect(result).toMatchObject({
      success: true,
      log: { id: 'log-failed', note: 'Persisted note' },
      consequence: { status: 'COMPLETED' },
    })
  })

  it('does not resume a failed action after another request keeps it failed', async () => {
    const failedLog = {
      id: 'log-failed',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Persisted note',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'FAILED' as const,
      consequenceError: 'Previous safe error',
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const {
      useCase,
      transitionLogConsequence,
      loanCapability,
      makeLog,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      statusId: 'st-approved',
      existingLog: failedLog,
      roleCodes: ['ADMIN'],
    })
    transitionLogConsequence.mockResolvedValueOnce({
      log: failedLog,
      transitioned: false,
    })

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE' },
      USER_ID,
      roleCodes,
    )

    expect(loanCapability.updateStatus).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      success: false,
      log: { id: 'log-failed' },
      consequence: { status: 'FAILED' },
      retryable: true,
    })
  })

  it('uses a safe fallback when a failed consequence has no persisted error', async () => {
    const failedLog = {
      id: 'log-failed-no-error',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Persisted note',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'FAILED' as const,
      consequenceError: null,
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const { useCase, transitionLogConsequence, loanCapability, roleCodes } =
      makeRepository({
        steps: [
          { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
        ],
        statusId: 'st-approved',
        existingLog: failedLog,
        roleCodes: ['ADMIN'],
      })
    transitionLogConsequence.mockResolvedValueOnce({
      log: failedLog,
      transitioned: false,
    })

    await expect(
      useCase.execute(INSTANCE_ID, { action: 'APPROVE' }, USER_ID, roleCodes),
    ).resolves.toMatchObject({
      success: false,
      consequence: {
        status: 'FAILED',
        error:
          'Approval consequence could not be completed. Retry this action.',
      },
      retryable: true,
    })
    expect(loanCapability.updateStatus).not.toHaveBeenCalled()
  })

  it('does not report a missing completion transition as successful pending work', async () => {
    const pendingLog = {
      id: 'log-pending',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: null,
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'PENDING' as const,
      consequenceError: null,
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const findInstanceById = jest
      .fn()
      .mockResolvedValueOnce({
        id: INSTANCE_ID,
        referenceId: REFERENCE_ID,
        statusId: PENDING_STATUS.id,
        currentStepSequence: 1,
        workflow: {
          steps: [
            { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
          ],
        },
      })
      .mockResolvedValueOnce({
        id: INSTANCE_ID,
        referenceId: REFERENCE_ID,
        statusId: 'st-approved',
        currentStepSequence: 1,
        workflow: {
          steps: [
            { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
          ],
        },
        logs: [{ ...pendingLog, consequenceStatus: 'PENDING' as const }],
      })
    const processApprovalTransaction = jest.fn().mockResolvedValue({
      success: true,
      action: 'APPROVE_FINAL',
      log: pendingLog,
      consequence: { type: 'FINAL_APPROVAL', status: 'PENDING' },
      retryable: false,
    })
    const transitionLogConsequence = jest
      .fn()
      .mockResolvedValueOnce({ log: null, transitioned: false })
    const repository = {
      findInstanceById,
      processApprovalTransaction,
      transitionLogConsequence,
    } as unknown as IApprovalRepository
    const statusLookup = {
      findBySystemKey: jest.fn().mockImplementation((key: string) => {
        if (key === 'LOAN_PENDING') return PENDING_STATUS
        if (key === 'LOAN_APPROVED') return { id: 'st-approved' }
        if (key === 'LOANED') return { id: 'st-loaned' }
        return null
      }),
    }
    const loanCapability = {
      findDetailsByIds: jest.fn(),
      updateStatus: jest
        .fn()
        .mockResolvedValue({ id: REFERENCE_ID, loanNumber: 'LN-1' }),
    }
    const loanItemCapability = { findByLoanId: jest.fn().mockResolvedValue([]) }
    const unitMutation = {
      updateStatuses: jest.fn(),
      updateCondition: jest.fn(),
    }
    const history = { record: jest.fn() }
    const transactionType = {
      findTransactionTypeByCode: jest
        .fn()
        .mockResolvedValue({ id: 'transaction-loan-out' }),
    }
    const useCase = new ProcessApprovalUseCase(
      repository,
      statusLookup,
      loanCapability,
      loanItemCapability,
      unitMutation,
      history,
      transactionType,
    )

    await expect(
      useCase.execute(INSTANCE_ID, { action: 'APPROVE' }, USER_ID, ['ADMIN']),
    ).rejects.toThrow('Approval consequence log could not be loaded.')
    expect(loanCapability.updateStatus).toHaveBeenCalled()
  })

  it('returns the stored failed state when completion loses a state race', async () => {
    const failedLog = {
      id: 'log-failed',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: null,
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'FAILED' as const,
      consequenceError: 'Stored safe error',
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const {
      useCase,
      transitionLogConsequence,
      loanCapability,
      makeLog,
      roleCodes,
    } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      roleCodes: ['ADMIN'],
    })
    transitionLogConsequence.mockResolvedValueOnce({
      log: failedLog,
      transitioned: false,
    })

    const result = await useCase.execute(
      INSTANCE_ID,
      { action: 'APPROVE' },
      USER_ID,
      roleCodes,
    )

    expect(loanCapability.updateStatus).toHaveBeenCalled()
    expect(result).toMatchObject({
      success: false,
      log: { id: 'log-failed' },
      consequence: { status: 'FAILED', error: 'Stored safe error' },
      retryable: true,
    })
  })

  it('rejects a conflicting action already occupying the active step', async () => {
    const existingLog = {
      id: 'log-existing',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: USER_ID,
      actionId: APPROVE_ACTION_ID,
      note: 'Approved',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'PENDING' as const,
      consequenceError: null,
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const { useCase, processApprovalTransaction, roleCodes } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      logs: [existingLog],
      roleCodes: ['ADMIN'],
    })

    await expect(
      useCase.execute(INSTANCE_ID, { action: 'REJECT' }, USER_ID, roleCodes),
    ).rejects.toEqual(
      new BadRequestException('This approval request is no longer pending.'),
    )
    expect(processApprovalTransaction).not.toHaveBeenCalled()
  })

  it('rejects a conflicting approver already occupying the active step', async () => {
    const existingLog = {
      id: 'log-existing',
      instanceId: INSTANCE_ID,
      stepSequence: 1,
      approverId: 'other-user',
      actionId: APPROVE_ACTION_ID,
      note: 'Approved',
      createdAt: new Date('2026-09-14T00:03:00.000Z'),
      consequenceType: 'FINAL_APPROVAL' as const,
      consequenceStatus: 'PENDING' as const,
      consequenceError: null,
      consequenceUpdatedAt: new Date('2026-09-14T00:04:00.000Z'),
    }
    const { useCase, processApprovalTransaction, roleCodes } = makeRepository({
      steps: [
        { stepSequence: 1, approverRoleCode: 'ADMIN', isMandatory: true },
      ],
      logs: [existingLog],
      roleCodes: ['ADMIN'],
    })

    await expect(
      useCase.execute(INSTANCE_ID, { action: 'APPROVE' }, USER_ID, roleCodes),
    ).rejects.toEqual(
      new BadRequestException('This approval request is no longer pending.'),
    )
    expect(processApprovalTransaction).not.toHaveBeenCalled()
  })
})
