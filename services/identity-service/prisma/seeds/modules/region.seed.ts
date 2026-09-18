import { readFile } from 'node:fs/promises'
import { PrismaClient } from '@prisma/client'
import {
  parseRegions,
  sortForInsert,
} from '../../../src/reference-data/region/domain/region-code.js'

export async function seedRegions(prisma: PrismaClient, file: string) {
  const source = await readFile(file, 'utf8')
  const records = sortForInsert(parseRegions(source))

  if (records.length === 0) {
    throw new Error(
      `No region rows found in ${file}. Expected INSERT statements or "code,name" lines.`,
    )
  }

  const known = new Set(records.map((r) => r.code))
  const orphans = records.filter(
    (r) => r.parentCode !== null && !known.has(r.parentCode),
  )
  if (orphans.length > 0) {
    throw new Error(
      `${orphans.length} area(s) name a parent that is not in the file, starting with ${orphans[0].code}.`,
    )
  }

  let written = 0
  for (let i = 0; i < records.length; i += 1000) {
    const batch = records.slice(i, i + 1000)
    for (const record of batch) {
      await prisma.region.upsert({
        where: { code: record.code },
        update: {
          name: record.name,
          level: record.level,
          parentCode: record.parentCode,
        },
        create: record,
      })
    }
    written += batch.length
    console.log(`  ${written}/${records.length}`)
  }

  const counts = await prisma.region.groupBy({
    by: ['level'],
    _count: { _all: true },
  })
  for (const row of counts) {
    console.log(`  ${row.level}: ${row._count._all}`)
  }
}
