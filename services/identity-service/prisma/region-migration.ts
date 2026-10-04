import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  parseRegions,
  sortForInsert,
  type RegionRecord,
} from '../src/reference-data/region/domain/region-code.js'

const [file, name] = process.argv.slice(2)
if (!file || !name) {
  throw new Error(
    'Usage: pnpm regions:migration <wilayah.sql> <migration_name>. The file ' +
      'comes from https://github.com/cahyadsn/wilayah (db/wilayah.sql) or is ' +
      'any file of "code,name" lines.',
  )
}

const records = sortForInsert(parseRegions(readFileSync(file, 'utf8')))
if (records.length === 0) {
  throw new Error(`No region rows found in ${file}.`)
}
const known = new Set(records.map((r) => r.code))
const orphan = records.find((r) => r.parentCode && !known.has(r.parentCode))
if (orphan) {
  throw new Error(`${orphan.code} names a parent that is not in the file.`)
}

const quote = (value: string | null) =>
  value === null ? 'NULL' : `'${value.replace(/'/g, "''")}'`
const row = (r: RegionRecord) =>
  `  (${quote(r.code)}, ${quote(r.name)}, '${r.level}', ${quote(r.parentCode)})`

const statements: string[] = []
for (let i = 0; i < records.length; i += 1000) {
  statements.push(
    'INSERT INTO "regions" ("code", "name", "level", "parent_code") VALUES\n' +
      records
        .slice(i, i + 1000)
        .map(row)
        .join(',\n') +
      '\nON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", ' +
      '"level" = EXCLUDED."level", "parent_code" = EXCLUDED."parent_code";\n',
  )
}

const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
const dir = path.join('prisma/migrations', `${stamp}_${name}`)
mkdirSync(dir, { recursive: true })
writeFileSync(path.join(dir, 'migration.sql'), statements.join('\n'))
console.log(`${dir}: ${records.length} areas`)
