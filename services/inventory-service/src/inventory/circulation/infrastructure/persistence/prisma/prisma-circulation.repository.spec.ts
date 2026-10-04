import type { PrismaService } from '../../../../../core/database/prisma.service.js'
import { readFileSync } from 'node:fs'
import { PrismaCirculationRepository } from './prisma-circulation.repository.js'

describe('PrismaCirculationRepository', () => {
  function unitDetailsCapability() {
    return {
      findLiveIds: jest.fn().mockResolvedValue([]),
      findDetailsByIds: jest.fn().mockResolvedValue([]),
    }
  }

  it('keeps loan projections limited to circulation-owned relations', () => {
    const source = readFileSync(
      'src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.includes.ts',
      'utf8',
    )

    expect(source).toMatch(/items/)
    expect(source).not.toMatch(/asset|location|status|condition/)
  })

  it('keeps transaction callbacks limited to circulation-owned Prisma writes', () => {
    const source = readFileSync(
      'src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.ts',
      'utf8',
    )
    const createTransaction = source.slice(
      source.indexOf('async processCreateLoanTransaction'),
    )

    expect(createTransaction).not.toMatch(
      /tx\.(inventoryAsset|inventoryAssetUnit|inventoryStatus|approvalWorkflow|approvalInstance)/,
    )
    expect(createTransaction).toMatch(/tx\.inventoryLoan/)
  })

  it('maps paginated loans and applies keyword, status, and requester filters', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'loan-1',
        loanNumber: 'LN-20260914-0001',
        requesterId: 'requester-1',
        expectedReturnDate: new Date('2026-10-01T00:00:00.000Z'),
        actualReturnDate: null,
        purpose: 'Workshop',
        statusId: 'status-approved',
        workflowInstanceId: null,
        createdAt: new Date('2026-09-14T00:00:00.000Z'),
        updatedAt: new Date('2026-09-14T00:00:00.000Z'),
        items: [],
      },
    ])
    const count = jest.fn().mockResolvedValue(1)
    const prisma = {
      inventoryLoan: { findMany, count },
    } as unknown as PrismaService

    const result = await new PrismaCirculationRepository(
      prisma,
      unitDetailsCapability(),
    ).findAllLoans({
      page: 2,
      limit: 5,
      keyword: ' workshop ',
      statusId: 'status-approved',
      requesterId: 'requester-1',
    })

    expect(result).toEqual({
      data: [
        expect.objectContaining({
          id: 'loan-1',
          loanNumber: 'LN-20260914-0001',
          requesterId: 'requester-1',
        }),
      ],
      total: 1,
      page: 2,
      limit: 5,
    })
    const where = {
      statusId: 'status-approved',
      requesterId: 'requester-1',
      OR: [
        { loanNumber: { contains: ' workshop ', mode: 'insensitive' } },
        { purpose: { contains: ' workshop ', mode: 'insensitive' } },
      ],
    }
    expect(findMany).toHaveBeenCalledWith({
      where,
      skip: 5,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: expect.any(Object),
    })
    expect(count).toHaveBeenCalledWith({ where })
  })

  it('maps every history field and preserves pagination and unit filtering', async () => {
    const history = {
      id: 'history-1',
      unitId: 'unit-1',
      transactionTypeId: 'tx-1',
      previousConditionId: 'condition-old',
      newConditionId: 'condition-new',
      previousStatusId: 'status-old',
      newStatusId: 'status-new',
      previousLocationId: 'location-old',
      newLocationId: 'location-new',
      previousCustodianId: 'custodian-old',
      newCustodianId: 'custodian-new',
      note: 'Moved',
      changedById: 'user-1',
      changedAt: new Date('2026-09-14T00:00:00.000Z'),
      unit: {
        id: 'unit-1',
        assetId: 'asset-1',
        unitNumber: 'LAP-001',
        barcode: 'BAR-001',
        currentBookValue: '750.00',
        conditionId: 'condition-new',
        statusId: 'status-new',
        locationId: 'location-new',
        custodianId: 'custodian-new',
        notes: 'Unit note',
        version: 2,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-09-14T00:00:00.000Z'),
        deletedAt: null,
        asset: {
          id: 'asset-1',
          assetNumber: 'AST-001',
          name: 'Laptop',
          categoryId: 'category-1',
          brand: 'Brand',
          model: 'Model',
          purchaseDate: new Date('2026-01-01T00:00:00.000Z'),
          purchasePrice: '1000.00',
          usefulLifeMonths: 36,
          fundingSourceId: 'funding-1',
          imageUrl: null,
          notes: 'Asset note',
          version: 1,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          deletedAt: null,
        },
      },
      transactionType: {
        id: 'tx-1',
        code: 'TX-LOAN-IN',
        name: 'Loan in',
        direction: 'IN',
        description: 'Loan return',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    }
    const findMany = jest.fn().mockResolvedValue([history])
    const count = jest.fn().mockResolvedValue(1)
    const unitDetails = {
      findLiveIds: jest.fn().mockResolvedValue(['unit-1']),
      findDetailsByIds: jest.fn().mockResolvedValue([history.unit]),
    }
    const prisma = {
      inventoryHistory: { findMany, count },
    } as unknown as PrismaService

    await expect(
      new PrismaCirculationRepository(
        prisma,
        unitDetails as never,
      ).findAllHistories({
        page: 3,
        limit: 25,
        unitId: 'unit-1',
      }),
    ).resolves.toEqual({
      data: [history],
      total: 1,
      page: 3,
      limit: 25,
    })

    const where = { unitId: { in: ['unit-1'] } }
    expect(findMany).toHaveBeenCalledWith({
      where,
      skip: 50,
      take: 25,
      orderBy: { changedAt: 'desc' },
      include: expect.any(Object),
    })
    expect(count).toHaveBeenCalledWith({ where })
  })

  it('scopes loan item reads to live asset units', async () => {
    const findMany = jest.fn().mockResolvedValue([])
    const findLiveIds = jest.fn().mockResolvedValue([])
    const prisma = {
      inventoryLoanItem: { findMany },
    } as unknown as PrismaService

    await new PrismaCirculationRepository(prisma, {
      findLiveIds,
    } as never).findByLoanId('loan-1')

    expect(findMany).toHaveBeenCalledWith({
      where: { loanId: 'loan-1' },
      select: { unitId: true },
    })
    expect(findLiveIds).toHaveBeenCalledWith([])
  })

  it('scopes history reads to live asset units in the database', async () => {
    const findMany = jest.fn().mockResolvedValue([])
    const count = jest.fn().mockResolvedValue(0)
    const findLiveIds = jest.fn().mockResolvedValue([])
    const prisma = {
      inventoryHistory: { findMany, count },
    } as unknown as PrismaService

    await new PrismaCirculationRepository(prisma, {
      findLiveIds,
    } as never).findAllHistories({
      page: 1,
      limit: 10,
    })

    expect(findLiveIds).toHaveBeenCalledWith(undefined)
    expect(findMany.mock.calls.at(-1)?.[0].where).toEqual({
      unitId: { in: [] },
    })
    expect(count).toHaveBeenCalledWith({
      where: { unitId: { in: [] } },
    })
  })

  it('propagates create transaction errors', async () => {
    const error = new Error('transaction failed')
    const prisma = {
      $transaction: jest.fn().mockRejectedValue(error),
    } as unknown as PrismaService
    const repository = new PrismaCirculationRepository(
      prisma,
      unitDetailsCapability(),
    )

    await expect(
      repository.processCreateLoanTransaction({
        loanNumber: 'LN-20260914-0001',
        requesterId: 'user-1',
        expectedReturnDate: new Date('2026-10-01T00:00:00.000Z'),
        purpose: 'Workshop',
        pendingStatusId: 'status-pending',
        unitIds: ['unit-1'],
      }),
    ).rejects.toBe(error)
  })

  it('propagates return write errors', async () => {
    const error = new Error('return write failed')
    const prisma = {
      inventoryLoan: { update: jest.fn().mockRejectedValue(error) },
    } as unknown as PrismaService
    const repository = new PrismaCirculationRepository(
      prisma,
      unitDetailsCapability(),
    )

    await expect(
      repository.processReturnLoanTransaction({
        loanId: 'loan-1',
        returnedStatusId: 'status-returned',
      }),
    ).rejects.toBe(error)
  })

  it('maps Prisma loan and item fields to the circulation port output', async () => {
    const loan = {
      id: 'loan-1',
      loanNumber: 'LN-20260914-0001',
      requesterId: 'requester-1',
      expectedReturnDate: new Date('2026-10-01T00:00:00.000Z'),
      actualReturnDate: null,
      purpose: 'Workshop',
      statusId: 'status-approved',
      workflowInstanceId: 'workflow-instance-1',
      createdAt: new Date('2026-09-14T00:00:00.000Z'),
      updatedAt: new Date('2026-09-14T00:00:00.000Z'),
      items: [
        {
          id: 'item-1',
          loanId: 'loan-1',
          unitId: 'unit-1',
          returnedConditionId: null,
          notes: 'No damage',
          unit: {
            id: 'unit-1',
            unitNumber: 'LAP-001',
            asset: {
              id: 'asset-1',
              assetNumber: 'AST-001',
              name: 'Laptop',
              categoryId: 'category-1',
              brand: 'Brand',
              model: 'Model',
              purchaseDate: new Date('2026-01-01T00:00:00.000Z'),
              purchasePrice: '1000.00',
              usefulLifeMonths: 36,
              fundingSourceId: 'funding-1',
              imageUrl: null,
              notes: 'Asset note',
              version: 1,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
              updatedAt: new Date('2026-01-01T00:00:00.000Z'),
              deletedAt: null,
            },
            assetId: 'asset-1',
            barcode: 'BAR-001',
            currentBookValue: '750.00',
            conditionId: 'condition-good',
            statusId: 'status-approved',
            locationId: 'location-1',
            custodianId: 'custodian-1',
            notes: 'Unit note',
            version: 2,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-09-14T00:00:00.000Z'),
            deletedAt: null,
            location: {
              id: 'location-1',
              code: 'LAB-1',
              name: 'Lab 1',
              building: 'Main',
              room: '101',
              rack: 'A',
              description: 'Computer lab',
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
            status: {
              id: 'status-approved',
              code: 'LOANED',
              name: 'Loaned',
              allowTransactions: false,
              systemKey: 'LOANED',
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
            condition: {
              id: 'condition-good',
              code: 'GOOD',
              name: 'Good',
              isUsable: true,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
          },
        },
      ],
      legacyField: 'must not escape adapter',
    }
    const findUnique = jest.fn().mockResolvedValue(loan)
    const findDetailsByIds = jest.fn().mockResolvedValue([loan.items[0].unit])
    const prisma = {
      inventoryLoan: { findUnique },
    } as unknown as PrismaService
    const repository = new PrismaCirculationRepository(prisma, {
      findDetailsByIds,
    } as never)

    await expect(repository.findLoanById('loan-1')).resolves.toEqual({
      id: 'loan-1',
      loanNumber: 'LN-20260914-0001',
      requesterId: 'requester-1',
      expectedReturnDate: new Date('2026-10-01T00:00:00.000Z'),
      actualReturnDate: null,
      purpose: 'Workshop',
      statusId: 'status-approved',
      workflowInstanceId: 'workflow-instance-1',
      items: [
        {
          id: 'item-1',
          loanId: 'loan-1',
          unitId: 'unit-1',
          returnedConditionId: null,
          note: 'No damage',
          unit: {
            id: 'unit-1',
            unitNumber: 'LAP-001',
            asset: {
              id: 'asset-1',
              assetNumber: 'AST-001',
              name: 'Laptop',
              categoryId: 'category-1',
              brand: 'Brand',
              model: 'Model',
              purchaseDate: new Date('2026-01-01T00:00:00.000Z'),
              purchasePrice: '1000.00',
              usefulLifeMonths: 36,
              fundingSourceId: 'funding-1',
              imageUrl: null,
              notes: 'Asset note',
              version: 1,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
              updatedAt: new Date('2026-01-01T00:00:00.000Z'),
              deletedAt: null,
            },
            assetId: 'asset-1',
            barcode: 'BAR-001',
            currentBookValue: '750.00',
            conditionId: 'condition-good',
            statusId: 'status-approved',
            locationId: 'location-1',
            custodianId: 'custodian-1',
            notes: 'Unit note',
            version: 2,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-09-14T00:00:00.000Z'),
            deletedAt: null,
            location: {
              id: 'location-1',
              code: 'LAB-1',
              name: 'Lab 1',
              building: 'Main',
              room: '101',
              rack: 'A',
              description: 'Computer lab',
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
            status: {
              id: 'status-approved',
              code: 'LOANED',
              name: 'Loaned',
              allowTransactions: false,
              systemKey: 'LOANED',
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
            condition: {
              id: 'condition-good',
              code: 'GOOD',
              name: 'Good',
              isUsable: true,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            },
          },
        },
      ],
      createdAt: new Date('2026-09-14T00:00:00.000Z'),
      updatedAt: new Date('2026-09-14T00:00:00.000Z'),
    })
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'loan-1' },
      include: expect.any(Object),
    })
  })

  it('loads loan details in one bulk query and maps each result', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'loan-1',
        loanNumber: 'LN-20260914-0001',
        purpose: 'Workshop',
        expectedReturnDate: new Date('2026-10-01T00:00:00.000Z'),
        items: [
          {
            id: 'item-1',
            unitId: 'unit-1',
            unit: {
              id: 'unit-1',
              unitNumber: 'LAP-001',
              asset: { id: 'asset-1', name: 'Laptop' },
            },
          },
        ],
      },
      {
        id: 'loan-2',
        loanNumber: 'LN-20260914-0002',
        purpose: 'Meeting',
        expectedReturnDate: new Date('2026-10-02T00:00:00.000Z'),
        items: [],
      },
    ])
    const findUnique = jest.fn()
    const unitDetails = {
      findLiveIds: jest.fn(),
      findDetailsByIds: jest.fn().mockResolvedValue([
        {
          id: 'unit-1',
          assetId: 'asset-1',
          unitNumber: 'LAP-001',
          barcode: null,
          currentBookValue: '1',
          conditionId: 'condition-1',
          statusId: 'status-1',
          locationId: 'location-1',
          custodianId: null,
          notes: null,
          deletedAt: null,
          version: 1,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          asset: {
            id: 'asset-1',
            assetNumber: 'AST-001',
            name: 'Laptop',
          },
        },
      ]),
    }
    const prisma = {
      inventoryLoan: { findMany, findUnique },
    } as unknown as PrismaService

    await expect(
      new PrismaCirculationRepository(
        prisma,
        unitDetails as never,
      ).findDetailsByIds(['loan-1', 'loan-2']),
    ).resolves.toEqual([
      {
        id: 'loan-1',
        loanNumber: 'LN-20260914-0001',
        purpose: 'Workshop',
        expectedReturnDate: new Date('2026-10-01T00:00:00.000Z'),
        items: [
          {
            id: 'item-1',
            unitId: 'unit-1',
            unit: {
              id: 'unit-1',
              unitNumber: 'LAP-001',
              asset: { id: 'asset-1', name: 'Laptop' },
            },
          },
        ],
      },
      {
        id: 'loan-2',
        loanNumber: 'LN-20260914-0002',
        purpose: 'Meeting',
        expectedReturnDate: new Date('2026-10-02T00:00:00.000Z'),
        items: [],
      },
    ])
    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: ['loan-1', 'loan-2'] } },
      include: expect.any(Object),
    })
    expect(findMany).toHaveBeenCalledTimes(1)
    expect(findUnique).not.toHaveBeenCalled()
  })

  it('creates loan-owned records without requiring asset or approval Prisma models', async () => {
    const loan = {
      id: 'loan-1',
      loanNumber: 'LN-20260914-0001',
      requesterId: 'user-1',
      expectedReturnDate: new Date('2026-10-01T00:00:00.000Z'),
      actualReturnDate: null,
      purpose: 'Workshop',
      statusId: 'status-pending',
      workflowInstanceId: null,
      createdAt: new Date('2026-09-14T00:00:00.000Z'),
      updatedAt: new Date('2026-09-14T00:00:00.000Z'),
      items: [],
    }
    const create = jest.fn().mockResolvedValue(loan)
    const transaction = jest.fn((callback: (tx: unknown) => unknown) =>
      callback({ inventoryLoan: { create } }),
    )
    const prisma = { $transaction: transaction } as unknown as PrismaService

    await expect(
      new PrismaCirculationRepository(
        prisma,
        unitDetailsCapability() as never,
      ).processCreateLoanTransaction({
        loanNumber: loan.loanNumber,
        requesterId: loan.requesterId,
        expectedReturnDate: loan.expectedReturnDate,
        purpose: loan.purpose,
        pendingStatusId: loan.statusId,
        unitIds: ['unit-1'],
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'loan-1' }))
    expect(create).toHaveBeenCalled()
  })

  it('updates loan-owned return fields without requiring asset Prisma models', async () => {
    const update = jest.fn().mockResolvedValue({
      id: 'loan-1',
      loanNumber: 'LN-20260914-0001',
      requesterId: 'user-1',
      expectedReturnDate: new Date('2026-10-01T00:00:00.000Z'),
      actualReturnDate: new Date('2026-09-14T00:00:00.000Z'),
      purpose: 'Workshop',
      statusId: 'status-returned',
      workflowInstanceId: null,
      createdAt: new Date('2026-09-14T00:00:00.000Z'),
      updatedAt: new Date('2026-09-14T00:00:00.000Z'),
    })
    const prisma = { inventoryLoan: { update } } as unknown as PrismaService

    await expect(
      new PrismaCirculationRepository(
        prisma,
        unitDetailsCapability() as never,
      ).processReturnLoanTransaction({
        loanId: 'loan-1',
        returnedStatusId: 'status-returned',
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'loan-1' }))
    expect(update).toHaveBeenCalled()
  })

  it('does not open a transaction for a single circulation-owned return write', async () => {
    const update = jest.fn().mockResolvedValue({
      id: 'loan-1',
      loanNumber: 'LN-20260914-0001',
      requesterId: 'user-1',
      expectedReturnDate: new Date('2026-10-01T00:00:00.000Z'),
      actualReturnDate: new Date('2026-09-14T00:00:00.000Z'),
      purpose: 'Workshop',
      statusId: 'status-returned',
      workflowInstanceId: null,
      createdAt: new Date('2026-09-14T00:00:00.000Z'),
      updatedAt: new Date('2026-09-14T00:00:00.000Z'),
    })
    const transaction = jest.fn()
    const prisma = {
      inventoryLoan: { update },
      $transaction: transaction,
    } as unknown as PrismaService

    await expect(
      new PrismaCirculationRepository(
        prisma,
        unitDetailsCapability() as never,
      ).processReturnLoanTransaction({
        loanId: 'loan-1',
        returnedStatusId: 'status-returned',
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'loan-1' }))

    expect(update).toHaveBeenCalledWith({
      where: { id: 'loan-1' },
      data: {
        actualReturnDate: expect.any(Date),
        statusId: 'status-returned',
      },
    })
    expect(transaction).not.toHaveBeenCalled()
  })

  it('upserts keyed history capability writes and preserves unkeyed creates', async () => {
    const upsert = jest.fn().mockResolvedValue(undefined)
    const create = jest.fn().mockResolvedValue({})
    const prisma = {
      inventoryHistory: { upsert, create },
    } as unknown as PrismaService
    const repository = new PrismaCirculationRepository(
      prisma,
      unitDetailsCapability(),
    )

    await repository.record({
      unitId: 'unit-1',
      transactionTypeId: 'transaction-1',
      newStatusId: 'status-loaned',
      note: 'Approval consequence',
      changedById: 'user-1',
      operationKey: 'log-1:unit-1',
    })
    await repository.record({
      unitId: 'unit-1',
      transactionTypeId: 'transaction-1',
      newStatusId: 'status-loaned',
      note: 'Approval consequence retry',
      changedById: 'user-1',
      operationKey: 'log-1:unit-1',
    })
    await repository.record({
      unitId: 'unit-2',
      transactionTypeId: 'transaction-1',
      newStatusId: 'status-loaned',
      note: 'Manual movement',
      changedById: 'user-1',
    })

    expect(upsert).toHaveBeenCalledWith({
      where: { operationKey: 'log-1:unit-1' },
      create: expect.objectContaining({
        operationKey: 'log-1:unit-1',
        unitId: 'unit-1',
      }),
      update: {},
    })
    expect(upsert).toHaveBeenCalledTimes(2)
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        unitId: 'unit-2',
        operationKey: undefined,
      }),
    })
  })
})
