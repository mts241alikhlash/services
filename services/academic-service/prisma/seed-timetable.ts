import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { pgSslOptions } from './pg-ssl.js'
import { Day } from '@prisma/client'
import { seedTeachingPlan } from './seeds/modules/teaching-plan.seed.js'
import {
  seedTimetable,
  type TimetablePeriod,
} from './seeds/modules/timetable.seed.js'

function toPeriod(slot: {
  id: string
  startTime: Date
  endTime: Date
  type: { isLesson: boolean; days: Day[] }
}): TimetablePeriod {
  const minutes = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes()
  return {
    id: slot.id,
    startMinutes: minutes(slot.startTime),
    endMinutes: minutes(slot.endTime),
    isLesson: slot.type.isLesson,
    days: slot.type.days,
  }
}

const connectionString = process.env.DATABASE_URL ?? ''
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    ...pgSslOptions(connectionString),
  }),
})

async function main() {
  const semester = await prisma.semester.findFirst({
    where: { isActive: true, deletedAt: null },
    select: { id: true, academicYearId: true },
  })
  if (!semester) throw new Error('No active semester on this box.')

  const classrooms = await prisma.classroom.findMany({
    where: {
      deletedAt: null,
      academicYearId: semester.academicYearId,
    },
    select: { id: true, code: true },
    orderBy: { code: 'asc' },
  })
  if (classrooms.length === 0) {
    throw new Error('No classrooms in the active academic year on this box.')
  }

  const slots = await prisma.timeSlot.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      type: { select: { isLesson: true, days: true } },
    },
    orderBy: { order: 'asc' },
  })

  console.log('\n=== Teaching plan ===\n')
  await seedTeachingPlan(prisma, semester.id, classrooms)

  console.log('\n=== Timetable ===\n')
  await seedTimetable(prisma, semester.id, classrooms, slots.map(toPeriod))
  console.log('')
}

main()
  .catch((e) => {
    console.error('\n✗ Timetable failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
