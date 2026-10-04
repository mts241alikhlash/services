import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INCOME_RANGE_IDS } from './income-range.ids.js'

describe('INCOME_RANGE_IDS', () => {
  it('names the rows the migration inserts, one per value of the old enum', () => {
    const sql = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'prisma',
        'migrations',
        '20261004000000_init',
        'migration.sql',
      ),
      'utf8',
    )
    expect(Object.keys(INCOME_RANGE_IDS)).toEqual([
      'BELOW_500K',
      'BETWEEN_500K_1M',
      'BETWEEN_1M_2M',
      'BETWEEN_2M_3M',
      'ABOVE_3M',
    ])
    for (const id of Object.values(INCOME_RANGE_IDS)) {
      expect(sql).toContain(`'${id}'`)
    }
  })
})
