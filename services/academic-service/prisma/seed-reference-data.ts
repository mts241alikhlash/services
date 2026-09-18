import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { pgSslOptions } from '../src/core/database/pg-ssl.js'
import { seedAcademicCalendarTypes } from './seeds/modules/academic-calendar-type.seed.js'
import { seedEducations } from './seeds/modules/education.seed.js'
import { seedOccupations } from './seeds/modules/occupation.seed.js'
import { seedAcademicCalendar } from './seeds/modules/academic-calendar.seed.js'

const connectionString = process.env.DATABASE_URL ?? ''
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    ...pgSslOptions(connectionString),
  }),
})

async function main() {
  console.log('\n=== Academic reference data ===\n')

  const academicYear = await prisma.academicYear.findFirst({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, startYear: true },
  })
  if (!academicYear) throw new Error('No active academic year on this box.')

  const semesters = await prisma.semester.findMany({
    where: { academicYearId: academicYear.id, deletedAt: null },
    select: { id: true, type: { select: { name: true } } },
  })

  console.log(`  ${academicYear.name}: ${semesters.length} semester\n`)

  await seedOccupations(prisma)
  await seedEducations(prisma)
  await seedAcademicCalendarTypes(prisma)
  await seedAcademicCalendar(
    prisma,
    academicYear.id,
    semesters.map((s) => ({ id: s.id, typeName: s.type.name })),
    academicYear.startYear,
  )

  console.log('')
}

main()
  .catch((e) => {
    console.error('\n✗ Reference data seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
