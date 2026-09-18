export interface UnitMovement {
  unitId: string
  previousStatusId?: string | null
  conditionId?: string
  note?: string
}

export interface MoveUnitsInput {
  units: UnitMovement[]
  newStatusId: string
  transactionTypeId: string
  note: string
  changedById: string
}

export interface UnitMovementOperations {
  updateStatuses(input: { unitIds: string[]; statusId: string }): Promise<void>
  updateCondition(input: { unitId: string; conditionId: string }): Promise<void>
  record(input: {
    unitId: string
    transactionTypeId: string
    previousStatusId?: string | null
    newStatusId: string
    note: string
    changedById: string
  }): Promise<void>
}

export async function moveUnitsAndRecord(
  operations: UnitMovementOperations,
  input: MoveUnitsInput,
): Promise<void> {
  const unitIds = input.units.map((unit) => unit.unitId)
  if (unitIds.length === 0) return

  await operations.updateStatuses({
    unitIds,
    statusId: input.newStatusId,
  })

  for (const unit of input.units) {
    if (unit.conditionId) {
      await operations.updateCondition({
        unitId: unit.unitId,
        conditionId: unit.conditionId,
      })
    }

    await operations.record({
      unitId: unit.unitId,
      transactionTypeId: input.transactionTypeId,
      ...(unit.previousStatusId
        ? { previousStatusId: unit.previousStatusId }
        : {}),
      newStatusId: input.newStatusId,
      note: unit.note ?? input.note,
      changedById: input.changedById,
    })
  }
}
