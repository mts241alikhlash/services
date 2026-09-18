import { PrismaClient } from '@prisma/client'

export interface PlanInput {
  classroomIds: string[]
  subjectIds: string[]
  employeeIds: string[]
}

export type TeachingPlan = Map<string, string>

export const planKey = (classroomId: string, subjectId: string) =>
  `${classroomId}|${subjectId}`

export function planTeaching({
  classroomIds,
  subjectIds,
  employeeIds,
}: PlanInput): TeachingPlan {
  const plan: TeachingPlan = new Map()
  if (subjectIds.length === 0 || employeeIds.length === 0) return plan

  const staffOf = new Map<string, string[]>(subjectIds.map((id) => [id, []]))
  for (const [index, employeeId] of employeeIds.entries()) {
    const subjectId = subjectIds[index % subjectIds.length]
    staffOf.get(subjectId)!.push(employeeId)
  }

  for (const subjectId of subjectIds) {
    const staff = staffOf.get(subjectId)!
    if (staff.length === 0) continue

    for (const [index, classroomId] of classroomIds.entries()) {
      plan.set(planKey(classroomId, subjectId), staff[index % staff.length])
    }
  }

  return plan
}

export async function seedTeachingPlan(
  prisma: PrismaClient,
  semesterId: string,
  classrooms: { id: string; code: string }[],
) {
  const subjects = await prisma.subject.findMany({
    where: { deletedAt: null },
    select: { id: true },
    orderBy: { code: 'asc' },
  })

  const employeeIds = (process.env.SEED_EMPLOYEE_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  if (subjects.length === 0 || employeeIds.length === 0) {
    console.log(
      '  no subjects here, or SEED_EMPLOYEE_IDS is unset, skipping the plan',
    )
    return
  }

  const plan = planTeaching({
    classroomIds: classrooms.map((c) => c.id),
    subjectIds: subjects.map((s) => s.id),
    employeeIds,
  })

  const existing = await prisma.teachingAssignment.findMany({
    where: {
      deletedAt: null,
      semesterId,
      classroomId: { in: classrooms.map((c) => c.id) },
    },
    select: {
      id: true,
      classroomId: true,
      subjectId: true,
      employeeId: true,
    },
  })

  const byPair = new Map<string, typeof existing>()
  for (const row of existing) {
    const key = planKey(row.classroomId, row.subjectId)
    byPair.set(key, [...(byPair.get(key) ?? []), row])
  }

  let retired = 0
  const existingBy = new Map<string, (typeof existing)[number]>()

  for (const [key, rows] of byPair) {
    const owner = plan.get(key)
    const ranked = [...rows].sort(
      (a, b) =>
        Number(b.employeeId === owner) - Number(a.employeeId === owner) ||
        a.id.localeCompare(b.id),
    )

    const [keep, ...extras] = ranked
    existingBy.set(key, keep)

    for (const extra of extras) {
      await prisma.$transaction([
        prisma.schedule.updateMany({
          where: { teachingAssignmentId: extra.id, deletedAt: null },
          data: { deletedAt: new Date() },
        }),
        prisma.teachingAssignment.update({
          where: { id: extra.id },
          data: { deletedAt: new Date() },
        }),
      ])
      retired++
    }
  }

  let reassigned = 0
  let created = 0

  for (const [key, employeeId] of plan) {
    const row = existingBy.get(key)

    if (row) {
      if (row.employeeId !== employeeId) {
        await prisma.teachingAssignment.update({
          where: { id: row.id },
          data: { employeeId },
        })
        reassigned++
      }
      continue
    }

    const [classroomId, subjectId] = key.split('|')

    const buried = await prisma.teachingAssignment.findFirst({
      where: {
        classroomId,
        subjectId,
        semesterId,
        deletedAt: { not: null },
      },
      select: { id: true },
    })

    if (buried) {
      await prisma.teachingAssignment.update({
        where: { id: buried.id },
        data: { employeeId, deletedAt: null },
      })
    } else {
      await prisma.teachingAssignment.create({
        data: { classroomId, subjectId, semesterId, employeeId },
      })
    }
    created++
  }

  const staffed = new Set(plan.values()).size
  console.log(
    `  ${plan.size} pairings planned — ${created} created, ` +
      `${reassigned} reassigned, ${retired} duplicates retired`,
  )
  console.log(
    `  ${staffed} of ${employeeIds.length} employees hold teaching, ` +
      `${subjects.length} subjects across ${classrooms.length} classes`,
  )
}
