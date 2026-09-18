import { readFileSync } from 'node:fs'
import { moveUnitsAndRecord } from './inventory-unit-movement.steps.js'

describe('moveUnitsAndRecord', () => {
  function operationsSpy() {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 })
    const update = jest.fn().mockResolvedValue({})
    const create = jest.fn().mockResolvedValue({})

    const operations = {
      updateStatuses: jest.fn().mockResolvedValue(undefined),
      updateCondition: jest.fn().mockResolvedValue(undefined),
      record: jest.fn().mockResolvedValue(undefined),
    }

    return { operations, updateMany, update, create }
  }

  it('moves every unit to the destination in one statement', async () => {
    const { operations } = operationsSpy()

    await moveUnitsAndRecord(operations, {
      units: [{ unitId: 'u1' }, { unitId: 'u2' }],
      newStatusId: 'st-loaned',
      transactionTypeId: 'tx-out',
      note: 'Dipinjam',
      changedById: 'user-1',
    })

    expect(operations.updateStatuses).toHaveBeenCalledWith({
      unitIds: ['u1', 'u2'],
      statusId: 'st-loaned',
    })
  })

  it('writes one history row per unit, never one for the batch', async () => {
    const { operations } = operationsSpy()

    await moveUnitsAndRecord(operations, {
      units: [{ unitId: 'u1' }, { unitId: 'u2' }, { unitId: 'u3' }],
      newStatusId: 'st-avail',
      transactionTypeId: 'tx-cancel',
      note: 'Ditolak',
      changedById: 'user-1',
    })

    expect(operations.record).toHaveBeenCalledTimes(3)
  })

  it("records each unit's own previous status when they differ", async () => {
    const { operations } = operationsSpy()

    await moveUnitsAndRecord(operations, {
      units: [
        { unitId: 'u1', previousStatusId: 'st-a' },
        { unitId: 'u2', previousStatusId: 'st-b' },
      ],
      newStatusId: 'st-loaned',
      transactionTypeId: 'tx-out',
      note: 'Otomatis disetujui',
      changedById: 'user-1',
    })

    expect(operations.record.mock.calls[0][0].previousStatusId).toBe('st-a')
    expect(operations.record.mock.calls[1][0].previousStatusId).toBe('st-b')
  })

  it('omits the previous status when the caller has none', async () => {
    const { operations } = operationsSpy()

    await moveUnitsAndRecord(operations, {
      units: [{ unitId: 'u1' }],
      newStatusId: 'st-avail',
      transactionTypeId: 'tx-in',
      note: 'Dikembalikan',
      changedById: 'user-1',
    })

    expect(operations.record.mock.calls[0][0]).not.toHaveProperty(
      'previousStatusId',
    )
  })

  it('re-assesses condition only where the caller sets one', async () => {
    const { operations } = operationsSpy()

    await moveUnitsAndRecord(operations, {
      units: [{ unitId: 'u1', conditionId: 'cond-damaged' }, { unitId: 'u2' }],
      newStatusId: 'st-avail',
      transactionTypeId: 'tx-in',
      note: 'Dikembalikan',
      changedById: 'user-1',
    })

    expect(operations.updateCondition).toHaveBeenCalledTimes(1)
    expect(operations.updateCondition).toHaveBeenCalledWith({
      unitId: 'u1',
      conditionId: 'cond-damaged',
    })
  })

  it('prefers a per-unit note over the shared one', async () => {
    const { operations } = operationsSpy()

    await moveUnitsAndRecord(operations, {
      units: [{ unitId: 'u1', note: 'Layar retak' }, { unitId: 'u2' }],
      newStatusId: 'st-avail',
      transactionTypeId: 'tx-in',
      note: 'Pengembalian pinjaman',
      changedById: 'user-1',
    })

    expect(operations.record.mock.calls[0][0].note).toBe('Layar retak')
    expect(operations.record.mock.calls[1][0].note).toBe(
      'Pengembalian pinjaman',
    )
  })

  it('touches nothing when there are no units', async () => {
    const { operations } = operationsSpy()

    await moveUnitsAndRecord(operations, {
      units: [],
      newStatusId: 'st-avail',
      transactionTypeId: 'tx-in',
      note: 'Kosong',
      changedById: 'user-1',
    })

    expect(operations.updateStatuses).not.toHaveBeenCalled()
    expect(operations.record).not.toHaveBeenCalled()
  })

  it('awaits status movement before recording history', async () => {
    const order: string[] = []
    const operations = {
      updateStatuses: async () => {
        await Promise.resolve()
        order.push('status')
      },
      updateCondition: () =>
        Promise.resolve().then(() => {
          order.push('condition')
        }),
      record: () =>
        Promise.resolve().then(() => {
          order.push('history')
        }),
    }

    await moveUnitsAndRecord(operations, {
      units: [{ unitId: 'u1', conditionId: 'cond-damaged' }],
      newStatusId: 'st-avail',
      transactionTypeId: 'tx-in',
      note: 'Dikembalikan',
      changedById: 'user-1',
    })

    expect(order).toEqual(['status', 'condition', 'history'])
  })

  it('delegates movement and history through narrow capabilities', async () => {
    const { operations } = operationsSpy()

    await moveUnitsAndRecord(operations, {
      units: [{ unitId: 'u1', conditionId: 'cond-damaged' }],
      newStatusId: 'st-avail',
      transactionTypeId: 'tx-in',
      note: 'Dikembalikan',
      changedById: 'user-1',
    })

    expect(operations.updateStatuses).toHaveBeenCalledWith({
      unitIds: ['u1'],
      statusId: 'st-avail',
    })
    expect(operations.updateCondition).toHaveBeenCalledWith({
      unitId: 'u1',
      conditionId: 'cond-damaged',
    })
    expect(operations.record).toHaveBeenCalledWith({
      unitId: 'u1',
      transactionTypeId: 'tx-in',
      newStatusId: 'st-avail',
      note: 'Dikembalikan',
      changedById: 'user-1',
    })
  })

  it('keeps Prisma and concrete module imports out of shared helper source', () => {
    const source = readFileSync(
      'src/inventory/shared/infrastructure/inventory-unit-movement.steps.ts',
      'utf8',
    )

    expect(source).not.toMatch(/@prisma\/client|inventory\/(asset|circulation)/)
  })
})
