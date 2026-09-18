import { InventoryStatusKey } from '../../../../../shared/domain/enums/inventory-status-key.enum.js'
import type { StatusRepositoryOutput } from './status.repository.js'

type Equal<Actual, Expected> =
  (<Value>() => Value extends Actual ? 1 : 2) extends <
    Value,
  >() => Value extends Expected ? 1 : 2
    ? true
    : false
type Assert<Value extends true> = Value

describe('StatusRepositoryOutput', () => {
  it('keeps output fields explicit and systemKey nullable', () => {
    const status: StatusRepositoryOutput = {
      id: 'status-1',
      code: 'AVAILABLE',
      name: 'Available',
      allowTransactions: true,
      systemKey: InventoryStatusKey.AVAILABLE,
      createdAt: new Date(),
    }
    const customStatus: StatusRepositoryOutput = {
      ...status,
      systemKey: null,
    }

    expect(status.systemKey).toBe(InventoryStatusKey.AVAILABLE)
    expect(customStatus.systemKey).toBeNull()
  })

  const staleStatus: StatusRepositoryOutput = {
    id: 'status-1',
    code: 'AVAILABLE',
    name: 'Available',
    allowTransactions: true,
    systemKey: null,
    createdAt: new Date(),
    // @ts-expect-error deletedAt is not part of the status output contract.
    deletedAt: null,
  }

  void staleStatus

  type StatusKeyIsNullableEnum = Assert<
    Equal<StatusRepositoryOutput['systemKey'], InventoryStatusKey | null>
  >
  const statusKeyTypeCheck: StatusKeyIsNullableEnum = true
  void statusKeyTypeCheck

  // @ts-expect-error systemKey is required, even for custom statuses.
  const missingSystemKey: StatusRepositoryOutput = {
    id: 'status-1',
    code: 'AVAILABLE',
    name: 'Available',
    allowTransactions: true,
    createdAt: new Date(),
  }

  void missingSystemKey
})
