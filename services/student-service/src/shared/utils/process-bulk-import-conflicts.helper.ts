import { Logger } from '@nestjs/common'

interface BulkImportConflictItem {
  action: 'update' | 'skip'
  existingId?: string
}

export interface BulkImportConflictError {
  index: number
  existingId: string
  error: string
}

export interface BulkImportConflictsResult {
  total: number
  updated: number
  skipped: number
  failed: number
  errors: BulkImportConflictError[]
}

export async function processBulkImportConflicts<
  TItem extends BulkImportConflictItem,
>(
  items: TItem[],
  entityLabel: string,
  logger: Logger,
  process: (item: TItem) => Promise<void>,
): Promise<BulkImportConflictsResult> {
  let updated = 0
  let skipped = 0
  let failed = 0
  const errors: BulkImportConflictError[] = []

  for (const [index, item] of items.entries()) {
    if (item.action === 'skip') {
      skipped++
      continue
    }

    try {
      await process(item)
      updated++
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : 'Unexpected error'
      errors.push({
        index,
        existingId: item.existingId ?? 'NEW_ROW',
        error: message,
      })
      logger.warn(
        `Failed to resolve conflict/creation for ${entityLabel} ${item.existingId ?? 'new'}: ${message}`,
      )
    }
  }

  return { total: items.length, updated, skipped, failed, errors }
}
