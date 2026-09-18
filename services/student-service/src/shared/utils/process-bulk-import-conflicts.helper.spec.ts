import { Logger } from '@nestjs/common'
import { processBulkImportConflicts } from './process-bulk-import-conflicts.helper.js'

describe('processBulkImportConflicts', () => {
  let logger: Logger

  beforeEach(() => {
    logger = {
      warn: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger
  })

  it('processes updates successfully', async () => {
    const items = [
      { action: 'update' as const, existingId: 'id-1' },
      { action: 'update' as const, existingId: 'id-2' },
    ]
    const process = jest.fn().mockResolvedValue(undefined)

    const result = await processBulkImportConflicts(
      items,
      'thing',
      logger,
      process,
    )

    expect(result.total).toBe(2)
    expect(result.updated).toBe(2)
    expect(result.skipped).toBe(0)
    expect(result.failed).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(process).toHaveBeenCalledTimes(2)
  })

  it('skips items with action = skip without calling process', async () => {
    const items = [
      { action: 'skip' as const, existingId: 'id-1' },
      { action: 'update' as const, existingId: 'id-2' },
    ]
    const process = jest.fn().mockResolvedValue(undefined)

    const result = await processBulkImportConflicts(
      items,
      'thing',
      logger,
      process,
    )

    expect(result.total).toBe(2)
    expect(result.updated).toBe(1)
    expect(result.skipped).toBe(1)
    expect(result.failed).toBe(0)
    expect(process).toHaveBeenCalledTimes(1)
  })

  it('records failed items and logs a warning', async () => {
    const items = [{ action: 'update' as const, existingId: 'id-1' }]
    const process = jest.fn().mockRejectedValue(new Error('boom'))

    const result = await processBulkImportConflicts(
      items,
      'thing',
      logger,
      process,
    )

    expect(result.updated).toBe(0)
    expect(result.failed).toBe(1)
    expect(result.skipped).toBe(0)
    expect(result.errors).toEqual([
      { index: 0, existingId: 'id-1', error: 'boom' },
    ])
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Failed to resolve conflict/creation for thing id-1',
      ),
    )
  })

  it('uses NEW_ROW when existingId is undefined on failure', async () => {
    const items = [{ action: 'update' as const }]
    const process = jest.fn().mockRejectedValue(new Error('fail'))

    const result = await processBulkImportConflicts(
      items,
      'thing',
      logger,
      process,
    )

    expect(result.failed).toBe(1)
    expect(result.errors[0].existingId).toBe('NEW_ROW')
  })

  it('handles non-Error objects thrown', async () => {
    const items = [{ action: 'update' as const, existingId: 'id-1' }]
    const process = jest.fn().mockRejectedValue('raw string error')

    const result = await processBulkImportConflicts(
      items,
      'thing',
      logger,
      process,
    )

    expect(result.failed).toBe(1)
    expect(result.errors[0].error).toBe('Unexpected error')
  })

  it('returns zeroes when items array is empty', async () => {
    const result = await processBulkImportConflicts(
      [],
      'thing',
      logger,
      jest.fn(),
    )

    expect(result).toEqual({
      total: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    })
  })

  it('numbers an error by its place in the submitted array, skips included', async () => {
    const items = [
      { action: 'skip' as const, existingId: 'id-1' },
      { action: 'update' as const, existingId: 'id-2' },
      { action: 'update' as const },
    ]
    const process = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('boom'))

    const result = await processBulkImportConflicts(
      items,
      'thing',
      logger,
      process,
    )

    expect(result.errors).toEqual([
      { index: 2, existingId: 'NEW_ROW', error: 'boom' },
    ])
  })
})
