import { readFileSync } from 'node:fs'

describe('asset Prisma transaction ownership', () => {
  it('keeps the asset-unit repository as a delegation shell', () => {
    const source = readFileSync(
      'src/inventory/asset/infrastructure/persistence/prisma/prisma-asset-unit.repository.ts',
      'utf8',
    )

    expect(source).not.toMatch(/this\.prisma\.inventoryAssetUnit/)
    expect(source).toMatch(/return findAllUnits\(/)
    expect(source).toMatch(/return createUnit\(/)
  })

  it('keeps the asset repository as a delegation shell', () => {
    const source = readFileSync(
      'src/inventory/asset/infrastructure/persistence/prisma/prisma-asset.repository.ts',
      'utf8',
    )

    expect(source).not.toMatch(/this\.prisma\.inventoryAsset/)
    expect(source).toMatch(/return findAllAssets\(/)
    expect(source).toMatch(/return createAsset\(/)
  })

  it('writes foreign IDs as scalar fields instead of relation operations', () => {
    const source = [
      'src/inventory/asset/infrastructure/persistence/prisma/prisma-asset.repository.ts',
      'src/inventory/asset/infrastructure/persistence/prisma/prisma-asset.writer.ts',
      'src/inventory/asset/infrastructure/persistence/prisma/prisma-asset-unit.repository.ts',
      'src/inventory/asset/infrastructure/persistence/prisma/prisma-asset-unit.writer.ts',
    ]
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')

    expect(source).not.toMatch(/\b(connect|disconnect):/)
    expect(source).toMatch(/categoryId/)
    expect(source).toMatch(/conditionId/)
    expect(source).toMatch(/statusId/)
    expect(source).toMatch(/locationId/)
  })

  it('does not introduce a transaction spanning foreign-owned models', () => {
    const source = [
      'src/inventory/asset/infrastructure/persistence/prisma/prisma-asset.repository.ts',
      'src/inventory/asset/infrastructure/persistence/prisma/prisma-asset.writer.ts',
      'src/inventory/asset/infrastructure/persistence/prisma/prisma-asset-unit.repository.ts',
      'src/inventory/asset/infrastructure/persistence/prisma/prisma-asset-unit.writer.ts',
    ]
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')

    expect(source).not.toMatch(
      /\$transaction[\s\S]*(inventoryLoan|inventoryHistory|approvalWorkflow|approvalInstance)/,
    )
  })
})
